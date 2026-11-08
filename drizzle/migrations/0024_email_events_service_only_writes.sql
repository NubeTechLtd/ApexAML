-- email_events is written only by edge functions using the service role.
DROP POLICY IF EXISTS "Anyone can record a valid email event" ON public.email_events;
DROP POLICY IF EXISTS "Anyone can record an email event" ON public.email_events;

REVOKE ALL ON public.email_events FROM anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON public.email_events FROM authenticated;
GRANT SELECT ON public.email_events TO authenticated; -- still limited to platform admins by RLS
GRANT ALL ON public.email_events TO service_role;

COMMENT ON TABLE public.email_events IS 'Email open/click/unsubscribe log. Written only by edge functions with the service role; opens and clicks require an HMAC-signed tracking link.';