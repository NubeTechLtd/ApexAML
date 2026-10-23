LOCK TABLE public.audit_log IN ACCESS EXCLUSIVE MODE;
ALTER TABLE public.audit_log ADD COLUMN prev_hash text, ADD COLUMN row_hash text, ADD COLUMN chain_index bigint;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM public.audit_log WHERE institution_id IS NULL) AND (SELECT count(*) FROM public.institutions) <> 1 THEN
    RAISE EXCEPTION 'Unscoped audit records require an explicit institution mapping';
  END IF;
END $$;
UPDATE public.audit_log a SET institution_id = coalesce(
  (SELECT institution_id FROM public.alerts WHERE case_id=a.resource OR id::text=a.resource LIMIT 1),
  private.customer_institution(a.resource),
  (SELECT institution_id FROM public.user_institutions WHERE user_id=a.user_id ORDER BY created_at LIMIT 1),
  (SELECT id FROM public.institutions LIMIT 1)) WHERE institution_id IS NULL;
ALTER TABLE public.audit_log ALTER COLUMN institution_id SET NOT NULL;
CREATE OR REPLACE FUNCTION private.audit_content_hash(_row jsonb, _previous text)
RETURNS text LANGUAGE sql IMMUTABLE SET search_path = '' AS $$
 SELECT encode(extensions.digest(convert_to(_previous || (_row - 'row_hash' - 'prev_hash')::text, 'UTF8'), 'sha256'), 'hex')
$$;
DO $$ DECLARE r public.audit_log%ROWTYPE; last_institution uuid; previous text; position bigint;
BEGIN
 FOR r IN SELECT * FROM public.audit_log ORDER BY institution_id, occurred_at, id LOOP
  IF last_institution IS DISTINCT FROM r.institution_id THEN previous:=repeat('0',64); position:=0; END IF;
  position:=position+1; r.chain_index:=position; r.prev_hash:=previous;
  r.row_hash:=private.audit_content_hash(to_jsonb(r),previous);
  UPDATE public.audit_log SET chain_index=r.chain_index,prev_hash=r.prev_hash,row_hash=r.row_hash WHERE id=r.id;
  previous:=r.row_hash; last_institution:=r.institution_id;
 END LOOP;
END $$;
ALTER TABLE public.audit_log ALTER COLUMN prev_hash SET NOT NULL, ALTER COLUMN row_hash SET NOT NULL, ALTER COLUMN chain_index SET NOT NULL;
CREATE UNIQUE INDEX audit_log_institution_chain_index ON public.audit_log(institution_id,chain_index);
CREATE OR REPLACE FUNCTION public.scope_audit_entry()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE inst uuid;
BEGIN
 IF auth.uid() IS NOT NULL THEN
  IF NEW.user_id IS NOT NULL AND NEW.user_id <> auth.uid() THEN RAISE EXCEPTION 'Audit user must match the authenticated caller'; END IF;
  NEW.user_id:=auth.uid(); NEW.actor_id:=auth.uid(); NEW.user_name:=coalesce(auth.jwt()->>'email','Unknown'); NEW.actor_name:=NEW.user_name;
  IF NEW.institution_id IS NULL THEN
   SELECT institution_id INTO inst FROM public.alerts WHERE case_id=NEW.resource OR id::text=NEW.resource LIMIT 1;
   IF inst IS NULL THEN inst:=private.customer_institution(NEW.resource); END IF;
   IF inst IS NULL THEN SELECT CASE WHEN count(*)=1 THEN (array_agg(institution_id))[1] ELSE NULL END INTO inst FROM public.user_institutions WHERE user_id=auth.uid(); END IF;
   NEW.institution_id:=inst;
  END IF;
 END IF;
 RETURN NEW;
END $$;
CREATE OR REPLACE FUNCTION private.chain_audit_entry()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' SET timezone = 'UTC' SET datestyle = 'ISO, YMD' AS $$
DECLARE previous text; position bigint;
BEGIN
 IF NEW.institution_id IS NULL THEN RAISE EXCEPTION 'Audit institution is required'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended('audit-chain:' || NEW.institution_id::text,0));
 SELECT row_hash,chain_index INTO previous,position FROM public.audit_log WHERE institution_id=NEW.institution_id ORDER BY chain_index DESC LIMIT 1;
 NEW.chain_index:=coalesce(position,0)+1;
 NEW.prev_hash:=coalesce(previous,repeat('0',64));
 NEW.row_hash:=private.audit_content_hash(to_jsonb(NEW),NEW.prev_hash);
 RETURN NEW;
END $$;
CREATE TRIGGER zz_chain_audit_entry BEFORE INSERT ON public.audit_log FOR EACH ROW EXECUTE FUNCTION private.chain_audit_entry();
CREATE OR REPLACE FUNCTION private.reject_audit_mutation()
RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$ BEGIN RAISE EXCEPTION 'Audit log is append-only, hash-chained: % is forbidden',TG_OP; END $$;
CREATE TRIGGER reject_audit_update_delete BEFORE UPDATE OR DELETE ON public.audit_log FOR EACH ROW EXECUTE FUNCTION private.reject_audit_mutation();
CREATE TRIGGER reject_audit_truncate BEFORE TRUNCATE ON public.audit_log FOR EACH STATEMENT EXECUTE FUNCTION private.reject_audit_mutation();
DO $$ DECLARE p record; BEGIN FOR p IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='audit_log' LOOP EXECUTE format('DROP POLICY %I ON public.audit_log',p.policyname); END LOOP; END $$;
CREATE POLICY audit_member_insert ON public.audit_log FOR INSERT TO authenticated WITH CHECK (user_id=auth.uid() AND private.is_institution_member(institution_id));
CREATE POLICY audit_officer_select ON public.audit_log FOR SELECT TO authenticated USING (private.has_institution_role(institution_id,'compliance_officer') OR private.has_institution_role(institution_id,'institution_admin'));
REVOKE ALL PRIVILEGES ON public.audit_log FROM anon, PUBLIC;
REVOKE UPDATE, DELETE, TRUNCATE ON public.audit_log FROM authenticated;
GRANT SELECT, INSERT ON public.audit_log TO authenticated;
CREATE OR REPLACE FUNCTION public.verify_audit_chain(institution_id uuid)
RETURNS TABLE(is_valid boolean, checked_entries bigint, break_at bigint, reason text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' SET timezone = 'UTC' SET datestyle = 'ISO, YMD' AS $$
DECLARE r public.audit_log%ROWTYPE; previous text:=repeat('0',64); position bigint:=0;
BEGIN
 IF NOT (private.has_institution_role($1,'compliance_officer') OR private.has_institution_role($1,'institution_admin')) THEN RAISE EXCEPTION 'Institution compliance officer or administrator membership required' USING ERRCODE='42501'; END IF;
 FOR r IN SELECT a.* FROM public.audit_log a WHERE a.institution_id=$1 ORDER BY a.chain_index LOOP
  position:=position+1;
  IF r.chain_index<>position OR r.prev_hash<>previous OR r.row_hash<>private.audit_content_hash(to_jsonb(r),previous) THEN
   RETURN QUERY SELECT false,position,r.chain_index,'Audit chain break detected'::text; RETURN;
  END IF;
  previous:=r.row_hash;
 END LOOP;
 RETURN QUERY SELECT true,position,NULL::bigint,NULL::text;
END $$;
REVOKE ALL ON FUNCTION public.verify_audit_chain(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.verify_audit_chain(uuid) TO authenticated;
REVOKE ALL ON FUNCTION private.audit_content_hash(jsonb,text),private.chain_audit_entry(),private.reject_audit_mutation() FROM PUBLIC,anon,authenticated;
COMMENT ON TABLE public.audit_log IS 'Institution-scoped append-only, hash-chained audit trail. Verification detects content and chain-link breaks; it is not external cryptographic sealing.';