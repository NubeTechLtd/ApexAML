
DROP POLICY IF EXISTS "Block writes to email_sequences for authenticated" ON public.email_sequences;
DROP POLICY IF EXISTS "Block updates to email_sequences for authenticated" ON public.email_sequences;
DROP POLICY IF EXISTS "Block deletes to email_sequences for authenticated" ON public.email_sequences;
REVOKE INSERT, UPDATE, DELETE ON public.email_sequences FROM authenticated;
