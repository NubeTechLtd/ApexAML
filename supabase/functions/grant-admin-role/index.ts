// Grants the 'admin' role to an existing auth user, looked up by email.
// Caller must already be an authenticated admin.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;

  const authHeader = req.headers.get("Authorization") ?? "";
  const jwt = authHeader.replace(/^Bearer\s+/i, "");
  if (!jwt) {
    return json({ error: "Missing authorization" }, 401);
  }

  // 1) Verify caller and confirm admin role.
  const userClient = createClient(SUPABASE_URL, ANON, {
    global: { headers: { Authorization: `Bearer ${jwt}` } },
  });
  const { data: userResp, error: userErr } = await userClient.auth.getUser();
  if (userErr || !userResp?.user) {
    return json({ error: "Invalid session" }, 401);
  }
  const callerId = userResp.user.id;

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
  const { data: roleRow, error: roleErr } = await admin
    .from("user_roles")
    .select("role")
    .eq("user_id", callerId)
    .eq("role", "admin")
    .maybeSingle();
  if (roleErr || !roleRow) {
    return json({ error: "Forbidden — admin role required" }, 403);
  }

  // 2) Read target email.
  let body: { email?: string } = {};
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }
  const email = (body.email ?? "").trim().toLowerCase();
  if (!email) {
    return json({ error: "Email is required" }, 400);
  }

  // 3) Look up the target user via the Auth admin API. Paginate to find a match.
  let target: { id: string; email?: string } | null = null;
  let page = 1;
  while (page <= 20) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) return json({ error: error.message }, 500);
    const found = data.users.find((u) => (u.email ?? "").toLowerCase() === email);
    if (found) {
      target = { id: found.id, email: found.email ?? undefined };
      break;
    }
    if (data.users.length < 200) break;
    page += 1;
  }
  if (!target) {
    return json({ error: `No Zuia account found for ${email}. Ask them to sign up first.` }, 404);
  }

  // 4) Insert role (idempotent via unique constraint).
  const { error: insErr } = await admin
    .from("user_roles")
    .insert({ user_id: target.id, role: "admin" });
  if (insErr && !/duplicate key/i.test(insErr.message)) {
    return json({ error: insErr.message }, 500);
  }

  return json({ success: true, email });
});

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
