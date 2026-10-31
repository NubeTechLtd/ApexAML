ALTER TABLE public.demo_sessions
  ADD COLUMN IF NOT EXISTS email_confirmed_at timestamptz,
  ADD COLUMN IF NOT EXISTS confirmation_code_hash text,
  ADD COLUMN IF NOT EXISTS confirmation_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS confirmation_attempts integer NOT NULL DEFAULT 0;

CREATE TABLE public.demo_confirmation_sends (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.demo_sessions(id) ON DELETE CASCADE,
  email text NOT NULL,
  ip_hash text NOT NULL,
  status text NOT NULL DEFAULT 'reserved',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.demo_confirmation_sends TO service_role;
REVOKE ALL ON public.demo_confirmation_sends FROM anon, authenticated;
ALTER TABLE public.demo_confirmation_sends ENABLE ROW LEVEL SECURITY;
CREATE INDEX demo_confirmation_sends_email_time ON public.demo_confirmation_sends(lower(email), created_at);
CREATE INDEX demo_confirmation_sends_ip_time ON public.demo_confirmation_sends(ip_hash, created_at);
COMMENT ON TABLE public.demo_confirmation_sends IS 'Demo email-confirmation send reservations for atomic per-address/per-IP hourly limits; not an email queue or suppression store.';

-- Reserve one confirmation email: at most 1 per address and 3 per IP per rolling hour.
-- Stores the new code hash (30-minute validity) only when the send is allowed.
CREATE OR REPLACE FUNCTION public.reserve_demo_confirmation(_session_id uuid, _ip_hash text, _code_hash text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE _email text; _confirmed timestamptz; _oldest timestamptz; _count integer; _send_id uuid;
BEGIN
 IF _ip_hash IS NULL OR length(_ip_hash) <> 64 OR _code_hash IS NULL OR length(_code_hash) <> 64 THEN
  RAISE EXCEPTION 'Invalid reservation input';
 END IF;
 SELECT lower(email), email_confirmed_at INTO _email, _confirmed FROM public.demo_sessions WHERE id = _session_id;
 IF _email IS NULL THEN RETURN jsonb_build_object('allowed',false,'reason','session_not_found'); END IF;
 IF _confirmed IS NOT NULL THEN RETURN jsonb_build_object('allowed',false,'reason','already_confirmed'); END IF;
 -- Fixed lock order (IP, then address) so concurrent reservations cannot deadlock.
 PERFORM pg_advisory_xact_lock(hashtextextended('demo-confirm-ip:' || _ip_hash, 0));
 PERFORM pg_advisory_xact_lock(hashtextextended('demo-confirm-email:' || _email, 0));
 SELECT count(*), min(created_at) INTO _count, _oldest FROM public.demo_confirmation_sends
  WHERE lower(email) = _email AND created_at > now() - interval '1 hour';
 IF _count >= 1 THEN
  RETURN jsonb_build_object('allowed',false,'reason','address_limit','retry_after_seconds', greatest(1, ceil(extract(epoch FROM (_oldest + interval '1 hour' - now()))))::int);
 END IF;
 SELECT count(*), min(created_at) INTO _count, _oldest FROM public.demo_confirmation_sends
  WHERE ip_hash = _ip_hash AND created_at > now() - interval '1 hour';
 IF _count >= 3 THEN
  RETURN jsonb_build_object('allowed',false,'reason','ip_limit','retry_after_seconds', greatest(1, ceil(extract(epoch FROM (_oldest + interval '1 hour' - now()))))::int);
 END IF;
 INSERT INTO public.demo_confirmation_sends(session_id, email, ip_hash) VALUES (_session_id, _email, _ip_hash) RETURNING id INTO _send_id;
 UPDATE public.demo_sessions SET confirmation_code_hash = _code_hash, confirmation_expires_at = now() + interval '30 minutes', confirmation_attempts = 0
  WHERE id = _session_id;
 RETURN jsonb_build_object('allowed',true,'send_id',_send_id);
END $$;
REVOKE ALL ON FUNCTION public.reserve_demo_confirmation(uuid,text,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_demo_confirmation(uuid,text,text) TO service_role;

-- Check a confirmation code: valid for 30 minutes, at most 5 wrong attempts per code.
CREATE OR REPLACE FUNCTION public.confirm_demo_email(_session_id uuid, _code_hash text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE _s public.demo_sessions%ROWTYPE;
BEGIN
 SELECT * INTO _s FROM public.demo_sessions WHERE id = _session_id FOR UPDATE;
 IF NOT FOUND THEN RETURN jsonb_build_object('confirmed',false,'reason','session_not_found'); END IF;
 IF _s.email_confirmed_at IS NOT NULL THEN RETURN jsonb_build_object('confirmed',true); END IF;
 IF _s.confirmation_code_hash IS NULL OR _s.confirmation_expires_at IS NULL OR _s.confirmation_expires_at <= now() THEN
  RETURN jsonb_build_object('confirmed',false,'reason','expired');
 END IF;
 IF _s.confirmation_attempts >= 5 THEN RETURN jsonb_build_object('confirmed',false,'reason','too_many_attempts'); END IF;
 IF _s.confirmation_code_hash <> _code_hash THEN
  UPDATE public.demo_sessions SET confirmation_attempts = confirmation_attempts + 1 WHERE id = _session_id;
  RETURN jsonb_build_object('confirmed',false,'reason', CASE WHEN _s.confirmation_attempts + 1 >= 5 THEN 'too_many_attempts' ELSE 'invalid_code' END,
   'attempts_left', greatest(0, 4 - _s.confirmation_attempts));
 END IF;
 UPDATE public.demo_sessions SET email_confirmed_at = now(), confirmation_code_hash = NULL, confirmation_expires_at = NULL WHERE id = _session_id;
 RETURN jsonb_build_object('confirmed',true);
END $$;
REVOKE ALL ON FUNCTION public.confirm_demo_email(uuid,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.confirm_demo_email(uuid,text) TO service_role;

-- Demo notifications are emailed only after the session's address is confirmed.
CREATE OR REPLACE FUNCTION public.reserve_demo_notification(_session_id uuid, _event_id uuid, _type text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE _email text; _confirmed timestamptz; _existing public.demo_notification_events%ROWTYPE; _count integer;
BEGIN
 IF _type NOT IN ('alert_assigned','alert_escalated','str_submitted','str_exported','ctr_filed','account_frozen','daily_briefing') THEN
  RAISE EXCEPTION 'Invalid notification type';
 END IF;
 SELECT lower(email), email_confirmed_at INTO _email, _confirmed FROM public.demo_sessions WHERE id = _session_id;
 IF _email IS NULL THEN RETURN jsonb_build_object('allowed',false,'reason','session_not_found'); END IF;
 IF _confirmed IS NULL THEN RETURN jsonb_build_object('allowed',false,'reason','not_confirmed'); END IF;
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