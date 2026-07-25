
-- 1. demo_slots: drop redundant/duplicate anon SELECT policy (anon has no table grant; view demo_slot_availability is the public surface)
DROP POLICY IF EXISTS "Anon can view slot availability columns" ON public.demo_slots;

-- 2. email_sequences: add restrictive policies so no anon/authenticated client can INSERT/UPDATE/DELETE/SELECT (beyond existing admin SELECT)
CREATE POLICY "Deny anon all access to email_sequences"
  ON public.email_sequences
  AS RESTRICTIVE
  FOR ALL
  TO anon
  USING (false)
  WITH CHECK (false);

CREATE POLICY "Block writes to email_sequences for authenticated"
  ON public.email_sequences
  AS RESTRICTIVE
  FOR INSERT
  TO authenticated
  WITH CHECK (false);

CREATE POLICY "Block updates to email_sequences for authenticated"
  ON public.email_sequences
  AS RESTRICTIVE
  FOR UPDATE
  TO authenticated
  USING (false)
  WITH CHECK (false);

CREATE POLICY "Block deletes to email_sequences for authenticated"
  ON public.email_sequences
  AS RESTRICTIVE
  FOR DELETE
  TO authenticated
  USING (false);

REVOKE INSERT, UPDATE, DELETE ON public.email_sequences FROM anon, authenticated;

-- 3. Restrict EXECUTE on internal SECURITY DEFINER helper functions — only service_role should call them
REVOKE EXECUTE ON FUNCTION public.delete_email(text, bigint) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.email_queue_dispatch() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.email_queue_wake() FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.delete_email(text, bigint) TO service_role;
GRANT EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.email_queue_dispatch() TO service_role;
GRANT EXECUTE ON FUNCTION public.email_queue_wake() TO service_role;

-- 4. Replace get_roadmap_lead_count RPC with a plain view (owner-privileges, no SECURITY DEFINER function required for public counter)
DROP FUNCTION IF EXISTS public.get_roadmap_lead_count();

CREATE OR REPLACE VIEW public.roadmap_lead_stats
  WITH (security_invoker = false)
  AS SELECT count(*)::bigint AS count FROM public.roadmap_leads;

GRANT SELECT ON public.roadmap_lead_stats TO anon, authenticated, service_role;
