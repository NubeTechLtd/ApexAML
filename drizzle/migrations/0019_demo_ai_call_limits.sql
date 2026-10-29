CREATE TABLE public.demo_ai_calls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.demo_sessions(id) ON DELETE CASCADE,
  ip_hash text NOT NULL,
  mode text NOT NULL CHECK (mode IN ('generate','refine')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX demo_ai_calls_session_idx ON public.demo_ai_calls(session_id);
CREATE INDEX demo_ai_calls_ip_idx ON public.demo_ai_calls(ip_hash, created_at);
GRANT ALL ON public.demo_ai_calls TO service_role;
ALTER TABLE public.demo_ai_calls ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.reserve_demo_ai_call(_session_id uuid, _ip_hash text, _mode text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $$
DECLARE n integer;
BEGIN
  IF _mode NOT IN ('generate','refine') OR _ip_hash IS NULL OR length(_ip_hash) <> 64 THEN RAISE EXCEPTION 'Invalid request'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.demo_sessions WHERE id=_session_id) THEN RETURN jsonb_build_object('allowed',false,'reason','session_not_found'); END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended('demo-ai-ip:'||_ip_hash,0));
  PERFORM pg_advisory_xact_lock(hashtextextended('demo-ai-session:'||_session_id::text,0));
  SELECT count(*) INTO n FROM public.demo_ai_calls WHERE session_id=_session_id;
  IF n >= 3 THEN RETURN jsonb_build_object('allowed',false,'reason','session_limit'); END IF;
  SELECT count(*) INTO n FROM public.demo_ai_calls WHERE ip_hash=_ip_hash AND created_at >= date_trunc('day', now() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC';
  IF n >= 20 THEN RETURN jsonb_build_object('allowed',false,'reason','ip_daily_limit'); END IF;
  INSERT INTO public.demo_ai_calls(session_id,ip_hash,mode) VALUES(_session_id,_ip_hash,_mode);
  RETURN jsonb_build_object('allowed',true);
END $$;
REVOKE ALL ON FUNCTION public.reserve_demo_ai_call(uuid,text,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_demo_ai_call(uuid,text,text) TO service_role;