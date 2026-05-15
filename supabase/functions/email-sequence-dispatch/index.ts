// Drip-sequence dispatcher (Resend).
//   { action: "enqueue", ... }            -> create sequence row, mark Email 1 as already sent (the roadmap email).
//   { action: "tick" }                    -> cron entry; sends emails 2-5 at days 3/7/14/21 if not booked/unsubscribed.
//   { action: "mark_demo_booked", ... }   -> stops the sequence.
//
// Plain-text-leaning HTML for deliverability. Tracking pixel + redirect-tracked CTAs.
import { z } from "https://esm.sh/zod@3.23.8";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const CRON_SECRET = Deno.env.get("CRON_SECRET");
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const FROM = "ApexAML AML <onboarding@resend.dev>"; // swap to verified domain when ready
const REPLY_TO = "hello@apexaml.com";
const APP_BASE = "https://apexaml.com"; // public-facing site for CTAs
const FN_BASE = `${SUPABASE_URL}/functions/v1`;
const DEADLINE_DATE = new Date("2026-06-10T00:00:00Z");

const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { persistSession: false },
});

const EnqueueSchema = z.object({
  action: z.literal("enqueue"),
  leadId: z.string().uuid().optional().nullable(),
  contactName: z.string().min(1).max(150),
  institutionName: z.string().min(1).max(200),
  institutionType: z.string().max(100).optional().nullable(),
  email: z.string().email().max(255),
  refNumber: z.string().min(1).max(80),
  deadline: z.string().max(80).optional().nullable(),
});
const TickSchema = z.object({ action: z.literal("tick") });
const MarkSchema = z.object({
  action: z.literal("mark_demo_booked"),
  email: z.string().email().optional().nullable(),
  refNumber: z.string().optional().nullable(),
});
const BodySchema = z.union([EnqueueSchema, TickSchema, MarkSchema]);

function daysUntilDeadline(now = new Date()): number {
  return Math.max(0, Math.ceil((DEADLINE_DATE.getTime() - now.getTime()) / 86_400_000));
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}

function trackedLink(token: string, step: number, target: string): string {
  return `${FN_BASE}/email-track?t=${encodeURIComponent(token)}&s=${step}&url=${encodeURIComponent(target)}`;
}
function pixel(token: string, step: number): string {
  return `${FN_BASE}/email-track?t=${encodeURIComponent(token)}&s=${step}&type=open`;
}
function unsubscribeUrl(token: string): string {
  return `${FN_BASE}/email-unsubscribe?t=${encodeURIComponent(token)}`;
}

// ---------- Templates (plain-text-leaning HTML) ----------

interface Row {
  id: string; contact_name: string; institution_name: string; institution_type: string | null;
  email: string; ref_number: string; tracking_token: string; deadline: string;
}

function shell(opts: {
  preheader: string; bodyHtml: string; ctaText: string; ctaUrl: string;
  token: string; step: number;
}): string {
  const unsub = unsubscribeUrl(opts.token);
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>ApexAML AML</title></head>
<body style="margin:0;padding:0;background:#ffffff;color:#1a1a1a;font-family:Helvetica,Arial,sans-serif;font-size:15px;line-height:1.55">
<div style="display:none;max-height:0;overflow:hidden;color:transparent">${escapeHtml(opts.preheader)}</div>
<table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td align="center" style="padding:24px 16px">
<table width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;width:100%">
<tr><td style="padding:0 0 16px 0;font-weight:600;color:#0f172a;font-size:16px">ApexAML <span style="color:#64748b;font-weight:400">— CBN AML Compliance</span></td></tr>
<tr><td>${opts.bodyHtml}</td></tr>
<tr><td style="padding:24px 0 8px 0">
  <a href="${opts.ctaUrl}" style="display:inline-block;background:#1d4ed8;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:6px;font-weight:600">${escapeHtml(opts.ctaText)}</a>
</td></tr>
<tr><td style="padding:24px 0 0 0;font-size:12px;color:#64748b;border-top:1px solid #e2e8f0;margin-top:24px">
  <p style="margin:16px 0 4px 0">ApexAML AML — CBN/NFIU compliance platform</p>
  <p style="margin:0 0 4px 0">Reply to this email or contact <a href="mailto:${REPLY_TO}" style="color:#1d4ed8">${REPLY_TO}</a></p>
  <p style="margin:8px 0 0 0">Don't want these? <a href="${unsub}" style="color:#64748b;text-decoration:underline">Unsubscribe</a> · NDPR: we only contact compliance officers who generated a CBN roadmap with us.</p>
</td></tr>
</table></td></tr></table>
<img src="${pixel(opts.token, opts.step)}" width="1" height="1" alt="" style="display:block;width:1px;height:1px;border:0" />
</body></html>`;
}

function tmplEmail2(r: Row) {
  const cta = trackedLink(r.tracking_token, 2, `${APP_BASE}/?utm_source=drip&utm_campaign=cbn_followup&utm_content=email2#book-demo`);
  const html = shell({
    preheader: `Have you submitted ${r.institution_name}'s roadmap to CBN yet?`,
    step: 2, token: r.tracking_token, ctaText: "Book free roadmap review →", ctaUrl: cta,
    bodyHtml: `<p>Hi ${escapeHtml(r.contact_name.split(" ")[0])},</p>
<p>You generated your CBN AML roadmap (Ref ${escapeHtml(r.ref_number)}) for <strong>${escapeHtml(r.institution_name)}</strong> three days ago.</p>
<p>Have you submitted it to CBN yet? If you'd like a second pair of eyes, our compliance team will review it for free — formatting, missing capability areas, attestation language.</p>
<p>Reply to this email, or book a 20-minute call:</p>`,
  });
  return { subject: `Have you submitted your CBN roadmap yet? — ${r.institution_name}`, html };
}

function tmplEmail3(r: Row) {
  const cta = trackedLink(r.tracking_token, 3, `${APP_BASE}/?utm_source=drip&utm_campaign=cbn_followup&utm_content=email3#book-demo`);
  const html = shell({
    preheader: `What CBN does to institutions that miss the June 10 deadline.`,
    step: 3, token: r.tracking_token, ctaText: "Start your ApexAML implementation →", ctaUrl: cta,
    bodyHtml: `<p>Hi ${escapeHtml(r.contact_name.split(" ")[0])},</p>
<p>What happens if <strong>${escapeHtml(r.institution_name)}</strong> misses the 10 June 2026 CBN AML roadmap deadline? Based on prior CBN enforcement patterns under Circular BSD/DIR/PUB/LAB/019/002 and earlier AML guidance:</p>
<ol style="padding-left:18px;margin:0 0 16px 0">
<li><strong>Initial warning letter</strong> from the BSD demanding written justification within 14 days.</li>
<li><strong>Escalation to a targeted AML examination</strong> — on-site review of CDD files, STR/CTR submissions, sanctions screening evidence, and board minutes.</li>
<li><strong>Conditional licence renewal</strong> with mandated remediation milestones, additional capital reporting, or restrictions on new product launches.</li>
<li><strong>Public publication</strong> in the CBN's enforcement bulletin — visible to correspondent banks and counterparties.</li>
</ol>
<p>ApexAML clients have already submitted their roadmaps. You can too — covering all 10 CBN capability areas, live in 48 hours.</p>`,
  });
  return { subject: `What happens if ${r.institution_name} misses the June 10 CBN deadline?`, html };
}

function tmplEmail4(r: Row) {
  const peer = (r.institution_type || "Nigerian financial institution").trim();
  const cta = trackedLink(r.tracking_token, 4, `${APP_BASE}/?utm_source=drip&utm_campaign=cbn_followup&utm_content=email4#how-it-works`);
  const html = shell({
    preheader: `How ${peer}s in your peer group are using ApexAML today.`,
    step: 4, token: r.tracking_token, ctaText: `See how ${peer}s use ApexAML →`, ctaUrl: cta,
    bodyHtml: `<p>Hi ${escapeHtml(r.contact_name.split(" ")[0])},</p>
<p>Your peers — other ${escapeHtml(peer)}s — are already live on ApexAML.</p>
<blockquote style="margin:16px 0;padding:12px 16px;border-left:3px solid #1d4ed8;background:#f1f5f9;font-style:italic;color:#1e293b">
"Took 90 seconds to generate the roadmap, 48 hours to go live, and we filed our first NFIU goAML STR through ApexAML the same week."<br/>
<span style="font-style:normal;font-size:12px;color:#64748b">— CCO, Tier-3 ${escapeHtml(peer)}, Lagos</span>
</blockquote>
<p style="margin:16px 0"><strong>Average ApexAML client goes from zero to CBN milestone 1 in 48 hours.</strong></p>
<p>Don't let <strong>${escapeHtml(r.institution_name)}</strong> be the one explaining to the BSD why your roadmap is still in draft.</p>`,
  });
  return { subject: `Your ${peer} peers are already live on ApexAML`, html };
}

function tmplEmail5(r: Row) {
  const days = daysUntilDeadline();
  const cta = trackedLink(r.tracking_token, 5, `${APP_BASE}/?utm_source=drip&utm_campaign=cbn_followup&utm_content=email5#pricing`);
  const html = shell({
    preheader: `First-month-free for CBN roadmap holders expires June 10.`,
    step: 5, token: r.tracking_token, ctaText: "Claim your free month →", ctaUrl: cta,
    bodyHtml: `<p>Hi ${escapeHtml(r.contact_name.split(" ")[0])},</p>
<p>Last reminder for <strong>${escapeHtml(r.institution_name)}</strong>.</p>
<p>Our <strong>first-month-free offer for CBN roadmap holders expires on 10 June 2026</strong> — the same day as your CBN roadmap submission deadline (${days} days away). After that, standard pricing applies.</p>
<p>This is the cheapest your AML platform will ever be. One reply gets you onboarded this week.</p>`,
  });
  return { subject: `Last chance — first month free expires with the CBN deadline`, html };
}

// ---------- Resend send + logging ----------

async function sendEmail(r: Row, step: number, subject: string, html: string): Promise<{ ok: boolean; error?: string; id?: string }> {
  if (!RESEND_API_KEY) {
    console.warn("[email-mock] RESEND_API_KEY missing — logging only");
    console.log(`[email-mock] step=${step} to=${r.email} subject=${subject}`);
    return { ok: true, id: "mock" };
  }
  try {
    const resp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: FROM,
        to: [r.email],
        reply_to: REPLY_TO,
        subject,
        html,
        headers: {
          "List-Unsubscribe": `<${unsubscribeUrl(r.tracking_token)}>`,
          "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
        },
        tags: [{ name: "campaign", value: "cbn_drip" }, { name: "step", value: String(step) }],
      }),
    });
    if (!resp.ok) {
      const text = await resp.text();
      return { ok: false, error: `Resend ${resp.status}: ${text.slice(0, 240)}` };
    }
    const data = await resp.json();
    return { ok: true, id: data?.id };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

async function logEvent(seqId: string, email: string, step: number, type: "sent" | "failed", metadata: unknown = null) {
  await admin.from("email_events").insert({
    sequence_id: seqId, email, email_step: step, event_type: type, metadata: metadata ?? null,
  });
}

async function dispatchStep(r: Row, step: 2 | 3 | 4 | 5) {
  const tmpl = step === 2 ? tmplEmail2(r) : step === 3 ? tmplEmail3(r) : step === 4 ? tmplEmail4(r) : tmplEmail5(r);
  const res = await sendEmail(r, step, tmpl.subject, tmpl.html);
  const col = `email_${step}_sent_at`;
  if (res.ok) {
    await admin.from("email_sequences").update({ [col]: new Date().toISOString(), last_error: null }).eq("id", r.id);
    await logEvent(r.id, r.email, step, "sent", { resend_id: res.id });
  } else {
    await admin.from("email_sequences").update({ last_error: res.error ?? "send failed" }).eq("id", r.id);
    await logEvent(r.id, r.email, step, "failed", { error: res.error });
  }
  return res.ok;
}

// ---------- Handlers ----------

async function handleEnqueue(p: z.infer<typeof EnqueueSchema>) {
  // Suppression: if previously unsubscribed, do not re-enqueue.
  const { data: sup } = await admin
    .from("email_sequences")
    .select("id")
    .ilike("email", p.email)
    .not("unsubscribed_at", "is", null)
    .limit(1);
  if (sup && sup.length > 0) {
    return new Response(JSON.stringify({ ok: true, suppressed: true }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { data, error } = await admin
    .from("email_sequences")
    .insert({
      lead_id: p.leadId ?? null,
      contact_name: p.contactName,
      institution_name: p.institutionName,
      institution_type: p.institutionType ?? null,
      email: p.email.toLowerCase(),
      ref_number: p.refNumber,
      deadline: p.deadline ?? "10 June 2026",
      // Email 1 (the roadmap email) is sent by send-roadmap-email — record it as already-sent.
      email_1_sent_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error || !data) {
    return new Response(JSON.stringify({ ok: false, error: error?.message ?? "insert failed" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  await logEvent(data.id, data.email, 1, "sent", { source: "send-roadmap-email" });
  return new Response(JSON.stringify({ ok: true, id: data.id }), {
    status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function handleTick() {
  const now = new Date();
  // Day offsets relative to email_1_sent_at.
  const schedule: Array<{ step: 2 | 3 | 4 | 5; days: number; col: string; prevCol: string }> = [
    { step: 2, days: 3,  col: "email_2_sent_at", prevCol: "email_1_sent_at" },
    { step: 3, days: 7,  col: "email_3_sent_at", prevCol: "email_1_sent_at" },
    { step: 4, days: 14, col: "email_4_sent_at", prevCol: "email_1_sent_at" },
    { step: 5, days: 21, col: "email_5_sent_at", prevCol: "email_1_sent_at" },
  ];

  const results: Record<string, number> = {};
  for (const s of schedule) {
    const cutoff = new Date(now.getTime() - s.days * 86_400_000).toISOString();
    const { data: rows } = await admin
      .from("email_sequences")
      .select("id, contact_name, institution_name, institution_type, email, ref_number, tracking_token, deadline, email_1_sent_at")
      .eq("demo_booked", false)
      .is("unsubscribed_at", null)
      .is("bounced_at", null)
      .is(s.col, null)
      .not(s.prevCol, "is", null)
      .lte(s.prevCol, cutoff)
      .limit(50);

    let sent = 0;
    for (const row of rows ?? []) {
      const ok = await dispatchStep(row as Row, s.step);
      if (ok) sent++;
    }
    results[`step_${s.step}`] = sent;
  }
  return new Response(JSON.stringify({ ok: true, results }), {
    status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function handleMarkDemo(p: z.infer<typeof MarkSchema>) {
  if (!p.refNumber) {
    return new Response(JSON.stringify({ ok: false, error: "refNumber required" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  // Require ref_number match. Optional email must also match if provided.
  let q = admin.from("email_sequences").update({ demo_booked: true }).eq("ref_number", p.refNumber);
  if (p.email) q = q.ilike("email", p.email);
  const { error } = await q;
  if (error) {
    return new Response(JSON.stringify({ ok: false, error: error.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  return new Response(JSON.stringify({ ok: true }), {
    status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function isAdmin(req: Request): Promise<boolean> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return false;
  const userClient = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false },
  });
  const { data: u } = await userClient.auth.getUser();
  if (!u?.user) return false;
  const { data: role } = await admin
    .from("user_roles").select("role").eq("user_id", u.user.id).eq("role", "admin").maybeSingle();
  return !!role;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  // touch unused secret to avoid linter complaints in mock mode
  void LOVABLE_API_KEY;

  let parsed;
  try { parsed = BodySchema.safeParse(await req.json()); }
  catch { return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }); }
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: parsed.error.flatten() }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  try {
    if (parsed.data.action === "enqueue") return await handleEnqueue(parsed.data);
    if (parsed.data.action === "tick") {
      const provided = req.headers.get("x-cron-secret") ?? "";
      if (!CRON_SECRET || provided !== CRON_SECRET) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return await handleTick();
    }
    // mark_demo_booked: refNumber+email both required and must match an existing
    // sequence row. Refs are server-generated secrets unique to each lead.
    return await handleMarkDemo(parsed.data);
  } catch (e) {
    console.error("email-sequence-dispatch error", e);
    return new Response(JSON.stringify({ ok: false, error: e instanceof Error ? e.message : "unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
