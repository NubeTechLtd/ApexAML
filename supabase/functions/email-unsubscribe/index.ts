// One-click unsubscribe. Public endpoint (verify_jwt = false).
//   GET  /email-unsubscribe?t=<token>      -> branded confirm page
//   POST /email-unsubscribe?t=<token>      -> mark unsubscribed (also handles List-Unsubscribe-Post)
//
// Always returns 200 to avoid mailbox-provider penalty for failed unsubscribes.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const admin = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });

function page(opts: { title: string; body: string }): Response {
  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${opts.title} — Zuia</title>
<style>
  *{box-sizing:border-box} body{margin:0;font-family:Helvetica,Arial,sans-serif;background:#0f172a;color:#e2e8f0;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px}
  .card{max-width:480px;width:100%;background:#1e293b;border:1px solid #334155;border-radius:12px;padding:32px}
  h1{font-size:20px;margin:0 0 12px 0;color:#fff}
  p{margin:0 0 12px 0;line-height:1.55;color:#cbd5e1;font-size:14px}
  .brand{font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#3b82f6;font-weight:600;margin-bottom:16px}
  .btn{display:inline-block;background:#1d4ed8;color:#fff;text-decoration:none;padding:10px 18px;border-radius:6px;font-weight:600;font-size:14px;margin-top:16px;border:0;cursor:pointer}
  .btn:hover{background:#1e40af}
  .muted{color:#64748b;font-size:12px;margin-top:24px}
</style></head>
<body><div class="card"><div class="brand">Zuia AML</div>${opts.body}<p class="muted">If you keep receiving these in error, reply <a style="color:#93c5fd" href="mailto:hello@zuia.io">hello@zuia.io</a>.</p></div></body></html>`;
  return new Response(html, { status: 200, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } });
}

async function unsubscribe(token: string): Promise<{ found: boolean; alreadyDone: boolean; email?: string }> {
  const { data: row } = await admin
    .from("email_sequences")
    .select("id, email, unsubscribed_at")
    .eq("tracking_token", token)
    .maybeSingle();
  if (!row) return { found: false, alreadyDone: false };
  if (row.unsubscribed_at) return { found: true, alreadyDone: true, email: row.email };

  const now = new Date().toISOString();
  await admin.from("email_sequences").update({ unsubscribed_at: now }).eq("id", row.id);
  // Also unsubscribe any other open sequences for the same email address.
  await admin.from("email_sequences").update({ unsubscribed_at: now })
    .ilike("email", row.email).is("unsubscribed_at", null);
  await admin.from("email_events").insert({
    sequence_id: row.id, email: row.email, event_type: "unsubscribe",
  });
  return { found: true, alreadyDone: false, email: row.email };
}

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const token = url.searchParams.get("t");

  if (!token) {
    return page({ title: "Invalid link", body: `<h1>Invalid unsubscribe link</h1><p>This link is missing or malformed.</p>` });
  }

  // RFC 8058 one-click POST (List-Unsubscribe-Post)
  if (req.method === "POST") {
    const res = await unsubscribe(token);
    if (!res.found) return new Response("Not found", { status: 404 });
    return new Response("OK", { status: 200 });
  }

  // Browser GET → confirm page (auto-unsubscribe; mailbox providers also pre-fetch links)
  const res = await unsubscribe(token);
  if (!res.found) {
    return page({ title: "Not found", body: `<h1>We couldn't find that subscription</h1><p>The link may have expired. If you'd like to opt out, email hello@zuia.io.</p>` });
  }
  if (res.alreadyDone) {
    return page({ title: "Already unsubscribed", body: `<h1>You're already unsubscribed</h1><p>${res.email ?? "Your address"} is no longer in the CBN roadmap follow-up sequence.</p>` });
  }
  return page({
    title: "Unsubscribed",
    body: `<h1>You're unsubscribed</h1><p>${res.email ?? "Your address"} has been removed from the CBN roadmap follow-up sequence. You may still receive transactional emails (e.g. roadmap copies you generate yourself).</p><a class="btn" href="https://zuia.io">Back to Zuia</a>`,
  });
});
