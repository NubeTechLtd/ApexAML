
-- 1) Public roadmap count via SECURITY DEFINER function
CREATE OR REPLACE FUNCTION public.get_roadmap_lead_count()
RETURNS bigint
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT count(*)::bigint FROM public.roadmap_leads;
$$;

REVOKE ALL ON FUNCTION public.get_roadmap_lead_count() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_roadmap_lead_count() TO anon, authenticated;

-- 2) Fix demo_slot_availability so anon visitors can see which slots are booked.
-- Recreate as a SECURITY DEFINER view (invoker=off) so it uses the view owner's
-- privileges on demo_slots, exposing only slot_datetime + status columns.
DROP VIEW IF EXISTS public.demo_slot_availability;
CREATE VIEW public.demo_slot_availability
WITH (security_invoker = false) AS
  SELECT slot_datetime, status FROM public.demo_slots;

GRANT SELECT ON public.demo_slot_availability TO anon, authenticated;
