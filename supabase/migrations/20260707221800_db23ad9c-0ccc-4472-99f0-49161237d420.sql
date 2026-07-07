-- 1. Jurisdictions
CREATE TABLE public.regulatory_jurisdictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  jurisdiction_code TEXT UNIQUE NOT NULL,
  jurisdiction_name TEXT NOT NULL,
  regulator_name TEXT NOT NULL,
  fiu_name TEXT NOT NULL,
  base_currency TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.regulatory_jurisdictions TO authenticated;
GRANT ALL ON public.regulatory_jurisdictions TO service_role;

ALTER TABLE public.regulatory_jurisdictions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read jurisdictions"
ON public.regulatory_jurisdictions FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins manage jurisdictions"
ON public.regulatory_jurisdictions FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'))
WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE TRIGGER trg_regulatory_jurisdictions_updated_at
BEFORE UPDATE ON public.regulatory_jurisdictions
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 2. Thresholds
CREATE TABLE public.regulatory_thresholds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  jurisdiction_code TEXT NOT NULL REFERENCES public.regulatory_jurisdictions(jurisdiction_code) ON UPDATE CASCADE ON DELETE CASCADE,
  threshold_type TEXT NOT NULL,
  amount_local_currency NUMERIC(20,2) NOT NULL,
  amount_usd_equivalent NUMERIC(20,2),
  reporting_window_hours INTEGER,
  review_date DATE,
  cbn_circular_reference TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_thresholds_jurisdiction ON public.regulatory_thresholds(jurisdiction_code);
CREATE INDEX idx_thresholds_type ON public.regulatory_thresholds(threshold_type);

GRANT SELECT ON public.regulatory_thresholds TO authenticated;
GRANT ALL ON public.regulatory_thresholds TO service_role;

ALTER TABLE public.regulatory_thresholds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read thresholds"
ON public.regulatory_thresholds FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins manage thresholds"
ON public.regulatory_thresholds FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'))
WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE TRIGGER trg_regulatory_thresholds_updated_at
BEFORE UPDATE ON public.regulatory_thresholds
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 3. Report formats
CREATE TABLE public.regulatory_report_formats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  jurisdiction_code TEXT NOT NULL REFERENCES public.regulatory_jurisdictions(jurisdiction_code) ON UPDATE CASCADE ON DELETE CASCADE,
  report_type TEXT NOT NULL,
  format_standard TEXT NOT NULL,
  schema_version TEXT,
  submission_endpoint TEXT,
  test_endpoint TEXT,
  requires_digital_signature BOOLEAN NOT NULL DEFAULT false,
  max_file_size_mb INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_report_formats_jurisdiction ON public.regulatory_report_formats(jurisdiction_code);

GRANT SELECT ON public.regulatory_report_formats TO authenticated;
GRANT ALL ON public.regulatory_report_formats TO service_role;

ALTER TABLE public.regulatory_report_formats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read report formats"
ON public.regulatory_report_formats FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins manage report formats"
ON public.regulatory_report_formats FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'))
WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE TRIGGER trg_regulatory_report_formats_updated_at
BEFORE UPDATE ON public.regulatory_report_formats
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 4. KYC verification vectors
CREATE TABLE public.kyc_verification_vectors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  jurisdiction_code TEXT NOT NULL REFERENCES public.regulatory_jurisdictions(jurisdiction_code) ON UPDATE CASCADE ON DELETE CASCADE,
  vector_name TEXT NOT NULL,
  vector_type TEXT NOT NULL,
  provider_name TEXT,
  api_endpoint TEXT,
  is_mandatory_tier_1 BOOLEAN NOT NULL DEFAULT false,
  is_mandatory_tier_2 BOOLEAN NOT NULL DEFAULT false,
  tier_2_upgrade_required BOOLEAN NOT NULL DEFAULT false,
  cost_per_check_usd NUMERIC(10,4),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_kyc_vectors_jurisdiction ON public.kyc_verification_vectors(jurisdiction_code);

GRANT SELECT ON public.kyc_verification_vectors TO authenticated;
GRANT ALL ON public.kyc_verification_vectors TO service_role;

ALTER TABLE public.kyc_verification_vectors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read kyc vectors"
ON public.kyc_verification_vectors FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins manage kyc vectors"
ON public.kyc_verification_vectors FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'))
WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE TRIGGER trg_kyc_verification_vectors_updated_at
BEFORE UPDATE ON public.kyc_verification_vectors
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();