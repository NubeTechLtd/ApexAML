-- Explicit marker for institutions whose rows are seeded/sample data. Scheduled jobs skip them.
ALTER TABLE public.institutions ADD COLUMN IF NOT EXISTS is_sample_data boolean NOT NULL DEFAULT false;
COMMENT ON COLUMN public.institutions.is_sample_data IS 'True when the institution holds seeded or sample records. Scheduled live jobs never process these institutions.';
-- Backfill: Sterling Microfinance Bank Ltd was seeded with fictional cases.
UPDATE public.institutions SET is_sample_data = true WHERE id = 'a86bb727-70a9-4088-b058-9462c076db31';

ALTER TABLE public.institution_settings
  ADD COLUMN IF NOT EXISTS adverse_media_rescreen_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS risk_sweep_enabled boolean NOT NULL DEFAULT false;
COMMENT ON COLUMN public.institution_settings.adverse_media_rescreen_enabled IS 'Weekly adverse-media re-screen runs for this institution only when true. Changed only through set_scheduled_job_enabled.';
COMMENT ON COLUMN public.institution_settings.risk_sweep_enabled IS 'Nightly risk-score sweep runs for this institution only when true. Changed only through set_scheduled_job_enabled.';

CREATE OR REPLACE FUNCTION public.set_scheduled_job_enabled(_institution_id uuid, _job text, _enabled boolean, _justification text)
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
  IF _job IS NULL OR _job NOT IN ('adverse_media_rescreen', 'risk_sweep') THEN
    RAISE EXCEPTION 'Unknown scheduled job' USING ERRCODE = '22023';
  END IF;
  IF _enabled IS NULL THEN
    RAISE EXCEPTION 'Choose on or off' USING ERRCODE = '22023';
  END IF;
  IF length(j) < 20 OR length(j) > 2000 THEN
    RAISE EXCEPTION 'Justification must be 20 to 2000 characters' USING ERRCODE = '22023';
  END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended('institution-settings:' || _institution_id::text, 0));
  INSERT INTO public.institution_settings(institution_id, adverse_media_rescreen_enabled, risk_sweep_enabled, updated_by, updated_at)
  VALUES (_institution_id,
          CASE WHEN _job = 'adverse_media_rescreen' THEN _enabled ELSE false END,
          CASE WHEN _job = 'risk_sweep' THEN _enabled ELSE false END,
          auth.uid(), now())
  ON CONFLICT (institution_id) DO UPDATE SET
    adverse_media_rescreen_enabled = CASE WHEN _job = 'adverse_media_rescreen' THEN _enabled ELSE public.institution_settings.adverse_media_rescreen_enabled END,
    risk_sweep_enabled = CASE WHEN _job = 'risk_sweep' THEN _enabled ELSE public.institution_settings.risk_sweep_enabled END,
    updated_by = EXCLUDED.updated_by,
    updated_at = EXCLUDED.updated_at;
  INSERT INTO public.audit_log(user_id, user_name, institution_id, action, resource, justification, metadata)
  VALUES (auth.uid(), coalesce(auth.jwt()->>'email', 'Unknown'), _institution_id,
          CASE WHEN _enabled THEN 'SCHEDULED_JOB_ENABLED' ELSE 'SCHEDULED_JOB_DISABLED' END,
          _job, j, jsonb_build_object('job', _job, 'enabled', _enabled));
  RETURN _enabled;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.set_scheduled_job_enabled(uuid, text, boolean, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_scheduled_job_enabled(uuid, text, boolean, text) TO authenticated;

COMMENT ON TABLE public.institution_settings IS 'Per-institution live settings. Changed only through set_ai_drafting_enabled and set_scheduled_job_enabled.';