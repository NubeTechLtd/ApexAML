
-- 1. Tighten email_events INSERT policy: limit to known event_types and require valid sequence_id when present.
DROP POLICY IF EXISTS "Anyone can record an email event" ON public.email_events;

CREATE POLICY "Anyone can record a valid email event"
ON public.email_events
FOR INSERT
TO public
WITH CHECK (
  event_type IN ('open','click','sent','failed','bounced','complaint','delivered','unsubscribe')
  AND (
    sequence_id IS NULL
    OR EXISTS (SELECT 1 FROM public.email_sequences s WHERE s.id = sequence_id)
  )
);

-- 2. Lock down has_role(): prevent anonymous role enumeration.
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
