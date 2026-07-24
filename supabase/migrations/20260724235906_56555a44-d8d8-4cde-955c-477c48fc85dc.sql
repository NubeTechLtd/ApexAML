
-- Recreate demo_slot_availability as an invoker view (fixes SECURITY DEFINER view lint error)
DROP VIEW IF EXISTS public.demo_slot_availability;
CREATE VIEW public.demo_slot_availability
WITH (security_invoker = true) AS
  SELECT slot_datetime, status FROM public.demo_slots;

GRANT SELECT ON public.demo_slot_availability TO anon, authenticated;

-- Column-level grant + RLS policy so anon can read only the two exposed columns via the view
GRANT SELECT (slot_datetime, status) ON public.demo_slots TO anon;

DROP POLICY IF EXISTS "Anon can view slot availability columns" ON public.demo_slots;
CREATE POLICY "Anon can view slot availability columns"
ON public.demo_slots
FOR SELECT
TO anon
USING (true);
