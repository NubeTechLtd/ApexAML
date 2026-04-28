-- Roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Admin SELECT policies on existing tables
CREATE POLICY "Admins can view roadmap leads"
  ON public.roadmap_leads FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view demo requests"
  ON public.demo_requests FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view email sequences"
  ON public.email_sequences FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

ALTER TABLE public.email_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can record an email event"
  ON public.email_events FOR INSERT
  TO public, anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can view email events"
  ON public.email_events FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view leads"
  ON public.leads FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view landing clicks"
  ON public.landing_page_clicks FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view whatsapp sequences"
  ON public.whatsapp_sequences FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Page events for funnel tracking
CREATE TABLE public.page_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_name TEXT NOT NULL,
  session_id TEXT,
  path TEXT,
  source TEXT,
  metadata JSONB,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_page_events_event_name ON public.page_events(event_name);
CREATE INDEX idx_page_events_created_at ON public.page_events(created_at DESC);

ALTER TABLE public.page_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can record a page event"
  ON public.page_events FOR INSERT
  TO public, anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can view page events"
  ON public.page_events FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.roadmap_leads;
ALTER PUBLICATION supabase_realtime ADD TABLE public.demo_requests;