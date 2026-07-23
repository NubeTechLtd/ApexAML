-- Remove anonymous access to demo_slots entirely; anon now reads availability
-- exclusively via the public.demo_slot_availability view.
DROP POLICY IF EXISTS "Anon can view slot availability columns" ON public.demo_slots;
REVOKE ALL ON public.demo_slots FROM anon;