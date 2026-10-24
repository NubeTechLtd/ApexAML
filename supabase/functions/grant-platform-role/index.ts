import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const json = (data: unknown, status = 200, extra: Record<string, string> = {}) => new Response(JSON.stringify(data), {
  status, headers: { ...corsHeaders, 'Content-Type': 'application/json', ...extra },
});

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  const url = Deno.env.get('SUPABASE_URL');
  const key = Deno.env.get('SUPABASE_ANON_KEY');
  if (!url || !key) return json({ error: 'Service unavailable' }, 503);
  const authorization = req.headers.get('Authorization');
  if (!authorization?.startsWith('Bearer ')) return json({ error: 'Sign in required' }, 401);
  const client = createClient(url, key, { global: { headers: { Authorization: authorization } } });
  const { data: auth, error: authError } = await client.auth.getUser();
  if (authError || !auth.user) return json({ error: 'Invalid session' }, 401);
  let body: unknown;
  try { body = await req.json(); } catch { return json({ error: 'Invalid JSON body' }, 400); }
  const input = typeof body === 'object' && body !== null && !Array.isArray(body) ? body as Record<string, unknown> : {};
  // Fixed platform role only. Reject role/institution fields rather than silently ignoring them.
  if (Object.keys(input).some(key => !['email', 'action', 'justification'].includes(key))) return json({ error: 'Only email, action and justification are accepted; institution roles are not supported.' }, 400);
  const { data, error } = await client.rpc('change_platform_role', {
    _email: typeof input.email === 'string' ? input.email : '',
    _action: typeof input.action === 'string' ? input.action : '',
    _justification: typeof input.justification === 'string' ? input.justification : '',
  });
  if (error) return json({ error: error.code === '42501' ? error.message : 'Role change could not be recorded; no access was changed.' }, error.code === '42501' ? 403 : 500);
  const result = data as { status?: number; retry_after?: number };
  return json(data, result.status ?? 200, result.retry_after ? { 'Retry-After': String(result.retry_after) } : {});
});