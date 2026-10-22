CREATE OR REPLACE FUNCTION private.is_institution_member(_institution_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO ''
AS $$ SELECT EXISTS(SELECT 1 FROM public.user_institutions WHERE user_id=auth.uid() AND institution_id=_institution_id) $$;

CREATE OR REPLACE FUNCTION private.has_institution_role(_institution_id uuid, _role text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO ''
AS $$ SELECT EXISTS(SELECT 1 FROM public.user_institutions WHERE user_id=auth.uid() AND institution_id=_institution_id AND role=_role) $$;

CREATE OR REPLACE FUNCTION private.default_institution()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO ''
AS $$ SELECT CASE WHEN count(*)=1 THEN (array_agg(id))[1] ELSE NULL END FROM public.institutions $$;

CREATE OR REPLACE FUNCTION private.path_institution(_path text)
RETURNS uuid LANGUAGE sql IMMUTABLE SET search_path TO ''
AS $$ SELECT CASE WHEN split_part(_path,'/',1) ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN split_part(_path,'/',1)::uuid ELSE NULL END $$;

REVOKE ALL ON FUNCTION private.is_institution_member(uuid), private.has_institution_role(uuid,text), private.default_institution(), private.path_institution(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.is_institution_member(uuid), private.has_institution_role(uuid,text), private.default_institution(), private.path_institution(text) TO authenticated, service_role;

-- Fills institution_id from the linked customer when a writer omits it.
CREATE OR REPLACE FUNCTION public.fill_institution_id()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $$
DECLARE key text;
BEGIN
  IF NEW.institution_id IS NULL THEN
    key := CASE WHEN TG_TABLE_NAME='transaction_queue' THEN to_jsonb(NEW)->>'account_number' ELSE to_jsonb(NEW)->>'customer_id' END;
    NEW.institution_id := coalesce(private.customer_institution(key), private.default_institution());
  END IF;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.fill_institution_id() FROM PUBLIC, anon, authenticated;

ALTER TABLE public.kyc_documents ADD COLUMN institution_id uuid REFERENCES public.institutions(id);
ALTER TABLE public.adverse_media_results ADD COLUMN institution_id uuid REFERENCES public.institutions(id);
ALTER TABLE public.ctr_queue ADD COLUMN institution_id uuid REFERENCES public.institutions(id);
ALTER TABLE public.transaction_queue ADD COLUMN institution_id uuid REFERENCES public.institutions(id);
ALTER TABLE public.customer_risk_scores ADD COLUMN institution_id uuid REFERENCES public.institutions(id);
ALTER TABLE public.risk_score_history ADD COLUMN institution_id uuid REFERENCES public.institutions(id);

UPDATE public.kyc_documents SET institution_id = coalesce(private.customer_institution(customer_id), private.default_institution());
UPDATE public.adverse_media_results SET institution_id = coalesce(private.customer_institution(customer_id), private.default_institution());
UPDATE public.ctr_queue SET institution_id = coalesce(private.customer_institution(customer_id), private.default_institution());
UPDATE public.transaction_queue SET institution_id = coalesce(private.customer_institution(account_number), private.default_institution());
UPDATE public.customer_risk_scores SET institution_id = coalesce(private.customer_institution(customer_id), private.default_institution());
UPDATE public.risk_score_history SET institution_id = coalesce(private.customer_institution(customer_id), private.default_institution());

ALTER TABLE public.kyc_documents ALTER COLUMN institution_id SET NOT NULL;
ALTER TABLE public.adverse_media_results ALTER COLUMN institution_id SET NOT NULL;
ALTER TABLE public.ctr_queue ALTER COLUMN institution_id SET NOT NULL;
ALTER TABLE public.transaction_queue ALTER COLUMN institution_id SET NOT NULL;
ALTER TABLE public.customer_risk_scores ALTER COLUMN institution_id SET NOT NULL;
ALTER TABLE public.risk_score_history ALTER COLUMN institution_id SET NOT NULL;

DO $$
DECLARE t text; p record;
BEGIN
  FOREACH t IN ARRAY ARRAY['kyc_documents','adverse_media_results','ctr_queue','transaction_queue','customer_risk_scores','risk_score_history'] LOOP
    EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON public.%I (institution_id)', t||'_institution_idx', t);
    EXECUTE format('CREATE TRIGGER fill_institution_id BEFORE INSERT ON public.%I FOR EACH ROW EXECUTE FUNCTION public.fill_institution_id()', t);
    FOR p IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename=t LOOP
      EXECUTE format('DROP POLICY %I ON public.%I', p.policyname, t);
    END LOOP;
    EXECUTE format('REVOKE DELETE ON public.%I FROM authenticated, anon', t);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE ON public.%I TO authenticated', t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
    EXECUTE format('CREATE POLICY member_select ON public.%I FOR SELECT TO authenticated USING (private.is_institution_member(institution_id))', t);
    EXECUTE format('CREATE POLICY member_insert ON public.%I FOR INSERT TO authenticated WITH CHECK (private.is_institution_member(institution_id))', t);
    EXECUTE format('CREATE POLICY member_update ON public.%I FOR UPDATE TO authenticated USING (private.is_institution_member(institution_id)) WITH CHECK (private.is_institution_member(institution_id))', t);
  END LOOP;
END $$;

DROP POLICY IF EXISTS "Admins read nfiu list" ON storage.objects;
DROP POLICY IF EXISTS "Admins upload nfiu list" ON storage.objects;
DROP POLICY IF EXISTS tenant_delete_kyc_files ON storage.objects;
DROP POLICY IF EXISTS tenant_read_kyc_files ON storage.objects;
DROP POLICY IF EXISTS tenant_update_kyc_files ON storage.objects;
DROP POLICY IF EXISTS tenant_upload_kyc_files ON storage.objects;

CREATE POLICY member_read_scoped_files ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id IN ('kyc-documents','nfiu-list-uploads') AND private.is_institution_member(private.path_institution(name)));
CREATE POLICY member_upload_scoped_files ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id IN ('kyc-documents','nfiu-list-uploads') AND private.is_institution_member(private.path_institution(name)));
CREATE POLICY member_update_scoped_files ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id IN ('kyc-documents','nfiu-list-uploads') AND private.is_institution_member(private.path_institution(name)))
  WITH CHECK (bucket_id IN ('kyc-documents','nfiu-list-uploads') AND private.is_institution_member(private.path_institution(name)));

COMMENT ON FUNCTION private.kyc_path_institution(text) IS 'DEPRECATED: storage paths now start with institution_id; use private.path_institution.';