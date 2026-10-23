import { execFileSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

const live = process.env.RUN_ACCESS_INTEGRATION === '1';
function query(sql: string) {
  return JSON.parse(execFileSync('lovable', ['supabase', 'query', sql, '--json'], { encoding: 'utf8' })).rows;
}
describe.skipIf(!live)('audit-log hardening', () => {
  it('requires institution_id and exposes no anonymous or authenticated mutation privileges', () => {
    const rows = query(`SELECT is_nullable='NO' AS scoped,
      NOT has_table_privilege('anon','public.audit_log','SELECT,INSERT,UPDATE,DELETE,TRUNCATE') AS no_anon,
      NOT has_table_privilege('authenticated','public.audit_log','UPDATE,DELETE,TRUNCATE') AS no_mutation
      FROM information_schema.columns WHERE table_schema='public' AND table_name='audit_log' AND column_name='institution_id'`);
    expect(rows[0]).toEqual({ scoped: true, no_anon: true, no_mutation: true });
  });
  it('has exactly one INSERT policy and one officer-only SELECT policy', () => {
    const policies = query("SELECT cmd,qual,with_check FROM pg_policies WHERE schemaname='public' AND tablename='audit_log' ORDER BY cmd");
    expect(policies).toHaveLength(2);
    expect(policies[0].cmd).toBe('INSERT');
    expect(policies[0].with_check).toContain('user_id = auth.uid()');
    expect(policies[0].with_check).toContain('is_institution_member');
    expect(policies[1].qual).toContain('compliance_officer');
    expect(policies[1].qual).toContain('institution_admin');
  });
  for (const operation of ['UPDATE', 'DELETE', 'TRUNCATE']) {
    it(`installs an unconditional ${operation} blocker, including service_role`, () => {
      const triggers = query(`SELECT pg_get_triggerdef(t.oid) definition, pg_get_functiondef(t.tgfoid) body
        FROM pg_trigger t WHERE t.tgrelid='public.audit_log'::regclass AND t.tgenabled='O' AND NOT t.tgisinternal`);
      const blocker = triggers.find((t: { definition: string }) => t.definition.includes(operation) && t.definition.includes('reject_audit'));
      expect(blocker).toBeDefined();
      expect(blocker.body).toContain('RAISE EXCEPTION');
      expect(blocker.body).not.toContain('service_role');
      expect(blocker.body).not.toContain('IF');
    });
  }
  it('hashes row content plus the preceding hash with SHA-256', () => {
    const body = query("SELECT pg_get_functiondef('private.audit_content_hash(jsonb,text)'::regprocedure) body")[0].body;
    expect(body).toContain("'sha256'");
    expect(body).toContain("_previous || (_row - 'row_hash' - 'prev_hash')::text");
    expect(body).toContain("'UTF8'");
  });
  it('serializes inserts and overwrites client-supplied hashes and indexes', () => {
    const body = query("SELECT pg_get_functiondef('private.chain_audit_entry()'::regprocedure) body")[0].body;
    expect(body).toContain('pg_advisory_xact_lock');
    expect(body).toContain('NEW.chain_index:=');
    expect(body).toContain('NEW.prev_hash:=');
    expect(body).toContain('NEW.row_hash:=private.audit_content_hash');
  });
  it('verification is officer-only and reports position, link, or content breaks', () => {
    const body = query("SELECT pg_get_functiondef('public.verify_audit_chain(uuid)'::regprocedure) body")[0].body;
    expect(body).toContain("'compliance_officer'");
    expect(body).toContain("'institution_admin'");
    expect(body).toContain('r.chain_index<>position');
    expect(body).toContain('r.prev_hash<>previous');
    expect(body).toContain('r.row_hash<>private.audit_content_hash');
    expect(body).toContain('RETURN QUERY SELECT false');
    expect(query("SELECT has_function_privilege('anon','public.verify_audit_chain(uuid)','EXECUTE') allowed")[0].allowed).toBe(false);
  });
});
