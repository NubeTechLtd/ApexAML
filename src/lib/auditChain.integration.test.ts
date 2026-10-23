import { execFileSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

const live = process.env.RUN_ACCESS_INTEGRATION === '1';
const institution = 'a86bb727-70a9-4088-b058-9462c076db31';
const owner = '8fa3b881-1a9b-4214-a555-2cdb79ddabc2';
function query(sql: string) {
  return JSON.parse(execFileSync('lovable', ['supabase', 'query', sql, '--json'], { encoding: 'utf8' })).rows;
}
// Each block intentionally rolls back its own fixtures, including membership changes.
function check(body: string) {
  const rows = query(`DO $test$ DECLARE first_id uuid; second_id uuid; result record; BEGIN
    BEGIN
      PERFORM set_config('request.jwt.claims','{"sub":"${owner}","role":"authenticated"}',true);
      ${body}
      RAISE EXCEPTION USING ERRCODE='ZX001',MESSAGE='rollback test fixtures';
    EXCEPTION WHEN SQLSTATE 'ZX001' THEN NULL; END;
  END $test$; SELECT true AS passed;`);
  expect(rows[0].passed).toBe(true);
}
const insert = `INSERT INTO public.audit_log(institution_id,user_id,action,resource)
  VALUES('${institution}','${owner}','AUDIT_CHAIN_TEST','rollback-only fixture') RETURNING id INTO first_id;`;

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
    it(`blocks ${operation} even for service_role`, () => {
      const statement = operation === 'UPDATE' ? "UPDATE public.audit_log SET resource='changed' WHERE id=first_id"
        : operation === 'DELETE' ? 'DELETE FROM public.audit_log WHERE id=first_id' : 'TRUNCATE public.audit_log';
      check(`${insert} SET LOCAL ROLE service_role;
        BEGIN ${statement}; RAISE EXCEPTION USING ERRCODE='ZX002',MESSAGE='Mutation unexpectedly allowed';
        EXCEPTION WHEN raise_exception THEN
          IF SQLERRM NOT LIKE 'Audit log is append-only, hash-chained:%' THEN RAISE; END IF;
        END; RESET ROLE;`);
    });
  }
  it('computes SHA-256 links itself and verifies the whole institution chain', () => {
    check(`${insert}
      INSERT INTO public.audit_log(institution_id,user_id,action,resource,chain_index,prev_hash,row_hash)
      VALUES('${institution}','${owner}','AUDIT_CHAIN_TEST','second fixture',-99,'forged','forged') RETURNING id INTO second_id;
      IF NOT EXISTS(SELECT 1 FROM public.audit_log a JOIN public.audit_log b ON b.id=second_id
        WHERE a.id=first_id AND b.prev_hash=a.row_hash AND b.chain_index=a.chain_index+1 AND length(b.row_hash)=64) THEN
        RAISE EXCEPTION 'Hash chain not generated'; END IF;
      SELECT * INTO result FROM public.verify_audit_chain('${institution}');
      IF NOT result.is_valid OR result.checked_entries<2 THEN RAISE EXCEPTION 'Valid chain rejected'; END IF;`);
  });
  it('reports a real chain break after privileged content corruption', () => {
    check(`${insert}
      ALTER TABLE public.audit_log DISABLE TRIGGER reject_audit_update_delete;
      UPDATE public.audit_log SET resource='corrupted fixture' WHERE id=first_id;
      ALTER TABLE public.audit_log ENABLE TRIGGER reject_audit_update_delete;
      SELECT * INTO result FROM public.verify_audit_chain('${institution}');
      IF result.is_valid OR result.break_at IS NULL THEN RAISE EXCEPTION 'Corruption was not detected'; END IF;`);
  });
  it('allows analyst inserts without reads, denies verification, and rejects unrelated institutions and spoofed users', () => {
    check(`UPDATE public.user_institutions SET role='analyst' WHERE user_id='${owner}' AND institution_id='${institution}';
      SET LOCAL ROLE authenticated;
      INSERT INTO public.audit_log(institution_id,user_id,action,resource) VALUES('${institution}','${owner}','AUDIT_CHAIN_TEST','analyst fixture');
      IF EXISTS(SELECT 1 FROM public.audit_log WHERE institution_id='${institution}') THEN RAISE EXCEPTION 'Analyst read allowed'; END IF;
      BEGIN PERFORM public.verify_audit_chain('${institution}'); RAISE EXCEPTION USING ERRCODE='ZX002',MESSAGE='Analyst verification allowed'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
      BEGIN INSERT INTO public.audit_log(institution_id,user_id,action,resource) VALUES('00000000-0000-0000-0000-000000000001','${owner}','AUDIT_CHAIN_TEST','unrelated');
        RAISE EXCEPTION USING ERRCODE='ZX002',MESSAGE='Unrelated institution insert allowed'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
      BEGIN INSERT INTO public.audit_log(institution_id,user_id,action,resource) VALUES('${institution}','00000000-0000-0000-0000-000000000001','AUDIT_CHAIN_TEST','spoofed');
        RAISE EXCEPTION USING ERRCODE='ZX002',MESSAGE='Spoofed user allowed'; EXCEPTION WHEN raise_exception THEN
          IF SQLERRM <> 'Audit user must match the authenticated caller' THEN RAISE; END IF; END;
      RESET ROLE;`);
  });
});