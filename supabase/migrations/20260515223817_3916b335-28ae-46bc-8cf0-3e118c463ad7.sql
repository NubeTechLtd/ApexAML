
-- Create a private schema not exposed via PostgREST
CREATE SCHEMA IF NOT EXISTS private;

-- Recreate has_role in the private schema
CREATE OR REPLACE FUNCTION private.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Lock down execution: only postgres/service_role + authenticated (for RLS evaluation)
REVOKE ALL ON FUNCTION private.has_role(uuid, public.app_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO authenticated, service_role;

-- Repoint all RLS policies from public.has_role to private.has_role
-- demo_requests
DROP POLICY IF EXISTS "Admins can view demo requests" ON public.demo_requests;
CREATE POLICY "Admins can view demo requests" ON public.demo_requests
  FOR SELECT TO authenticated USING (private.has_role(auth.uid(), 'admin'::public.app_role));

-- email_events
DROP POLICY IF EXISTS "Admins can view email events" ON public.email_events;
CREATE POLICY "Admins can view email events" ON public.email_events
  FOR SELECT TO authenticated USING (private.has_role(auth.uid(), 'admin'::public.app_role));

-- email_sequences
DROP POLICY IF EXISTS "Admins can view email sequences" ON public.email_sequences;
CREATE POLICY "Admins can view email sequences" ON public.email_sequences
  FOR SELECT TO authenticated USING (private.has_role(auth.uid(), 'admin'::public.app_role));

-- landing_page_clicks
DROP POLICY IF EXISTS "Admins can view landing clicks" ON public.landing_page_clicks;
CREATE POLICY "Admins can view landing clicks" ON public.landing_page_clicks
  FOR SELECT TO authenticated USING (private.has_role(auth.uid(), 'admin'::public.app_role));

-- leads
DROP POLICY IF EXISTS "Admins can view leads" ON public.leads;
CREATE POLICY "Admins can view leads" ON public.leads
  FOR SELECT TO authenticated USING (private.has_role(auth.uid(), 'admin'::public.app_role));

-- page_events
DROP POLICY IF EXISTS "Admins can view page events" ON public.page_events;
CREATE POLICY "Admins can view page events" ON public.page_events
  FOR SELECT TO authenticated USING (private.has_role(auth.uid(), 'admin'::public.app_role));

-- roadmap_leads
DROP POLICY IF EXISTS "Admins can view roadmap leads" ON public.roadmap_leads;
CREATE POLICY "Admins can view roadmap leads" ON public.roadmap_leads
  FOR SELECT TO authenticated USING (private.has_role(auth.uid(), 'admin'::public.app_role));

-- whatsapp_sequences
DROP POLICY IF EXISTS "Admins can view whatsapp sequences" ON public.whatsapp_sequences;
CREATE POLICY "Admins can view whatsapp sequences" ON public.whatsapp_sequences
  FOR SELECT TO authenticated USING (private.has_role(auth.uid(), 'admin'::public.app_role));

-- user_roles
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
CREATE POLICY "Admins can manage roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
CREATE POLICY "Admins can view all roles" ON public.user_roles
  FOR SELECT TO authenticated USING (private.has_role(auth.uid(), 'admin'::public.app_role));

-- Drop the public-exposed version
DROP FUNCTION IF EXISTS public.has_role(uuid, public.app_role);
