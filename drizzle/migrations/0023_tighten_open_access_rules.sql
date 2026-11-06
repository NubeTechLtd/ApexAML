-- 1) Public submissions now go only through the public-submit function (service role).
DROP POLICY IF EXISTS "Anyone can submit a lead" ON public.leads;
DROP POLICY IF EXISTS "Anyone can submit a roadmap lead" ON public.roadmap_leads;
DROP POLICY IF EXISTS "Anyone can submit a demo request" ON public.demo_requests;
DROP POLICY IF EXISTS "Anyone can record a landing page click" ON public.landing_page_clicks;
DROP POLICY IF EXISTS "Anyone can record a page event" ON public.page_events;
REVOKE INSERT ON public.leads, public.roadmap_leads, public.demo_requests, public.landing_page_clicks, public.page_events FROM anon, authenticated;
GRANT ALL ON public.leads, public.roadmap_leads, public.demo_requests, public.landing_page_clicks, public.page_events TO service_role;

-- 2) Reference data readable only by institution members and platform admins.
CREATE OR REPLACE FUNCTION private.has_any_institution()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO ''
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_institutions WHERE user_id = auth.uid()) $$;
REVOKE ALL ON FUNCTION private.has_any_institution() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.has_any_institution() TO authenticated, service_role;

DROP POLICY IF EXISTS "Authenticated can read sanctions" ON public.sanctions_entities;
CREATE POLICY "Members and platform admins can read sanctions" ON public.sanctions_entities
  FOR SELECT TO authenticated USING (private.has_any_institution() OR private.is_platform_admin());

DROP POLICY IF EXISTS "Authenticated can read sanctions meta" ON public.sanctions_meta;
CREATE POLICY "Members and platform admins can read sanctions meta" ON public.sanctions_meta
  FOR SELECT TO authenticated USING (private.has_any_institution() OR private.is_platform_admin());

DROP POLICY IF EXISTS "Authenticated can read jurisdictions" ON public.regulatory_jurisdictions;
CREATE POLICY "Members can read jurisdictions" ON public.regulatory_jurisdictions
  FOR SELECT TO authenticated USING (private.has_any_institution());

DROP POLICY IF EXISTS "Authenticated can read thresholds" ON public.regulatory_thresholds;
CREATE POLICY "Members can read thresholds" ON public.regulatory_thresholds
  FOR SELECT TO authenticated USING (private.has_any_institution());

DROP POLICY IF EXISTS "Authenticated can read report formats" ON public.regulatory_report_formats;
CREATE POLICY "Members can read report formats" ON public.regulatory_report_formats
  FOR SELECT TO authenticated USING (private.has_any_institution());

-- Vendor/provider configuration: platform admins only (covered by "Admins manage kyc vectors").
DROP POLICY IF EXISTS "Authenticated can read kyc vectors" ON public.kyc_verification_vectors;

REVOKE INSERT, UPDATE, DELETE ON public.sanctions_entities, public.sanctions_meta, public.kyc_verification_vectors, public.regulatory_jurisdictions, public.regulatory_thresholds, public.regulatory_report_formats FROM anon;
REVOKE SELECT ON public.sanctions_entities, public.sanctions_meta, public.kyc_verification_vectors, public.regulatory_jurisdictions, public.regulatory_thresholds, public.regulatory_report_formats FROM anon;

-- 3) Booking calendar: expose only taken slot times through a narrow function.
DROP POLICY IF EXISTS "Authenticated users can view demo slots" ON public.demo_slots;
REVOKE SELECT ON public.demo_slot_availability FROM anon, authenticated;
COMMENT ON VIEW public.demo_slot_availability IS 'DEPRECATED: replaced by public.get_taken_demo_slots()';

CREATE OR REPLACE FUNCTION public.get_taken_demo_slots(_start timestamptz, _end timestamptz)
RETURNS TABLE(slot_datetime timestamptz)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO ''
AS $$
  SELECT s.slot_datetime
    FROM public.demo_slots s
   WHERE _start IS NOT NULL AND _end IS NOT NULL
     AND _end >= _start AND _end - _start <= interval '31 days'
     AND s.slot_datetime BETWEEN _start AND _end
     AND s.status IN ('booked', 'blocked')
$$;
REVOKE ALL ON FUNCTION public.get_taken_demo_slots(timestamptz, timestamptz) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_taken_demo_slots(timestamptz, timestamptz) TO anon, authenticated, service_role;

-- 4) Roadmap counter: expose only the single count through a function.
DROP POLICY IF EXISTS "Public can read roadmap counter" ON public.roadmap_lead_counter;
REVOKE SELECT, INSERT, UPDATE, DELETE ON public.roadmap_lead_counter FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_roadmap_lead_count()
RETURNS bigint
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO ''
AS $$ SELECT COALESCE((SELECT c.count FROM public.roadmap_lead_counter c WHERE c.id = true), 0) $$;
REVOKE ALL ON FUNCTION public.get_roadmap_lead_count() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_roadmap_lead_count() TO anon, authenticated, service_role;