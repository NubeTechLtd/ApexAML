CREATE TABLE public.institution_profiles (
  institution_id uuid PRIMARY KEY REFERENCES public.institutions(id),
  legal_name text NOT NULL DEFAULT '',
  cbn_licence_number text NOT NULL DEFAULT '',
  goaml_entity_id text NOT NULL DEFAULT '',
  address text NOT NULL DEFAULT '',
  mlro_name text NOT NULL DEFAULT '',
  contact_email text NOT NULL DEFAULT '',
  contact_phone text NOT NULL DEFAULT '',
  version integer NOT NULL DEFAULT 1,
  updated_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.institution_profiles TO authenticated;
GRANT ALL ON public.institution_profiles TO service_role;
ALTER TABLE public.institution_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members read their institution profile" ON public.institution_profiles
  FOR SELECT TO authenticated USING (private.is_institution_member(institution_id));

CREATE TABLE public.institution_profile_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid NOT NULL REFERENCES public.institutions(id),
  version integer NOT NULL,
  snapshot jsonb NOT NULL,
  changed_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (institution_id, version)
);
GRANT SELECT ON public.institution_profile_versions TO authenticated;
GRANT ALL ON public.institution_profile_versions TO service_role;
ALTER TABLE public.institution_profile_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members read profile history" ON public.institution_profile_versions
  FOR SELECT TO authenticated USING (private.is_institution_member(institution_id));

CREATE OR REPLACE FUNCTION public.save_institution_profile(
  _institution_id uuid, _legal_name text, _cbn_licence_number text, _goaml_entity_id text,
  _address text, _mlro_name text, _contact_email text, _contact_phone text)
RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $$
DECLARE v integer; snap jsonb;
BEGIN
  IF auth.uid() IS NULL OR NOT private.has_institution_role(_institution_id,'institution_admin') THEN
    RAISE EXCEPTION 'Institution administrator role required' USING ERRCODE='42501';
  END IF;
  IF length(coalesce(_legal_name,''))>300 OR length(coalesce(_cbn_licence_number,''))>100 OR length(coalesce(_goaml_entity_id,''))>100
     OR length(coalesce(_address,''))>1000 OR length(coalesce(_mlro_name,''))>200 OR length(coalesce(_contact_email,''))>254 OR length(coalesce(_contact_phone,''))>40 THEN
    RAISE EXCEPTION 'One or more fields are too long' USING ERRCODE='22001';
  END IF;
  IF trim(coalesce(_contact_email,''))<>'' AND trim(_contact_email) !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' THEN
    RAISE EXCEPTION 'Contact email is not valid' USING ERRCODE='22023';
  END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended('institution-profile:'||_institution_id::text,0));
  SELECT coalesce(max(version),0)+1 INTO v FROM public.institution_profile_versions WHERE institution_id=_institution_id;
  INSERT INTO public.institution_profiles(institution_id,legal_name,cbn_licence_number,goaml_entity_id,address,mlro_name,contact_email,contact_phone,version,updated_by,updated_at)
  VALUES(_institution_id,trim(coalesce(_legal_name,'')),trim(coalesce(_cbn_licence_number,'')),trim(coalesce(_goaml_entity_id,'')),trim(coalesce(_address,'')),trim(coalesce(_mlro_name,'')),trim(coalesce(_contact_email,'')),trim(coalesce(_contact_phone,'')),v,auth.uid(),now())
  ON CONFLICT(institution_id) DO UPDATE SET legal_name=EXCLUDED.legal_name,cbn_licence_number=EXCLUDED.cbn_licence_number,goaml_entity_id=EXCLUDED.goaml_entity_id,address=EXCLUDED.address,mlro_name=EXCLUDED.mlro_name,contact_email=EXCLUDED.contact_email,contact_phone=EXCLUDED.contact_phone,version=EXCLUDED.version,updated_by=EXCLUDED.updated_by,updated_at=EXCLUDED.updated_at;
  SELECT to_jsonb(p)-'updated_by'-'updated_at' INTO snap FROM public.institution_profiles p WHERE institution_id=_institution_id;
  INSERT INTO public.institution_profile_versions(institution_id,version,snapshot,changed_by) VALUES(_institution_id,v,snap,auth.uid());
  INSERT INTO public.audit_log(user_id,user_name,institution_id,action,resource,justification,metadata)
  VALUES(auth.uid(),coalesce(auth.jwt()->>'email','Unknown'),_institution_id,'INSTITUTION_PROFILE_UPDATED',_institution_id::text,'Reporting institution profile saved as version '||v,jsonb_build_object('profile_version',v));
  RETURN v;
END $$;
REVOKE ALL ON FUNCTION public.save_institution_profile(uuid,text,text,text,text,text,text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.save_institution_profile(uuid,text,text,text,text,text,text,text) TO authenticated;