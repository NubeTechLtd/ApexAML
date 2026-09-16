GRANT SELECT, INSERT, UPDATE ON public.institutions TO authenticated;
GRANT ALL ON public.institutions TO service_role;

GRANT SELECT ON public.user_institutions TO authenticated;
GRANT ALL ON public.user_institutions TO service_role;

GRANT SELECT, INSERT, UPDATE ON public.customers TO authenticated;
GRANT ALL ON public.customers TO service_role;

GRANT SELECT, INSERT, UPDATE ON public.transactions TO authenticated;
GRANT ALL ON public.transactions TO service_role;

GRANT SELECT, INSERT, UPDATE ON public.alerts TO authenticated;
GRANT ALL ON public.alerts TO service_role;

GRANT SELECT, INSERT, UPDATE ON public.str_drafts TO authenticated;
GRANT ALL ON public.str_drafts TO service_role;

GRANT SELECT, INSERT ON public.str_exports TO authenticated;
GRANT ALL ON public.str_exports TO service_role;