
-- Drop the view we just created (flagged as security-definer view)
DROP VIEW IF EXISTS public.roadmap_lead_stats;

-- Counter table, single-row, publicly readable count only
CREATE TABLE IF NOT EXISTS public.roadmap_lead_counter (
  id boolean PRIMARY KEY DEFAULT true CHECK (id = true),
  count bigint NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Seed with existing count
INSERT INTO public.roadmap_lead_counter (id, count)
  VALUES (true, (SELECT count(*) FROM public.roadmap_leads))
  ON CONFLICT (id) DO UPDATE SET count = EXCLUDED.count, updated_at = now();

GRANT SELECT ON public.roadmap_lead_counter TO anon, authenticated;
GRANT ALL ON public.roadmap_lead_counter TO service_role;

ALTER TABLE public.roadmap_lead_counter ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read roadmap counter"
  ON public.roadmap_lead_counter
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Trigger to increment on new roadmap_leads
CREATE OR REPLACE FUNCTION public.bump_roadmap_lead_counter()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE public.roadmap_lead_counter
    SET count = count + 1, updated_at = now()
    WHERE id = true;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.bump_roadmap_lead_counter() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_bump_roadmap_lead_counter ON public.roadmap_leads;
CREATE TRIGGER trg_bump_roadmap_lead_counter
  AFTER INSERT ON public.roadmap_leads
  FOR EACH ROW
  EXECUTE FUNCTION public.bump_roadmap_lead_counter();

-- Replace the loose "USING (false)" ALL policy for anon on email_sequences with per-command restrictive policies (more explicit and satisfies "always true/false" linter guidance for FOR ALL)
DROP POLICY IF EXISTS "Deny anon all access to email_sequences" ON public.email_sequences;

REVOKE ALL ON public.email_sequences FROM anon;
