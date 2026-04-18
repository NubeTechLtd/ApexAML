ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS source text DEFAULT 'landing',
  ADD COLUMN IF NOT EXISTS full_name text,
  ADD COLUMN IF NOT EXISTS institution_name text,
  ADD COLUMN IF NOT EXISTS institution_type text,
  ADD COLUMN IF NOT EXISTS phone text;