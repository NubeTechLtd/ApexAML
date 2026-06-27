
ALTER TABLE public.demo_requests
  ADD COLUMN IF NOT EXISTS institution_type text,
  ADD COLUMN IF NOT EXISTS role text,
  ADD COLUMN IF NOT EXISTS slot_datetime timestamptz,
  ADD COLUMN IF NOT EXISTS whatsapp text,
  ADD COLUMN IF NOT EXISTS focus_areas text;

CREATE TABLE IF NOT EXISTS public.demo_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slot_datetime timestamptz NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'available' CHECK (status IN ('available','booked','blocked')),
  booked_by_request_id uuid REFERENCES public.demo_requests(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.demo_slots TO anon, authenticated;
GRANT ALL ON public.demo_slots TO service_role;

ALTER TABLE public.demo_slots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view demo slots" ON public.demo_slots;
CREATE POLICY "Anyone can view demo slots" ON public.demo_slots FOR SELECT USING (true);

CREATE TRIGGER demo_slots_set_updated_at
  BEFORE UPDATE ON public.demo_slots
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
