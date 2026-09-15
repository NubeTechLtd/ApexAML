-- ============================================================
-- 0. Institutions + membership
-- ============================================================
CREATE TABLE public.institutions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  institution_type text NOT NULL,
  cbn_licence_number text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.institutions TO authenticated;
GRANT ALL ON public.institutions TO service_role;
ALTER TABLE public.institutions ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_institutions (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  institution_id uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'analyst',
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, institution_id)
);
GRANT SELECT ON public.user_institutions TO authenticated;
GRANT ALL ON public.user_institutions TO service_role;
ALTER TABLE public.user_institutions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_memberships" ON public.user_institutions
  FOR SELECT TO authenticated USING (user_id = auth.uid());

-- SECURITY DEFINER helper avoids recursive RLS evaluation in policies
CREATE OR REPLACE FUNCTION private.is_institution_member(_institution_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_institutions
    WHERE user_id = auth.uid() AND institution_id = _institution_id
  );
$$;
REVOKE ALL ON FUNCTION private.is_institution_member(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.is_institution_member(uuid) TO authenticated, service_role;

CREATE POLICY "institution_read" ON public.institutions
  FOR SELECT TO authenticated USING (private.is_institution_member(id));

-- ============================================================
-- 1. Customers
-- ============================================================
CREATE TABLE public.customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid NOT NULL REFERENCES public.institutions(id),
  full_name text NOT NULL,
  bvn text,
  nin text,
  nuban text,
  kyc_tier text NOT NULL DEFAULT 'Tier 1',
  risk_level text NOT NULL DEFAULT 'Low',
  risk_score int NOT NULL DEFAULT 0,
  account_status text NOT NULL DEFAULT 'Active',
  bvn_verified boolean NOT NULL DEFAULT false,
  entity_type text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_customers_institution ON public.customers(institution_id);
CREATE INDEX idx_customers_bvn ON public.customers(bvn);
GRANT SELECT, INSERT, UPDATE ON public.customers TO authenticated;
GRANT ALL ON public.customers TO service_role;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "institution_read" ON public.customers
  FOR SELECT TO authenticated USING (private.is_institution_member(institution_id));
CREATE POLICY "institution_write" ON public.customers
  FOR INSERT TO authenticated WITH CHECK (private.is_institution_member(institution_id));
CREATE POLICY "institution_update" ON public.customers
  FOR UPDATE TO authenticated USING (private.is_institution_member(institution_id))
  WITH CHECK (private.is_institution_member(institution_id));

-- ============================================================
-- 2. Transactions
-- ============================================================
CREATE TABLE public.transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid NOT NULL REFERENCES public.institutions(id),
  customer_id uuid NOT NULL REFERENCES public.customers(id),
  tx_type text NOT NULL,
  channel text NOT NULL,
  amount_ngn numeric(18,2) NOT NULL,
  balance_after numeric(18,2),
  counterparty text,
  agent_location text,
  occurred_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_transactions_customer ON public.transactions(customer_id, occurred_at DESC);
GRANT SELECT, INSERT, UPDATE ON public.transactions TO authenticated;
GRANT ALL ON public.transactions TO service_role;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "institution_read" ON public.transactions
  FOR SELECT TO authenticated USING (private.is_institution_member(institution_id));
CREATE POLICY "institution_write" ON public.transactions
  FOR INSERT TO authenticated WITH CHECK (private.is_institution_member(institution_id));
CREATE POLICY "institution_update" ON public.transactions
  FOR UPDATE TO authenticated USING (private.is_institution_member(institution_id))
  WITH CHECK (private.is_institution_member(institution_id));

-- ============================================================
-- 3. Alerts
-- ============================================================
CREATE TABLE public.alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid NOT NULL REFERENCES public.institutions(id),
  case_id text NOT NULL UNIQUE,
  customer_id uuid NOT NULL REFERENCES public.customers(id),
  rule_triggered text NOT NULL,
  alert_type text NOT NULL,
  risk_level text NOT NULL,
  status text NOT NULL DEFAULT 'Open',
  description text,
  behavioral_red_flags text[],
  assigned_analyst_id uuid REFERENCES auth.users(id),
  opened_at timestamptz NOT NULL DEFAULT now(),
  closed_at timestamptz,
  dismissal_reason text
);
CREATE INDEX idx_alerts_institution_status ON public.alerts(institution_id, status);
CREATE INDEX idx_alerts_customer ON public.alerts(customer_id);
GRANT SELECT, INSERT, UPDATE ON public.alerts TO authenticated;
GRANT ALL ON public.alerts TO service_role;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "institution_read" ON public.alerts
  FOR SELECT TO authenticated USING (private.is_institution_member(institution_id));
CREATE POLICY "institution_write" ON public.alerts
  FOR INSERT TO authenticated WITH CHECK (private.is_institution_member(institution_id));
CREATE POLICY "institution_update" ON public.alerts
  FOR UPDATE TO authenticated USING (private.is_institution_member(institution_id))
  WITH CHECK (private.is_institution_member(institution_id));

-- ============================================================
-- 4. STR drafts + exports
-- ============================================================
CREATE TABLE public.str_drafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id uuid NOT NULL REFERENCES public.alerts(id),
  version int NOT NULL DEFAULT 1,
  narrative text NOT NULL,
  generated_by text NOT NULL DEFAULT 'claude_api',
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_str_drafts_alert ON public.str_drafts(alert_id, version DESC);
GRANT SELECT, INSERT, UPDATE ON public.str_drafts TO authenticated;
GRANT ALL ON public.str_drafts TO service_role;
ALTER TABLE public.str_drafts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "institution_read" ON public.str_drafts
  FOR SELECT TO authenticated USING (EXISTS (
    SELECT 1 FROM public.alerts a
    WHERE a.id = str_drafts.alert_id AND private.is_institution_member(a.institution_id)
  ));
CREATE POLICY "institution_write" ON public.str_drafts
  FOR INSERT TO authenticated WITH CHECK (EXISTS (
    SELECT 1 FROM public.alerts a
    WHERE a.id = str_drafts.alert_id AND private.is_institution_member(a.institution_id)
  ));
CREATE POLICY "institution_update" ON public.str_drafts
  FOR UPDATE TO authenticated USING (EXISTS (
    SELECT 1 FROM public.alerts a
    WHERE a.id = str_drafts.alert_id AND private.is_institution_member(a.institution_id)
  )) WITH CHECK (EXISTS (
    SELECT 1 FROM public.alerts a
    WHERE a.id = str_drafts.alert_id AND private.is_institution_member(a.institution_id)
  ));

CREATE TABLE public.str_exports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id uuid NOT NULL REFERENCES public.alerts(id),
  str_draft_id uuid NOT NULL REFERENCES public.str_drafts(id),
  filename text NOT NULL,
  goaml_xml text NOT NULL,
  exported_by uuid REFERENCES auth.users(id),
  exported_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_str_exports_alert ON public.str_exports(alert_id);
GRANT SELECT, INSERT ON public.str_exports TO authenticated;
GRANT ALL ON public.str_exports TO service_role;
ALTER TABLE public.str_exports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "institution_read" ON public.str_exports
  FOR SELECT TO authenticated USING (EXISTS (
    SELECT 1 FROM public.alerts a
    WHERE a.id = str_exports.alert_id AND private.is_institution_member(a.institution_id)
  ));
CREATE POLICY "institution_write" ON public.str_exports
  FOR INSERT TO authenticated WITH CHECK (EXISTS (
    SELECT 1 FROM public.alerts a
    WHERE a.id = str_exports.alert_id AND private.is_institution_member(a.institution_id)
  ));

-- ============================================================
-- 5. Audit log — additive columns on the existing append-only table
-- ============================================================
ALTER TABLE public.audit_log
  ADD COLUMN IF NOT EXISTS institution_id uuid REFERENCES public.institutions(id),
  ADD COLUMN IF NOT EXISTS actor_id uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS actor_name text,
  ADD COLUMN IF NOT EXISTS case_id text,
  ADD COLUMN IF NOT EXISTS ip_address text;

CREATE POLICY "audit_insert_only" ON public.audit_log
  FOR INSERT TO authenticated
  WITH CHECK (institution_id IS NOT NULL AND private.is_institution_member(institution_id));
-- deliberately no UPDATE or DELETE policy on public.audit_log for any role
