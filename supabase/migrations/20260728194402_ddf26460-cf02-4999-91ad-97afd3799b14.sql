
DROP POLICY IF EXISTS "Authenticated can view CTR queue" ON public.ctr_queue;
CREATE POLICY "Admins can view CTR queue"
  ON public.ctr_queue FOR SELECT TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Authenticated upload nfiu list" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated read nfiu list" ON storage.objects;

CREATE POLICY "Admins upload nfiu list"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'nfiu-list-uploads' AND private.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins read nfiu list"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'nfiu-list-uploads' AND private.has_role(auth.uid(), 'admin'::public.app_role));
