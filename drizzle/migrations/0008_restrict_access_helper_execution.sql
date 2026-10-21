REVOKE ALL ON FUNCTION private.is_platform_admin(),private.tenant_role(uuid,text[]),private.tenant_read(uuid),private.customer_institution(text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION private.is_platform_admin(),private.tenant_role(uuid,text[]),private.tenant_read(uuid),private.customer_institution(text) TO authenticated,service_role;
REVOKE ALL ON FUNCTION public.scope_audit_entry() FROM PUBLIC,anon,authenticated;
COMMENT ON FUNCTION private.is_staff(uuid) IS 'DEPRECATED: no tenant policies may use this helper; use tenant_role and tenant_read.';
COMMENT ON COLUMN public.user_roles.role IS 'Platform staff only: platform_admin. Tenant roles live exclusively in user_institutions.role.';
COMMENT ON TABLE public.support_access_grants IS 'Explicit institution-scoped read-only support access, valid for 30 minutes, activated and revoked only by audited RPCs.';