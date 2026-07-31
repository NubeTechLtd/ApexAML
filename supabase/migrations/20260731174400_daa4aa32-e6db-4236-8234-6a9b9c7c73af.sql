CREATE TABLE public.risk_score_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id TEXT NOT NULL,
  previous_score INTEGER,
  new_score INTEGER NOT NULL,
  score_change INTEGER,
  trigger_type TEXT NOT NULL,
  trigger_reference TEXT,
  calculated_by TEXT NOT NULL DEFAULT 'SYSTEM',
  factors JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_risk_score_history_customer ON public.risk_score_history (customer_id, created_at DESC);

GRANT SELECT, INSERT ON public.risk_score_history TO authenticated;
GRANT ALL ON public.risk_score_history TO service_role;

ALTER TABLE public.risk_score_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view risk score history"
  ON public.risk_score_history FOR SELECT TO authenticated
  USING (private.is_staff(auth.uid()));

CREATE POLICY "Admins can insert manual risk score entries"
  ON public.risk_score_history FOR INSERT TO authenticated
  WITH CHECK (private.has_role(auth.uid(), 'admin'));

CREATE TABLE public.customer_risk_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id TEXT NOT NULL UNIQUE,
  risk_score INTEGER NOT NULL DEFAULT 0,
  risk_level TEXT NOT NULL DEFAULT 'Low',
  kyc_tier TEXT,
  last_calculated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.customer_risk_scores TO authenticated;
GRANT ALL ON public.customer_risk_scores TO service_role;

ALTER TABLE public.customer_risk_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view customer risk scores"
  ON public.customer_risk_scores FOR SELECT TO authenticated
  USING (private.is_staff(auth.uid()));

CREATE TRIGGER set_customer_risk_scores_updated_at
  BEFORE UPDATE ON public.customer_risk_scores
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Webhook dispatcher: enqueue a recalculation for a customer
CREATE OR REPLACE FUNCTION public.request_risk_recalculation(
  _customer_id TEXT,
  _trigger_type TEXT,
  _trigger_reference TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  IF _customer_id IS NULL THEN
    RETURN;
  END IF;
  BEGIN
    PERFORM net.http_post(
      url := 'https://pmxcwrlceitqpzspmyme.supabase.co/functions/v1/recalculate-risk-score',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Lovable-Context', 'trigger',
        'Authorization', 'Bearer ' || (
          SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'email_queue_service_role_key'
        )
      ),
      body := jsonb_build_object(
        'customer_id', _customer_id,
        'trigger_type', _trigger_type,
        'trigger_reference', _trigger_reference
      )
    );
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'request_risk_recalculation failed: %', SQLERRM;
  END;
END;
$$;

REVOKE ALL ON FUNCTION public.request_risk_recalculation(TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.request_risk_recalculation(TEXT, TEXT, TEXT) TO service_role;

-- Trigger on ctr_queue: filing a report is a risk-relevant event
CREATE OR REPLACE FUNCTION public.trg_ctr_risk_recalc()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  IF NEW.status = 'filed' AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM NEW.status) THEN
    PERFORM public.request_risk_recalculation(NEW.customer_id, 'STR_FILED', NEW.ctr_reference);
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER ctr_queue_risk_recalc
  AFTER INSERT OR UPDATE OF status ON public.ctr_queue
  FOR EACH ROW EXECUTE FUNCTION public.trg_ctr_risk_recalc();
