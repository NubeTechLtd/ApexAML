ALTER TABLE public.demo_sessions ADD COLUMN IF NOT EXISTS notification_token_hash text;
CREATE TABLE public.demo_notification_events (
 id uuid PRIMARY KEY,
 session_id uuid NOT NULL REFERENCES public.demo_sessions(id) ON DELETE CASCADE,
 notification_type text NOT NULL,
 status text NOT NULL DEFAULT 'reserved',
 created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.demo_notification_events TO service_role;
REVOKE ALL ON public.demo_notification_events FROM anon, authenticated;
ALTER TABLE public.demo_notification_events ENABLE ROW LEVEL SECURITY;
CREATE INDEX demo_notification_events_session_time ON public.demo_notification_events(session_id, created_at);
CREATE INDEX demo_sessions_normalized_email ON public.demo_sessions(lower(email));
CREATE OR REPLACE FUNCTION public.reserve_demo_notification(_session_id uuid, _event_id uuid, _type text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE _email text; _existing public.demo_notification_events%ROWTYPE; _count integer;
BEGIN
 IF _type NOT IN ('alert_assigned','alert_escalated','str_submitted','str_exported','ctr_filed','account_frozen','daily_briefing') THEN
  RAISE EXCEPTION 'Invalid notification type';
 END IF;
 SELECT lower(email) INTO _email FROM public.demo_sessions WHERE id = _session_id;
 IF _email IS NULL THEN RETURN jsonb_build_object('allowed',false,'reason','session_not_found'); END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended('demo-notification:' || _email, 0));
 SELECT * INTO _existing FROM public.demo_notification_events WHERE id = _event_id;
 IF FOUND THEN
  IF _existing.session_id <> _session_id OR _existing.notification_type <> _type THEN RETURN jsonb_build_object('allowed',false,'reason','invalid_event'); END IF;
  RETURN jsonb_build_object('allowed',false,'reason','duplicate','status',_existing.status);
 END IF;
 SELECT count(*) INTO _count FROM public.demo_notification_events WHERE session_id = _session_id;
 IF _count >= 10 THEN RETURN jsonb_build_object('allowed',false,'reason','session_limit'); END IF;
 SELECT count(*) INTO _count FROM public.demo_notification_events e JOIN public.demo_sessions s ON s.id=e.session_id WHERE lower(s.email)=_email AND e.created_at >= date_trunc('day', now() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC';
 IF _count >= 30 THEN RETURN jsonb_build_object('allowed',false,'reason','daily_address_limit'); END IF;
 IF _type='daily_briefing' AND EXISTS(SELECT 1 FROM public.demo_notification_events WHERE session_id=_session_id AND notification_type=_type AND created_at >= date_trunc('day', now() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC') THEN RETURN jsonb_build_object('allowed',false,'reason','briefing_already_sent'); END IF;
 INSERT INTO public.demo_notification_events(id,session_id,notification_type) VALUES(_event_id,_session_id,_type);
 RETURN jsonb_build_object('allowed',true);
END $$;
REVOKE ALL ON FUNCTION public.reserve_demo_notification(uuid,uuid,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_demo_notification(uuid,uuid,text) TO service_role;
COMMENT ON TABLE public.demo_notification_events IS 'Feature event reservations for atomic demo quotas and idempotency; not an email queue or suppression store. Failed/suppressed attempts consume quota to prevent abuse.';