CREATE TABLE public.transaction_queue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_id TEXT NOT NULL,
  account_number TEXT NOT NULL,
  amount NUMERIC(20,2) NOT NULL,
  currency TEXT NOT NULL,
  channel TEXT NOT NULL,
  counterparty_account TEXT,
  counterparty_bank_code TEXT,
  transaction_datetime TIMESTAMPTZ NOT NULL,
  narration TEXT,
  direction TEXT NOT NULL CHECK (direction IN ('debit','credit')),
  status TEXT NOT NULL DEFAULT 'pending',
  raw_payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_transaction_queue_status ON public.transaction_queue(status);
CREATE INDEX idx_transaction_queue_account ON public.transaction_queue(account_number);
CREATE INDEX idx_transaction_queue_created_at ON public.transaction_queue(created_at DESC);

GRANT ALL ON public.transaction_queue TO service_role;
GRANT SELECT ON public.transaction_queue TO authenticated;

ALTER TABLE public.transaction_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view transaction queue"
ON public.transaction_queue
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE TRIGGER trg_transaction_queue_updated_at
BEFORE UPDATE ON public.transaction_queue
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();