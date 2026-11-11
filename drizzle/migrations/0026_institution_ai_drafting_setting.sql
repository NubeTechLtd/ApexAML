CREATE TABLE public.institution_settings (
  institution_id uuid PRIMARY KEY REFERENCES public.institutions(id) ON DELETE CASCADE,
  ai_drafting_enabled boolean NOT NULL DEFAULT false,
  updated_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.institution_settings IS 'Per-institution live settings. Changed only through set_ai_drafting_enabled.';
COMMENT ON COLUMN public.institution_settings.ai_drafting_enabled IS 'Institution consent for AI STR drafting; off unless an institution_admin turns it on.';

GRANT SELECT ON public.institution_settings TO authenticated;
GRANT ALL ON public.institution_settings TO service_role;
ALTER TABLE public.institution_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_read ON public.institution_settings
  FOR SELECT TO authenticated
  USING (private.tenant_read(institution_id));

CREATE OR REPLACE FUNCTION public.set_ai_drafting_enabled(_institution_id uuid, _enabled boolean, _justification text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE j text := btrim(coalesce(_justification, ''));
BEGIN
  IF auth.uid() IS NULL OR NOT private.has_institution_role(_institution_id, 'institution_admin') THEN
    RAISE EXCEPTION 'Institution administrator role required' USING ERRCODE = '42501';
  END IF;
  IF _enabled IS NULL THEN
    RAISE EXCEPTION 'Choose on or off' USING ERRCODE = '22023';
  END IF;
  IF length(j) < 20 OR length(j) > 2000 THEN
    RAISE EXCEPTION 'Justification must be 20 to 2000 characters' USING ERRCODE = '22023';
  END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended('institution-settings:' || _institution_id::text, 0));
  INSERT INTO public.institution_settings(institution_id, ai_drafting_enabled, updated_by, updated_at)
  VALUES (_institution_id, _enabled, auth.uid(), now())
  ON CONFLICT (institution_id) DO UPDATE
    SET ai_drafting_enabled = EXCLUDED.ai_drafting_enabled, updated_by = EXCLUDED.updated_by, updated_at = EXCLUDED.updated_at;
  INSERT INTO public.audit_log(user_id, user_name, institution_id, action, resource, justification, metadata)
  VALUES (auth.uid(), coalesce(auth.jwt()->>'email', 'Unknown'), _institution_id,
          CASE WHEN _enabled THEN 'AI_DRAFTING_ENABLED' ELSE 'AI_DRAFTING_DISABLED' END,
          _institution_id::text, j, jsonb_build_object('ai_drafting_enabled', _enabled));
  RETURN _enabled;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.set_ai_drafting_enabled(uuid, boolean, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_ai_drafting_enabled(uuid, boolean, text) TO authenticated;