
-- 1. Lock down demo_slots: remove public SELECT of booked_by_request_id.
--    Expose only slot_datetime + status through a dedicated view for anon.
DROP POLICY IF EXISTS "Anyone can view demo slots" ON public.demo_slots;

CREATE POLICY "Authenticated users can view demo slots"
  ON public.demo_slots FOR SELECT
  TO authenticated
  USING (true);

REVOKE SELECT ON public.demo_slots FROM anon;

CREATE OR REPLACE VIEW public.demo_slot_availability
  WITH (security_invoker = true) AS
  SELECT slot_datetime, status FROM public.demo_slots;

GRANT SELECT ON public.demo_slot_availability TO anon, authenticated;

-- Allow anon to read the underlying rows ONLY through the view path;
-- add a column-scoped SELECT policy so the security_invoker view works.
CREATE POLICY "Anon can view slot availability columns"
  ON public.demo_slots FOR SELECT
  TO anon
  USING (true);

-- Revoke direct column access from anon so booked_by_request_id is not
-- reachable via PostgREST; the view + column grants are the only path.
REVOKE ALL ON public.demo_slots FROM anon;
GRANT SELECT (slot_datetime, status) ON public.demo_slots TO anon;

-- 2. transaction_queue: make write-restriction explicit (service_role only).
CREATE POLICY "No client inserts on transaction_queue"
  ON public.transaction_queue FOR INSERT
  TO authenticated, anon
  WITH CHECK (false);

CREATE POLICY "No client updates on transaction_queue"
  ON public.transaction_queue FOR UPDATE
  TO authenticated, anon
  USING (false) WITH CHECK (false);

CREATE POLICY "No client deletes on transaction_queue"
  ON public.transaction_queue FOR DELETE
  TO authenticated, anon
  USING (false);

-- 3. Harden SECURITY DEFINER helpers: set search_path AND revoke public EXECUTE.
ALTER FUNCTION public.enqueue_email(text, jsonb) SET search_path = public, pg_temp;
ALTER FUNCTION public.read_email_batch(text, integer, integer) SET search_path = public, pg_temp;
ALTER FUNCTION public.delete_email(text, bigint) SET search_path = public, pg_temp;
ALTER FUNCTION public.move_to_dlq(text, text, bigint, jsonb) SET search_path = public, pg_temp;

REVOKE EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.delete_email(text, bigint) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.email_queue_dispatch() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.email_queue_wake() FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.delete_email(text, bigint) TO service_role;
GRANT EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.email_queue_dispatch() TO service_role;
GRANT EXECUTE ON FUNCTION public.email_queue_wake() TO service_role;

-- 4. set_updated_at trigger function: pin search_path (was already set, keep idempotent).
ALTER FUNCTION public.set_updated_at() SET search_path = public, pg_temp;
