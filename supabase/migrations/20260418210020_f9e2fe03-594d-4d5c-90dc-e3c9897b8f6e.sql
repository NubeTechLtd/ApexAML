ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS compliance_timeline text,
  ADD COLUMN IF NOT EXISTS current_setup text,
  ADD COLUMN IF NOT EXISTS ndpr_consent boolean DEFAULT false;