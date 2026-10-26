import { createClient } from 'npm:@supabase/supabase-js@2';

// Short-lived test provisioning endpoint; removed immediately after this test run.
Deno.serve(async (req) => {
  const url = Deno.env.get('SUPABASE_URL');
  const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const anon = Deno.env.get('SUPABASE_ANON_KEY');
  if (!url || !service || !anon) return new Response('Unavailable', { status: 503 });
  const caller = createClient(url, anon, { global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } } });
  const { data: auth } = await caller.auth.getUser();
  if (!auth.user) return new Response('Unauthorized', { status: 401 });
  const admin = createClient(url, service);
  const { data: role } = await admin.from('user_roles').select('role').eq('user_id', auth.user.id).eq('role', 'platform_admin').maybeSingle();
  if (!role) return new Response('Forbidden', { status: 403 });
  const body = await req.json();
  const marker = 'tenant-isolation-20261026';
  if (body.action === 'create') {
    const ids: string[] = [];
    for (const label of ['a', 'b']) {
      const { data, error } = await admin.auth.admin.createUser({
        email: `${marker}-${label}-${crypto.randomUUID()}@example.invalid`,
        password: crypto.randomUUID() + crypto.randomUUID(),
        email_confirm: true,
        app_metadata: { isolation_test: marker },
      });
      if (error || !data.user) {
        for (const id of ids) await admin.auth.admin.deleteUser(id);
        return new Response('Provisioning failed', { status: 500 });
      }
      ids.push(data.user.id);
    }
    return Response.json({ userA: ids[0], userB: ids[1] });
  }
  if (body.action === 'cleanup' && Array.isArray(body.ids) && body.ids.length === 2) {
    for (const id of body.ids) {
      const { data } = await admin.auth.admin.getUserById(id);
      if (data.user?.app_metadata.isolation_test !== marker) return new Response('Invalid test account', { status: 400 });
    }
    for (const id of body.ids) {
      const { error } = await admin.auth.admin.deleteUser(id);
      if (error) return new Response('Cleanup failed', { status: 500 });
    }
    return Response.json({ deleted: 2 });
  }
  return new Response('Invalid action', { status: 400 });
});