CREATE TABLE public.institution_webhook_secrets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid NOT NULL REFERENCES public.institutions(id),
  key_id text NOT NULL UNIQUE CHECK (key_id ~ '^[A-Za-z0-9_.-]{8,128}$'),
  encrypted_secret text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  deactivated_at timestamptz
);
COMMENT ON COLUMN public.institution_webhook_secrets.encrypted_secret IS 'AES-256-GCM ciphertext (base64 iv||ciphertext) under the server-held WEBHOOK_SECRETS_KEY; plaintext is never stored.';
GRANT ALL ON public.institution_webhook_secrets TO service_role;
ALTER TABLE public.institution_webhook_secrets ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.processed_webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid NOT NULL REFERENCES public.institutions(id),
  key_id text NOT NULL,
  event_id text NOT NULL,
  transaction_queue_id uuid,
  received_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT processed_webhook_events_unique UNIQUE (institution_id, event_id)
);
GRANT ALL ON public.processed_webhook_events TO service_role;
GRANT SELECT ON public.processed_webhook_events TO authenticated;
ALTER TABLE public.processed_webhook_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY member_read_processed_events ON public.processed_webhook_events FOR SELECT TO authenticated
  USING (private.is_institution_member(institution_id));

CREATE TABLE public.webhook_rejections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  received_at timestamptz NOT NULL DEFAULT now(),
  endpoint text NOT NULL DEFAULT 'ingest-transaction',
  key_id text,
  institution_id uuid REFERENCES public.institutions(id),
  event_id text,
  reason text NOT NULL,
  ip_address text,
  user_agent text
);
GRANT ALL ON public.webhook_rejections TO service_role;
GRANT SELECT ON public.webhook_rejections TO authenticated;
ALTER TABLE public.webhook_rejections ENABLE ROW LEVEL SECURITY;
CREATE POLICY admin_read_webhook_rejections ON public.webhook_rejections FOR SELECT TO authenticated
  USING (institution_id IS NOT NULL AND (private.has_institution_role(institution_id,'institution_admin') OR private.has_institution_role(institution_id,'compliance_officer')));

CREATE OR REPLACE FUNCTION public.record_webhook_transaction(_institution_id uuid, _key_id text, _event_id text, _tx jsonb)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $$
DECLARE ev uuid; tx uuid;
BEGIN
  INSERT INTO public.processed_webhook_events(institution_id, key_id, event_id) VALUES (_institution_id, _key_id, _event_id)
    ON CONFLICT ON CONSTRAINT processed_webhook_events_unique DO NOTHING RETURNING id INTO ev;
  IF ev IS NULL THEN
    SELECT transaction_queue_id INTO tx FROM public.processed_webhook_events WHERE institution_id=_institution_id AND event_id=_event_id;
    RETURN jsonb_build_object('status','duplicate','id',tx);
  END IF;
  INSERT INTO public.transaction_queue(institution_id, transaction_id, account_number, amount, currency, channel, counterparty_account, counterparty_bank_code, transaction_datetime, narration, direction, status, raw_payload)
  VALUES (_institution_id, _tx->>'transaction_id', _tx->>'account_number', (_tx->>'amount')::numeric, _tx->>'currency', _tx->>'channel', _tx->>'counterparty_account', _tx->>'counterparty_bank_code', (_tx->>'transaction_datetime')::timestamptz, _tx->>'narration', _tx->>'direction', 'pending', _tx)
  RETURNING id INTO tx;
  UPDATE public.processed_webhook_events SET transaction_queue_id = tx WHERE id = ev;
  RETURN jsonb_build_object('status','queued','id',tx);
END $$;
REVOKE ALL ON FUNCTION public.record_webhook_transaction(uuid,text,text,jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_webhook_transaction(uuid,text,text,jsonb) TO service_role;