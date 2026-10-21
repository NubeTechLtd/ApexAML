ALTER TABLE public.user_institutions ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'analyst';
ALTER TABLE public.user_institutions ADD CONSTRAINT institution_role_values CHECK (role IN ('analyst','compliance_officer','institution_admin'));
ALTER TABLE public.user_roles ADD CONSTRAINT platform_staff_roles_only CHECK (role::text = 'platform_admin');
CREATE TABLE public.support_access_grants (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, institution_id uuid NOT NULL REFERENCES public.institutions(id), justification text NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), expires_at timestamptz NOT NULL DEFAULT (now()+interval '30 minutes'), revoked_at timestamptz);
GRANT SELECT ON public.support_access_grants TO authenticated;
GRANT ALL ON public.support_access_grants TO service_role;
ALTER TABLE public.support_access_grants ENABLE ROW LEVEL SECURITY;
CREATE POLICY own_support_grants ON public.support_access_grants FOR SELECT TO authenticated USING(user_id=auth.uid());
CREATE OR REPLACE FUNCTION private.is_platform_admin() RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$ SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id=auth.uid() AND role::text='platform_admin') $$;
CREATE OR REPLACE FUNCTION private.tenant_role(_institution uuid,_roles text[]) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$ SELECT EXISTS(SELECT 1 FROM public.user_institutions WHERE user_id=auth.uid() AND institution_id=_institution AND role=ANY(_roles)) $$;
CREATE OR REPLACE FUNCTION private.tenant_read(_institution uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$ SELECT private.tenant_role(_institution,ARRAY['analyst','compliance_officer','institution_admin']) OR (private.is_platform_admin() AND auth.jwt()->>'aal'='aal2' AND EXISTS(SELECT 1 FROM public.support_access_grants WHERE user_id=auth.uid() AND institution_id=_institution AND revoked_at IS NULL AND expires_at>now())) $$;
CREATE OR REPLACE FUNCTION private.is_institution_member(_institution_id uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$ SELECT private.tenant_role(_institution_id,ARRAY['analyst','compliance_officer','institution_admin']) $$;
CREATE OR REPLACE FUNCTION private.customer_institution(_customer text) RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$ SELECT CASE WHEN count(DISTINCT institution_id)=1 THEN (array_agg(institution_id))[1] ELSE NULL END FROM public.customers WHERE id::text=_customer OR bvn=_customer OR nuban=_customer $$;
GRANT USAGE ON SCHEMA private TO authenticated;
GRANT EXECUTE ON FUNCTION private.is_platform_admin(),private.tenant_role(uuid,text[]),private.tenant_read(uuid),private.customer_institution(text) TO authenticated;
DO $do$ DECLARE p record; q text; c text; BEGIN FOR p IN SELECT * FROM pg_policies WHERE schemaname IN ('public','storage') AND (coalesce(qual,'') LIKE '%admin%' OR coalesce(with_check,'') LIKE '%admin%') LOOP q:=replace(p.qual,'''admin''::app_role','''platform_admin''::app_role'); c:=replace(p.with_check,'''admin''::app_role','''platform_admin''::app_role'); EXECUTE format('ALTER POLICY %I ON %I.%I %s %s',p.policyname,p.schemaname,p.tablename,CASE WHEN q IS NOT NULL THEN 'USING ('||q||')' ELSE '' END,CASE WHEN c IS NOT NULL THEN 'WITH CHECK ('||c||')' ELSE '' END); END LOOP; END $do$;
DO $do$ DECLARE p record; BEGIN FOR p IN SELECT * FROM pg_policies WHERE schemaname='public' AND tablename=ANY(ARRAY['alerts','customers','transactions','institutions','audit_log','ctr_queue','customer_risk_scores','kyc_documents','adverse_media_results','risk_score_history','str_drafts','str_exports','transaction_queue','user_institutions','user_roles']) LOOP EXECUTE format('DROP POLICY %I ON public.%I',p.policyname,p.tablename); END LOOP; END $do$;
CREATE POLICY own_platform_role ON public.user_roles FOR SELECT TO authenticated USING(user_id=auth.uid() OR private.is_platform_admin());
CREATE POLICY own_memberships ON public.user_institutions FOR SELECT TO authenticated USING(user_id=auth.uid() OR private.tenant_role(institution_id,ARRAY['institution_admin']));
CREATE POLICY tenant_read ON public.institutions FOR SELECT TO authenticated USING(private.tenant_read(id));
DO $do$ DECLARE t text; op text; expr text; roles text; BEGIN
FOREACH t IN ARRAY ARRAY['alerts','customers','transactions'] LOOP
 EXECUTE format('CREATE POLICY tenant_read ON public.%I FOR SELECT TO authenticated USING(private.tenant_read(institution_id))',t);
 expr:='private.tenant_role(institution_id,ARRAY[''analyst'',''compliance_officer'',''institution_admin''])';
 EXECUTE format('CREATE POLICY tenant_insert ON public.%I FOR INSERT TO authenticated WITH CHECK(%s)',t,expr);
 EXECUTE format('CREATE POLICY tenant_update ON public.%I FOR UPDATE TO authenticated USING(%s) WITH CHECK(%s)',t,expr,expr);
END LOOP;
FOREACH t IN ARRAY ARRAY['ctr_queue','customer_risk_scores','kyc_documents','adverse_media_results','risk_score_history'] LOOP
 EXECUTE format('CREATE POLICY tenant_read ON public.%I FOR SELECT TO authenticated USING(private.tenant_read(private.customer_institution(customer_id)))',t);
 IF t=ANY(ARRAY['kyc_documents','adverse_media_results']) THEN
 expr:='private.tenant_role(private.customer_institution(customer_id),ARRAY[''analyst'',''compliance_officer'',''institution_admin''])';
 EXECUTE format('CREATE POLICY tenant_insert ON public.%I FOR INSERT TO authenticated WITH CHECK(%s)',t,expr);
 EXECUTE format('CREATE POLICY tenant_update ON public.%I FOR UPDATE TO authenticated USING(%s) WITH CHECK(%s)',t,expr,expr);
 expr:='private.tenant_role(private.customer_institution(customer_id),ARRAY[''compliance_officer'',''institution_admin''])';
 EXECUTE format('CREATE POLICY tenant_delete ON public.%I FOR DELETE TO authenticated USING(%s)',t,expr);
 ELSIF t='ctr_queue' THEN
 expr:='private.tenant_role(private.customer_institution(customer_id),ARRAY[''compliance_officer'',''institution_admin''])';
 EXECUTE format('CREATE POLICY tenant_update ON public.%I FOR UPDATE TO authenticated USING(%s) WITH CHECK(%s)',t,expr,expr);
 ELSIF t='risk_score_history' THEN
 EXECUTE format('CREATE POLICY tenant_insert ON public.%I FOR INSERT TO authenticated WITH CHECK(private.tenant_role(private.customer_institution(customer_id),ARRAY[''compliance_officer'',''institution_admin'']))',t);
 END IF;
END LOOP;
FOREACH t IN ARRAY ARRAY['str_drafts','str_exports'] LOOP
 EXECUTE format('CREATE POLICY tenant_read ON public.%I FOR SELECT TO authenticated USING(EXISTS(SELECT 1 FROM public.alerts a WHERE a.id=alert_id AND private.tenant_read(a.institution_id)))',t);
 expr:='EXISTS(SELECT 1 FROM public.alerts a WHERE a.id=alert_id AND private.tenant_role(a.institution_id,ARRAY[''analyst'',''compliance_officer'',''institution_admin'']))';
 EXECUTE format('CREATE POLICY tenant_insert ON public.%I FOR INSERT TO authenticated WITH CHECK(%s)',t,expr);
 IF t='str_drafts' THEN EXECUTE format('CREATE POLICY tenant_update ON public.%I FOR UPDATE TO authenticated USING(%s) WITH CHECK(%s)',t,expr,expr); END IF;
END LOOP;
END $do$;
CREATE POLICY tenant_read ON public.transaction_queue FOR SELECT TO authenticated USING(private.tenant_read(private.customer_institution(account_number)));
CREATE POLICY tenant_read ON public.audit_log FOR SELECT TO authenticated USING(private.tenant_read(institution_id));
CREATE POLICY tenant_append ON public.audit_log FOR INSERT TO authenticated WITH CHECK(user_id=auth.uid() AND private.tenant_role(institution_id,ARRAY['analyst','compliance_officer','institution_admin']) AND action NOT LIKE 'SUPPORT_ACCESS_%');
CREATE OR REPLACE FUNCTION public.scope_audit_entry() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$ DECLARE inst uuid; BEGIN IF auth.uid() IS NOT NULL THEN NEW.user_id:=auth.uid(); NEW.actor_id:=auth.uid(); NEW.user_name:=coalesce(auth.jwt()->>'email','Unknown'); NEW.actor_name:=NEW.user_name; IF NEW.institution_id IS NULL THEN SELECT institution_id INTO inst FROM public.alerts WHERE case_id=NEW.resource OR id::text=NEW.resource LIMIT 1; IF inst IS NULL THEN inst:=private.customer_institution(NEW.resource); END IF; IF inst IS NULL THEN SELECT CASE WHEN count(*)=1 THEN (array_agg(institution_id))[1] ELSE NULL END INTO inst FROM public.user_institutions WHERE user_id=auth.uid(); END IF; NEW.institution_id:=inst; END IF; END IF; RETURN NEW; END $$;
CREATE TRIGGER scope_audit_entry BEFORE INSERT ON public.audit_log FOR EACH ROW EXECUTE FUNCTION public.scope_audit_entry();
CREATE OR REPLACE FUNCTION private.kyc_path_institution(_path text) RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$ SELECT private.customer_institution(split_part(_path,'/',2)) $$;
DO $do$ DECLARE p record; BEGIN FOR p IN SELECT * FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND (coalesce(qual,'')||coalesce(with_check,'')) LIKE '%kyc-documents%' LOOP EXECUTE format('DROP POLICY %I ON storage.objects',p.policyname); END LOOP; END $do$;
CREATE POLICY tenant_read_kyc_files ON storage.objects FOR SELECT TO authenticated USING(bucket_id='kyc-documents' AND private.tenant_read(private.kyc_path_institution(name)));
CREATE POLICY tenant_upload_kyc_files ON storage.objects FOR INSERT TO authenticated WITH CHECK(bucket_id='kyc-documents' AND private.tenant_role(private.kyc_path_institution(name),ARRAY['analyst','compliance_officer','institution_admin']));
CREATE POLICY tenant_update_kyc_files ON storage.objects FOR UPDATE TO authenticated USING(bucket_id='kyc-documents' AND private.tenant_role(private.kyc_path_institution(name),ARRAY['compliance_officer','institution_admin'])) WITH CHECK(bucket_id='kyc-documents' AND private.tenant_role(private.kyc_path_institution(name),ARRAY['compliance_officer','institution_admin']));
CREATE POLICY tenant_delete_kyc_files ON storage.objects FOR DELETE TO authenticated USING(bucket_id='kyc-documents' AND private.tenant_role(private.kyc_path_institution(name),ARRAY['institution_admin']));
CREATE OR REPLACE FUNCTION public.support_institutions() RETURNS TABLE(id uuid,name text) LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$ SELECT i.id,i.name FROM public.institutions i WHERE private.is_platform_admin() AND auth.jwt()->>'aal'='aal2' $$;
CREATE OR REPLACE FUNCTION public.end_support_access() RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$ DECLARE g record; BEGIN IF NOT private.is_platform_admin() THEN RAISE EXCEPTION 'Platform staff access required'; END IF; FOR g IN UPDATE public.support_access_grants SET revoked_at=now() WHERE user_id=auth.uid() AND revoked_at IS NULL RETURNING * LOOP INSERT INTO public.audit_log(user_id,user_name,institution_id,action,resource,justification,metadata) VALUES(auth.uid(),coalesce(auth.jwt()->>'email','Unknown'),g.institution_id,'SUPPORT_ACCESS_ENDED',g.id::text,g.justification,jsonb_build_object('grant_id',g.id)); END LOOP; END $$;
CREATE OR REPLACE FUNCTION public.start_support_access(_institution_id uuid,_justification text,_confirmed boolean) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$ DECLARE gid uuid; BEGIN IF NOT private.is_platform_admin() OR auth.jwt()->>'aal' IS DISTINCT FROM 'aal2' THEN RAISE EXCEPTION 'Platform staff MFA required'; END IF; IF NOT coalesce(_confirmed,false) OR length(trim(coalesce(_justification,'')))<20 THEN RAISE EXCEPTION 'Confirm support access and provide at least 20 characters of justification'; END IF; PERFORM pg_advisory_xact_lock(hashtextextended(auth.uid()::text,0)); PERFORM public.end_support_access(); INSERT INTO public.support_access_grants(user_id,institution_id,justification) VALUES(auth.uid(),_institution_id,trim(_justification)) RETURNING id INTO gid; INSERT INTO public.audit_log(user_id,user_name,institution_id,action,resource,justification,metadata) VALUES(auth.uid(),coalesce(auth.jwt()->>'email','Unknown'),_institution_id,'SUPPORT_ACCESS_STARTED',gid::text,trim(_justification),jsonb_build_object('grant_id',gid,'access','read_only','expires_at',now()+interval '30 minutes')); RETURN gid; END $$;
REVOKE ALL ON FUNCTION public.support_institutions(),public.start_support_access(uuid,text,boolean),public.end_support_access() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.support_institutions(),public.start_support_access(uuid,text,boolean),public.end_support_access() TO authenticated;
REVOKE ALL ON FUNCTION private.kyc_path_institution(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.kyc_path_institution(text) TO authenticated;