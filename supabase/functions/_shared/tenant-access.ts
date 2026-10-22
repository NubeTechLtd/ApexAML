import { createClient } from 'npm:@supabase/supabase-js@2';

/**
 * System jobs must present the exact server credential; user calls need a real tenant role.
 * Returns the customer's institution_id when authorised (truthy), otherwise null.
 */
export async function authorizeCustomer(req: Request, customerId: string, roles: string[]): Promise<string | null> {
  const url = Deno.env.get('SUPABASE_URL');
  const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const anon = Deno.env.get('SUPABASE_ANON_KEY');
  if (!url || !service || !anon) throw new Error('Access service unavailable');
  const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
  const system = token === service;
  const client = createClient(url, system ? service : anon, { global: { headers: { Authorization: `Bearer ${token}` } } });
  const { data: auth } = system ? { data: { user: null } } : await client.auth.getUser();
  if (!system && !auth.user) return null;
  // Exact comparisons avoid injecting a PostgREST filter through customer input.
  let institutionId: string | null = null;
  for (const field of ['id', 'bvn', 'nuban']) {
    if (field === 'id' && !/^[0-9a-f-]{36}$/i.test(customerId)) continue;
    const { data } = await client.from('customers').select('institution_id').eq(field, customerId).maybeSingle();
    if (data) { institutionId = data.institution_id; break; }
  }
  if (!institutionId) return null;
  if (system) return institutionId;
  if (!auth.user) return null;
  const { data } = await client.from('user_institutions').select('role').eq('user_id', auth.user.id).eq('institution_id', institutionId).maybeSingle();
  return data && roles.includes(data.role) ? institutionId : null;
}