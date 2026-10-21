import { execFileSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

// Opt-in live authorization checks; no mutations or secrets are printed.
const live = process.env.RUN_ACCESS_INTEGRATION === '1';
function query(sql: string) {
  const response = JSON.parse(execFileSync('lovable', ['supabase', 'query', sql, '--json'], { encoding: 'utf8' }));
  return response.rows;
}
describe.skipIf(!live)('institution and platform authorization', () => {
  it('keeps platform roles limited to platform_admin', () => {
    expect(query("select count(*)::int invalid from public.user_roles where role::text <> 'platform_admin'")[0].invalid).toBe(0);
  });
  it('seeds the owner as institution_admin independently of platform_admin', () => {
    expect(query("select role from public.user_institutions where user_id='8fa3b881-1a9b-4214-a555-2cdb79ddabc2' and institution_id='a86bb727-70a9-4088-b058-9462c076db31'")[0].role).toBe('institution_admin');
  });
  it('has no remaining staff bypass policies', () => {
    expect(query("select count(*)::int bypasses from pg_policies where coalesce(qual,'') like '%is_staff%' or coalesce(with_check,'') like '%is_staff%'")[0].bypasses).toBe(0);
  });
  it('denies unrelated institutions even to the platform owner', () => {
    const rows = query("with claims as materialized (select set_config('request.jwt.claims','{\"sub\":\"8fa3b881-1a9b-4214-a555-2cdb79ddabc2\",\"aal\":\"aal2\",\"role\":\"authenticated\"}',true)) select private.is_platform_admin() staff,private.tenant_read('00000000-0000-0000-0000-000000000001') allowed from claims");
    expect(rows[0].staff).toBe(true);
    expect(rows[0].allowed).toBe(false);
  });
  it('rejects unrecognized institution roles', () => {
    const rows = query("with claims as materialized (select set_config('request.jwt.claims','{\"sub\":\"8fa3b881-1a9b-4214-a555-2cdb79ddabc2\"}',true)) select private.tenant_role('a86bb727-70a9-4088-b058-9462c076db31',ARRAY['platform_admin']) allowed from claims");
    expect(rows[0].allowed).toBe(false);
  });
});