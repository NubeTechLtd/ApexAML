REVOKE ALL ON FUNCTION public.trg_ctr_risk_recalc() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.trg_ctr_risk_recalc() FROM anon;
REVOKE ALL ON FUNCTION public.trg_ctr_risk_recalc() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.trg_ctr_risk_recalc() TO service_role;
REVOKE ALL ON FUNCTION public.request_risk_recalculation(TEXT, TEXT, TEXT) FROM anon;
REVOKE ALL ON FUNCTION public.request_risk_recalculation(TEXT, TEXT, TEXT) FROM authenticated;
