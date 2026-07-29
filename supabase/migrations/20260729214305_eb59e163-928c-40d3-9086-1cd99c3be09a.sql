CREATE TABLE public.kyc_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id TEXT NOT NULL,
  document_type TEXT NOT NULL,
  document_name TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  file_size_bytes INTEGER,
  uploaded_by TEXT NOT NULL,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  kyc_tier_at_upload TEXT,
  is_current BOOLEAN NOT NULL DEFAULT true,
  expiry_date DATE,
  verified BOOLEAN NOT NULL DEFAULT false,
  verified_by TEXT,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.kyc_documents TO authenticated;
GRANT ALL ON public.kyc_documents TO service_role;

ALTER TABLE public.kyc_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated staff can read kyc documents"
  ON public.kyc_documents FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated staff can upload kyc documents"
  ON public.kyc_documents FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated staff can update kyc documents"
  ON public.kyc_documents FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Admins can delete kyc documents"
  ON public.kyc_documents FOR DELETE TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role));

CREATE INDEX idx_kyc_documents_customer ON public.kyc_documents (customer_id, is_current);

CREATE TRIGGER kyc_documents_set_updated_at
  BEFORE UPDATE ON public.kyc_documents
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Storage policies for the private kyc-documents bucket
CREATE POLICY "Staff can read kyc document files"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'kyc-documents');

CREATE POLICY "Staff can upload kyc document files"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'kyc-documents');

CREATE POLICY "Admins can update kyc document files"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'kyc-documents' AND private.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (bucket_id = 'kyc-documents' AND private.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can delete kyc document files"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'kyc-documents' AND private.has_role(auth.uid(), 'admin'::public.app_role));