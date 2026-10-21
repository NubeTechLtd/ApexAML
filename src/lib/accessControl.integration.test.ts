import { execFileSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

// Opt-in live authorization checks; no mutations or secrets are printed.
const live = process.env.RUN_ACCESS_INTEGRATION === '1';
function query(sql: string) {
  const response = JSON.parse(execFileSync('lovable', ['supabase', 'query', sql, '--json'], { encoding: 'utf8' }));
  return response.rows;
}
function authenticatedRows(path: string) {
  // Read the managed session locally; never print credentials.
  const script = `import json,os,sys,urllib.request,base64
with open(os.path.expanduser('~/.cache/lovable-auth/session.json')) as f: session=json.load(f)['session']
token=session['access_token']
payload=json.loads(base64.urlsafe_b64decode(token.split('.')[1]+'==='))
issuer=payload['iss'].split('/auth/v1')[0]
request=urllib.request.Request(issuer+'/rest/v1/'+sys.argv[1],headers={'Authorization':'Bearer '+token,'apikey':sys.argv[2]})
with urllib.request.urlopen(request) as response: print(response.read().decode())`;
  const client = execFileSync('python3', ['-c', "from pathlib import Path; import re; print(re.search(r'VITE_SUPABASE_PUBLISHABLE_KEY=[\"\']?([^\"\'\\n]+)',Path('.env').read_text()).group(1))"], { encoding: 'utf8' }).trim();
  return JSON.parse(execFileSync('python3', ['-c', script, path, client], { encoding: 'utf8' }));
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
    expect(authenticatedRows('institutions?select=id&id=eq.00000000-0000-0000-0000-000000000001')).toEqual([]);
  });
  it('rejects unrecognized institution roles', () => {
    expect(query("select count(*)::int invalid from public.user_institutions where role not in ('analyst','compliance_officer','institution_admin')")[0].invalid).toBe(0);
    expect(query("select pg_get_constraintdef(oid) definition from pg_constraint where conname='institution_role_values'")[0].definition).toContain('institution_admin');
  });
});