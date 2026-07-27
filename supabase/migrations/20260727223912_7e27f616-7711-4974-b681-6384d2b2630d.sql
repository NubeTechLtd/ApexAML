CREATE TABLE public.ctr_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id text NOT NULL,
  customer_name text,
  report_date date NOT NULL,
  total_cash_ngn numeric NOT NULL,
  transaction_count integer NOT NULL DEFAULT 0,
  transaction_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'pending_review'
    CHECK (status IN ('pending_review','approved','filed','rejected')),
  reviewed_by uuid,
  reviewed_at timestamptz,
  ctr_reference text UNIQUE,
  filed_at timestamptz,
  goaml_xml text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (customer_id, report_date)
);

GRANT SELECT, UPDATE ON public.ctr_queue TO authenticated;
GRANT ALL ON public.ctr_queue TO service_role;

ALTER TABLE public.ctr_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view CTR queue"
  ON public.ctr_queue FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can update CTR queue"
  ON public.ctr_queue FOR UPDATE TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));

CREATE TRIGGER trg_ctr_queue_updated_at
  BEFORE UPDATE ON public.ctr_queue
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_ctr_queue_status ON public.ctr_queue(status);
CREATE INDEX idx_ctr_queue_report_date ON public.ctr_queue(report_date DESC);