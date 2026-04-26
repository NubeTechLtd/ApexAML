CREATE TABLE public.demo_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_name TEXT NOT NULL,
  institution_name TEXT NOT NULL,
  email TEXT,
  preferred_date TEXT,
  message TEXT,
  source TEXT NOT NULL DEFAULT 'post_roadmap',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.demo_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit a demo request"
ON public.demo_requests
FOR INSERT
TO public
WITH CHECK (true);
