DROP POLICY "Staff can create adverse media results" ON public.adverse_media_results;
DROP POLICY "Staff can update adverse media results" ON public.adverse_media_results;

CREATE POLICY "Staff can create adverse media results"
  ON public.adverse_media_results FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid()));

CREATE POLICY "Staff can update adverse media results"
  ON public.adverse_media_results FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid()));