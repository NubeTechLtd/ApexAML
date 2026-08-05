DROP POLICY IF EXISTS "Staff can create adverse media results" ON public.adverse_media_results;
DROP POLICY IF EXISTS "Staff can update adverse media results" ON public.adverse_media_results;

CREATE POLICY "Staff can create adverse media results"
ON public.adverse_media_results
FOR INSERT
TO authenticated
WITH CHECK (private.is_staff(auth.uid()));

CREATE POLICY "Staff can update adverse media results"
ON public.adverse_media_results
FOR UPDATE
TO authenticated
USING (private.is_staff(auth.uid()))
WITH CHECK (private.is_staff(auth.uid()));