CREATE TABLE public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  occurred_at timestamptz NOT NULL DEFAULT now(),
  user_id uuid,
  user_name text NOT NULL DEFAULT 'Unknown',
  action text NOT NULL,
  resource text NOT NULL DEFAULT '',
  justification text,
  status text NOT NULL DEFAULT 'success',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_log_occurred_at ON public.audit_log (occurred_at DESC);

GRANT SELECT, INSERT ON public.audit_log TO authenticated;
GRANT SELECT, INSERT ON public.audit_log TO service_role;

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Append-only: insert + read for authenticated staff, no UPDATE/DELETE policies at all
CREATE POLICY "Staff can read audit log"
  ON public.audit_log FOR SELECT
  TO authenticated
  USING (private.is_staff(auth.uid()));

CREATE POLICY "Authenticated users can append audit entries"
  ON public.audit_log FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());
