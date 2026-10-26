ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS role text, ADD COLUMN IF NOT EXISTS message text, ADD COLUMN IF NOT EXISTS client_fingerprint text;
CREATE INDEX IF NOT EXISTS leads_source_created_idx ON public.leads (source, created_at DESC);
GRANT ALL ON public.leads TO service_role;