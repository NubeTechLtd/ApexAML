CREATE TABLE public.roadmap_leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  institution_name TEXT NOT NULL,
  institution_type TEXT NOT NULL,
  aml_setup TEXT NOT NULL,
  volume TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  title TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  source TEXT NOT NULL DEFAULT 'roadmap_generator',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.roadmap_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit a roadmap lead"
ON public.roadmap_leads
FOR INSERT
TO public
WITH CHECK (true);