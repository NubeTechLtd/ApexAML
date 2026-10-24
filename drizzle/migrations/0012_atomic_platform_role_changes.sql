CREATE TABLE public.platform_role_call_limits (user_id uuid PRIMARY KEY, window_start timestamptz NOT NULL DEFAULT now(), calls integer NOT NULL DEFAULT 0);
GRANT ALL ON public.platform_role_call_limits TO service_role;
ALTER TABLE public.platform_role_call_limits ENABLE ROW LEVEL SECURITY;
CREATE TABLE public.platform_role_changes (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), audit_id uuid NOT NULL REFERENCES public.audit_log(id), actor_id uuid NOT NULL, actor_email text NOT NULL, target_id uuid NOT NULL, target_email text NOT NULL, role text NOT NULL DEFAULT 'platform_admin' CHECK (role='platform_admin'), action text NOT NULL CHECK(action IN ('grant','revoke')), justification text NOT NULL CHECK(length(trim(justification))>=20), created_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT ON public.platform_role_changes TO authenticated;
GRANT ALL ON public.platform_role_changes TO service_role;
ALTER TABLE public.platform_role_changes ENABLE ROW LEVEL SECURITY;
CREATE POLICY platform_changes_read ON public.platform_role_changes FOR SELECT TO authenticated USING (private.is_platform_admin());
CREATE TABLE public.platform_role_notifications (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), recipient_id uuid NOT NULL, change_id uuid NOT NULL REFERENCES public.platform_role_changes(id), created_at timestamptz NOT NULL DEFAULT now(), read_at timestamptz, UNIQUE(recipient_id,change_id));
GRANT SELECT ON public.platform_role_notifications TO authenticated;
GRANT ALL ON public.platform_role_notifications TO service_role;
ALTER TABLE public.platform_role_notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY own_platform_notifications ON public.platform_role_notifications FOR SELECT TO authenticated USING(recipient_id=auth.uid() AND private.is_platform_admin());
CREATE OR REPLACE FUNCTION public.change_platform_role(_email text, _action text, _justification text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $fn$
DECLARE caller uuid:=auth.uid(); target uuid; actor_email text; target_email text; count_admins integer; limited public.platform_role_call_limits%ROWTYPE; audit_id uuid:=gen_random_uuid(); change_id uuid:=gen_random_uuid(); platform_scope uuid:='00000000-0000-4000-8000-000000000001';
BEGIN
 IF caller IS NULL OR NOT private.is_platform_admin() THEN RAISE EXCEPTION 'Platform administrator access required' USING ERRCODE='42501'; END IF;
 IF auth.jwt()->>'aal' IS DISTINCT FROM 'aal2' THEN RAISE EXCEPTION 'Two-factor authentication required' USING ERRCODE='42501'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended('platform-role-changes',0));
 INSERT INTO public.platform_role_call_limits(user_id) VALUES(caller) ON CONFLICT(user_id) DO NOTHING;
 SELECT * INTO limited FROM public.platform_role_call_limits WHERE user_id=caller FOR UPDATE;
 IF limited.window_start <= now()-interval '15 minutes' THEN UPDATE public.platform_role_call_limits SET window_start=now(),calls=0 WHERE user_id=caller; limited.calls:=0; limited.window_start:=now(); END IF;
 IF limited.calls>=5 THEN RETURN jsonb_build_object('error','Too many role-change calls. Try again later.','status',429,'retry_after',greatest(1,ceil(extract(epoch FROM limited.window_start+interval '15 minutes'-now())))); END IF;
 UPDATE public.platform_role_call_limits SET calls=calls+1 WHERE user_id=caller;
 IF _action IS NULL OR _action NOT IN ('grant','revoke') OR _justification IS NULL OR length(trim(_justification))<20 OR length(_justification)>2000 OR _email IS NULL OR length(_email)>254 OR _email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' THEN RETURN jsonb_build_object('error','Provide a valid email, grant or revoke action, and 20–2000 characters of justification.','status',400); END IF;
 SELECT id,email INTO target,target_email FROM auth.users WHERE lower(email)=lower(trim(_email));
 IF target IS NULL THEN RETURN jsonb_build_object('error','No ApexAML account found for this email.','status',404); END IF;
 SELECT email INTO actor_email FROM auth.users WHERE id=caller;
 IF _action='revoke' THEN
  SELECT count(*) INTO count_admins FROM public.user_roles WHERE role='platform_admin';
  IF EXISTS(SELECT 1 FROM public.user_roles WHERE user_id=target AND role='platform_admin') AND count_admins<=1 THEN RETURN jsonb_build_object('error','The last platform administrator cannot be revoked.','status',409); END IF;
  IF target=caller THEN RETURN jsonb_build_object('error','You cannot revoke your own platform administrator role.','status',409); END IF;
  IF NOT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id=target AND role='platform_admin') THEN RETURN jsonb_build_object('error','This account is not a platform administrator.','status',409); END IF;
 ELSE
  IF EXISTS(SELECT 1 FROM public.user_roles WHERE user_id=target AND role='platform_admin') THEN RETURN jsonb_build_object('error','This account is already a platform administrator.','status',409); END IF;
 END IF;
 -- Dedicated non-tenant audit scope: no memberships or customer access are created.
 INSERT INTO public.institutions(id,name,institution_type) VALUES(platform_scope,'ApexAML platform control (non-tenant)','platform_control') ON CONFLICT(id) DO NOTHING;
 IF _action='grant' THEN INSERT INTO public.user_roles(user_id,role) VALUES(target,'platform_admin'); ELSE DELETE FROM public.user_roles WHERE user_id=target AND role='platform_admin'; END IF;
 INSERT INTO public.audit_log(id,user_id,user_name,actor_id,actor_name,institution_id,action,resource,justification,metadata) VALUES(audit_id,caller,actor_email,caller,actor_email,platform_scope,CASE WHEN _action='grant' THEN 'PLATFORM_ROLE_GRANTED' ELSE 'PLATFORM_ROLE_REVOKED' END,target::text,trim(_justification),jsonb_build_object('actor_id',caller,'target_id',target,'target_email',target_email,'role','platform_admin','scope','platform','change_id',change_id));
 INSERT INTO public.platform_role_changes(id,audit_id,actor_id,actor_email,target_id,target_email,action,justification) VALUES(change_id,audit_id,caller,actor_email,target,target_email,_action,trim(_justification));
 INSERT INTO public.platform_role_notifications(recipient_id,change_id) SELECT user_id,change_id FROM public.user_roles WHERE role='platform_admin' AND user_id<>caller;
 RETURN jsonb_build_object('success',true,'change_id',change_id,'action',_action,'email',target_email);
END $fn$;
REVOKE ALL ON FUNCTION public.change_platform_role(text,text,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.change_platform_role(text,text,text) TO authenticated;
CREATE OR REPLACE FUNCTION public.mark_platform_notification_read(_id uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $fn$ BEGIN
 IF NOT private.is_platform_admin() THEN RAISE EXCEPTION 'Platform administrator access required' USING ERRCODE='42501'; END IF;
 UPDATE public.platform_role_notifications SET read_at=now() WHERE id=_id AND recipient_id=auth.uid();
END $fn$;
REVOKE ALL ON FUNCTION public.mark_platform_notification_read(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.mark_platform_notification_read(uuid) TO authenticated;