CREATE TABLE public.demo_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  emails_sent integer NOT NULL DEFAULT 0
);
GRANT ALL ON public.demo_sessions TO service_role;
ALTER TABLE public.demo_sessions ENABLE ROW LEVEL SECURITY;
CREATE INDEX demo_sessions_email_created_idx ON public.demo_sessions (email, created_at DESC);
COMMENT ON TABLE public.demo_sessions IS 'Demo entry sessions; written only by the start-demo-session edge function.';