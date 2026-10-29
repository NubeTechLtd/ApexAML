CREATE TABLE public.demo_ai_settings (
  id boolean PRIMARY KEY DEFAULT true CHECK (id),
  live_ai_enabled boolean NOT NULL DEFAULT true,
  daily_cap integer NOT NULL DEFAULT 150 CHECK (daily_cap >= 0),
  alert_threshold_pct integer NOT NULL DEFAULT 80 CHECK (alert_threshold_pct BETWEEN 1 AND 100),
  last_alert_day date,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.demo_ai_settings TO service_role;
ALTER TABLE public.demo_ai_settings ENABLE ROW LEVEL SECURITY;
INSERT INTO public.demo_ai_settings(id) VALUES (true) ON CONFLICT DO NOTHING;
COMMENT ON COLUMN public.demo_ai_settings.live_ai_enabled IS 'Kill switch: false stops every live demo AI call immediately.';

CREATE INDEX IF NOT EXISTS demo_ai_calls_created_idx ON public.demo_ai_calls(created_at);

CREATE OR REPLACE FUNCTION public.reserve_demo_ai_call(_session_id uuid, _ip_hash text, _mode text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $$
DECLARE
  n integer;
  total integer;
  cfg public.demo_ai_settings%ROWTYPE;
  day_start timestamptz := date_trunc('day', now() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC';
  today date := (now() AT TIME ZONE 'UTC')::date;
  notify boolean := false;
BEGIN
  IF _mode NOT IN ('generate','refine') OR _ip_hash IS NULL OR length(_ip_hash) <> 64 THEN RAISE EXCEPTION 'Invalid request'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.demo_sessions WHERE id=_session_id) THEN RETURN jsonb_build_object('allowed',false,'reason','session_not_found'); END IF;

  -- Serialise every reservation so the global count cannot be overrun concurrently.
  PERFORM pg_advisory_xact_lock(hashtextextended('demo-ai-global',0));
  SELECT * INTO cfg FROM public.demo_ai_settings WHERE id FOR UPDATE;
  IF NOT FOUND OR NOT cfg.live_ai_enabled THEN RETURN jsonb_build_object('allowed',false,'reason','demo_ai_disabled'); END IF;

  SELECT count(*) INTO total FROM public.demo_ai_calls WHERE created_at >= day_start;
  IF total >= cfg.daily_cap THEN RETURN jsonb_build_object('allowed',false,'reason','global_daily_limit'); END IF;

  SELECT count(*) INTO n FROM public.demo_ai_calls WHERE session_id=_session_id;
  IF n >= 3 THEN RETURN jsonb_build_object('allowed',false,'reason','session_limit'); END IF;
  SELECT count(*) INTO n FROM public.demo_ai_calls WHERE ip_hash=_ip_hash AND created_at >= day_start;
  IF n >= 20 THEN RETURN jsonb_build_object('allowed',false,'reason','ip_daily_limit'); END IF;

  INSERT INTO public.demo_ai_calls(session_id,ip_hash,mode) VALUES(_session_id,_ip_hash,_mode);
  total := total + 1;

  -- Flag the threshold alert once per UTC day.
  IF total * 100 >= cfg.daily_cap * cfg.alert_threshold_pct AND (cfg.last_alert_day IS NULL OR cfg.last_alert_day < today) THEN
    UPDATE public.demo_ai_settings SET last_alert_day = today, updated_at = now() WHERE id;
    notify := true;
  END IF;

  RETURN jsonb_build_object('allowed',true,'used_today',total,'daily_cap',cfg.daily_cap,'notify_threshold',notify);
END $$;
REVOKE ALL ON FUNCTION public.reserve_demo_ai_call(uuid,text,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_demo_ai_call(uuid,text,text) TO service_role;