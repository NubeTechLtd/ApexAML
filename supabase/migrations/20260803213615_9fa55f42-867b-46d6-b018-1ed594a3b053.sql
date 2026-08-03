CREATE TABLE public.adverse_media_results (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id text NOT NULL,
  customer_name text NOT NULL,
  bvn text,
  institution_name text,
  search_date timestamp with time zone NOT NULL DEFAULT now(),
  results jsonb NOT NULL DEFAULT '[]'::jsonb,
  overall_risk_level text NOT NULL DEFAULT 'None',
  screened_by text NOT NULL DEFAULT 'system',
  next_review_date date NOT NULL DEFAULT (now() + interval '90 days')::date,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT adverse_media_risk_level_chk CHECK (overall_risk_level IN ('None','Low','Medium','High'))
);

CREATE INDEX idx_adverse_media_customer ON public.adverse_media_results (customer_id, search_date DESC);
CREATE INDEX idx_adverse_media_review ON public.adverse_media_results (next_review_date);

GRANT SELECT, INSERT, UPDATE ON public.adverse_media_results TO authenticated;
GRANT ALL ON public.adverse_media_results TO service_role;

ALTER TABLE public.adverse_media_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view adverse media results"
  ON public.adverse_media_results FOR SELECT TO authenticated USING (true);

CREATE POLICY "Staff can create adverse media results"
  ON public.adverse_media_results FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Staff can update adverse media results"
  ON public.adverse_media_results FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Admins can delete adverse media results"
  ON public.adverse_media_results FOR DELETE TO authenticated
  USING (private.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_adverse_media_updated_at
  BEFORE UPDATE ON public.adverse_media_results
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();