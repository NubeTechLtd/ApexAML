CREATE OR REPLACE FUNCTION private.is_staff(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id)
$$;

REVOKE ALL ON FUNCTION private.is_staff(uuid) FROM PUBLIC, anon, authenticated;

DROP POLICY "Authenticated staff can upload kyc documents" ON public.kyc_documents;
DROP POLICY "Authenticated staff can update kyc documents" ON public.kyc_documents;
DROP POLICY "Authenticated staff can read kyc documents" ON public.kyc_documents;

CREATE POLICY "Staff can read kyc documents"
  ON public.kyc_documents FOR SELECT TO authenticated
  USING (private.is_staff(auth.uid()));

CREATE POLICY "Staff can upload kyc documents"
  ON public.kyc_documents FOR INSERT TO authenticated
  WITH CHECK (private.is_staff(auth.uid()));

CREATE POLICY "Staff can update kyc documents"
  ON public.kyc_documents FOR UPDATE TO authenticated
  USING (private.is_staff(auth.uid()))
  WITH CHECK (private.is_staff(auth.uid()));

DROP POLICY "Staff can upload kyc document files" ON storage.objects;
DROP POLICY "Staff can read kyc document files" ON storage.objects;

CREATE POLICY "Staff can read kyc document files"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'kyc-documents' AND private.is_staff(auth.uid()));

CREATE POLICY "Staff can upload kyc document files"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'kyc-documents' AND private.is_staff(auth.uid()));