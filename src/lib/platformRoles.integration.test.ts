import { execFileSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

const live = process.env.RUN_ACCESS_INTEGRATION === '1';
function query(sql: string) {
  return JSON.parse(execFileSync('lovable', ['supabase', 'query', sql, '--json'], { encoding: 'utf8' })).rows;
}
function body() { return query("SELECT pg_get_functiondef('public.change_platform_role(text,text,text)'::regprocedure) body")[0].body as string; }
describe.skipIf(!live)('platform role authorization', () => {
  it('requires platform_admin and verified MFA server-side', () => {
    expect(body()).toContain('NOT private.is_platform_admin()');
    expect(body()).toContain("IS DISTINCT FROM 'aal2'");
    expect(query("SELECT has_function_privilege('anon','public.change_platform_role(text,text,text)','EXECUTE') allowed")[0].allowed).toBe(false);
  });
  it('requires at least 20 justification characters', () => { expect(body()).toContain('length(trim(_justification))<20'); });
  it('grants only platform_admin and never writes memberships', () => {
    expect(body()).toContain("VALUES(target,'platform_admin')");
    expect(body()).not.toMatch(/(?:INSERT INTO|UPDATE|DELETE FROM) public\.user_institutions/i);
  });
  it('blocks self-revocation', () => { expect(body()).toContain("IF target=caller THEN RETURN jsonb_build_object('error','You cannot revoke your own"); });
  it('blocks revoking the last administrator under a serialized lock', () => {
    expect(body()).toContain('count_admins<=1'); expect(body()).toContain("pg_advisory_xact_lock(hashtextextended('platform-role-changes',0))");
  });
  it('enforces five calls per fifteen minutes including rejected database requests', () => {
    expect(body()).toContain('limited.calls>=5'); expect(body()).toContain("interval '15 minutes'");
    expect(body().indexOf('calls=calls+1')).toBeLessThan(body().indexOf("IF _action IS NULL"));
  });
  it('records grants and revokes with actor, target, role and justification', () => {
    expect(body()).toContain('INSERT INTO public.audit_log');
    expect(body()).toContain("'PLATFORM_ROLE_GRANTED' ELSE 'PLATFORM_ROLE_REVOKED'");
    expect(body()).toContain("'actor_id',caller,'target_id',target");
    expect(body()).toContain("'role','platform_admin'");
    expect(body()).toContain('trim(_justification)');
  });
  it('notifies every other current platform admin without including the caller', () => {
    expect(body()).toContain("WHERE role='platform_admin' AND user_id<>caller");
    const policies = query("SELECT tablename,qual FROM pg_policies WHERE tablename IN ('platform_role_changes','platform_role_notifications') ORDER BY tablename");
    expect(policies).toHaveLength(2);
    expect(policies[0].qual).toContain('is_platform_admin');
    expect(policies[1].qual).toContain('recipient_id = auth.uid()');
  });
});