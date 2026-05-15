// WhatsApp follow-up dispatcher.
// Modes:
//   { action: "enqueue", ... }  -> create a sequence row + send message 1 immediately.
//   { action: "tick" }          -> cron entry point: send message 2 (>=48h) and message 3 (>=7d) where due.
//   { action: "mark_demo_booked", phone | refNumber }
//
// Provider: if TERMII_API_KEY is set we call Termii. Otherwise we mock by logging.
// No JWT required (called from client for enqueue, and from pg_cron for tick).
import { z } from "https://esm.sh/zod@3.23.8";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const CRON_SECRET = Deno.env.get("CRON_SECRET");
const TERMII_API_KEY = Deno.env.get("TERMII_API_KEY");
const TERMII_SENDER_ID = Deno.env.get("TERMII_SENDER_ID") ?? "ApexAML";

const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { persistSession: false },
});

const EnqueueSchema = z.object({
  action: z.literal("enqueue"),
  leadId: z.string().uuid().optional().nullable(),
  contactName: z.string().min(1).max(150),
  institutionName: z.string().min(1).max(200),
  institutionType: z.string().max(100).optional().nullable(),
  phone: z.string().min(6).max(40),
  email: z.string().email().max(255).optional().nullable(),
  refNumber: z.string().min(1).max(80),
  deadline: z.string().max(80).optional().nullable(),
});

const TickSchema = z.object({ action: z.literal("tick") });
const MarkSchema = z.object({
  action: z.literal("mark_demo_booked"),
  phone: z.string().optional().nullable(),
  refNumber: z.string().optional().nullable(),
});

const BodySchema = z.union([EnqueueSchema, TickSchema, MarkSchema]);

const DEADLINE = "10 June 2026";
const DEADLINE_DATE = new Date("2026-06-10T00:00:00Z");

function daysUntilDeadline(now = new Date()): number {
  const ms = DEADLINE_DATE.getTime() - now.getTime();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

function normalisePhone(raw: string): string {
  // Strip everything except digits and leading +
  const trimmed = raw.trim();
  const plus = trimmed.startsWith("+");
  const digits = trimmed.replace(/\D/g, "");
  return plus ? `+${digits}` : digits;
}

function msgOne(name: string, institution: string, ref: string, email: string | null): string {
  const emailFrag = email ? ` It has been sent to ${email}.` : "";
  return `Hello ${name}, your CBN AML roadmap for ${institution} has been generated (Ref: ${ref}).${emailFrag} The CBN roadmap submission deadline is June 10, 2026. Reply DEMO to book a 20-minute implementation session with our compliance team. — ApexAML AML`;
}

function msgTwo(name: string, institution: string, daysLeft: number): string {
  return `Hi ${name}, just checking — did you receive your CBN roadmap for ${institution}? Your submission deadline is in ${daysLeft} days. Institutions that submit early avoid last-minute CBN scrutiny. If you need help implementing the roadmap, reply HELP or visit apexaml.com — ApexAML AML`;
}

function msgThree(institution: string, daysLeft: number): string {
  return `Final reminder for ${institution}: the CBN roadmap deadline is in ${daysLeft} days. ApexAML can have your AML system live within 48 hours — covering all 10 CBN capability areas. First month free for institutions that book before June 10. Reply DEMO to claim. — ApexAML AML`;
}

async function sendWhatsApp(to: string, message: string): Promise<{ ok: boolean; error?: string }> {
  const phone = normalisePhone(to);
  if (!TERMII_API_KEY) {
    // Mock provider — log only.
    console.log(`[whatsapp-mock] to=${phone} msg="${message}"`);
    return { ok: true };
  }
  try {
    const resp = await fetch("https://api.ng.termii.com/api/sms/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: phone,
        from: TERMII_SENDER_ID,
        sms: message,
        type: "plain",
        channel: "whatsapp",
        api_key: TERMII_API_KEY,
      }),
    });
    if (!resp.ok) {
      const text = await resp.text();
      console.error(`Termii error [${resp.status}]:`, text);
      return { ok: false, error: `Termii ${resp.status}: ${text.slice(0, 200)}` };
    }
    return { ok: true };
  } catch (e) {
    const err = e instanceof Error ? e.message : String(e);
    console.error("Termii call failed:", err);
    return { ok: false, error: err };
  }
}

async function handleEnqueue(p: z.infer<typeof EnqueueSchema>) {
  const { data: row, error: insErr } = await admin
    .from("whatsapp_sequences")
    .insert({
      lead_id: p.leadId ?? null,
      contact_name: p.contactName,
      institution_name: p.institutionName,
      institution_type: p.institutionType ?? null,
      phone: normalisePhone(p.phone),
      email: p.email ?? null,
      ref_number: p.refNumber,
      deadline: p.deadline ?? DEADLINE,
    })
    .select()
    .single();

  if (insErr || !row) {
    console.error("Failed to insert whatsapp_sequence", insErr);
    return new Response(JSON.stringify({ ok: false, error: insErr?.message ?? "insert failed" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const send = await sendWhatsApp(row.phone, msgOne(row.contact_name, row.institution_name, row.ref_number, row.email));

  await admin
    .from("whatsapp_sequences")
    .update({
      message_1_sent_at: send.ok ? new Date().toISOString() : null,
      last_error: send.ok ? null : send.error ?? "send failed",
    })
    .eq("id", row.id);

  return new Response(JSON.stringify({ ok: true, id: row.id, sent: send.ok }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function handleTick() {
  const now = new Date();
  const cutoff48h = new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString();
  const cutoff7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const daysLeft = daysUntilDeadline(now);

  const sentM2: string[] = [];
  const sentM3: string[] = [];
  const errors: string[] = [];

  // ---- Message 2: 48h after M1, no demo, M2 not yet sent
  const { data: m2Rows } = await admin
    .from("whatsapp_sequences")
    .select("*")
    .eq("demo_booked", false)
    .is("message_2_sent_at", null)
    .not("message_1_sent_at", "is", null)
    .lte("message_1_sent_at", cutoff48h)
    .limit(50);

  for (const r of m2Rows ?? []) {
    const res = await sendWhatsApp(r.phone, msgTwo(r.contact_name, r.institution_name, daysLeft));
    await admin
      .from("whatsapp_sequences")
      .update({
        message_2_sent_at: res.ok ? new Date().toISOString() : null,
        last_error: res.ok ? null : res.error ?? "send failed",
      })
      .eq("id", r.id);
    if (res.ok) sentM2.push(r.id);
    else errors.push(`${r.id}: ${res.error}`);
  }

  // ---- Message 3: 7d after M2, no demo, M3 not yet sent
  const { data: m3Rows } = await admin
    .from("whatsapp_sequences")
    .select("*")
    .eq("demo_booked", false)
    .is("message_3_sent_at", null)
    .not("message_2_sent_at", "is", null)
    .lte("message_2_sent_at", cutoff7d)
    .limit(50);

  for (const r of m3Rows ?? []) {
    const res = await sendWhatsApp(r.phone, msgThree(r.institution_name, daysLeft));
    await admin
      .from("whatsapp_sequences")
      .update({
        message_3_sent_at: res.ok ? new Date().toISOString() : null,
        last_error: res.ok ? null : res.error ?? "send failed",
      })
      .eq("id", r.id);
    if (res.ok) sentM3.push(r.id);
    else errors.push(`${r.id}: ${res.error}`);
  }

  return new Response(
    JSON.stringify({ ok: true, sentM2: sentM2.length, sentM3: sentM3.length, errors }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
}

async function handleMarkDemo(p: z.infer<typeof MarkSchema>) {
  if (!p.refNumber) {
    return new Response(JSON.stringify({ ok: false, error: "refNumber required" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  let q = admin.from("whatsapp_sequences").update({ demo_booked: true }).eq("ref_number", p.refNumber);
  if (p.phone) q = q.eq("phone", normalisePhone(p.phone));
  const { error } = await q;
  if (error) {
    return new Response(JSON.stringify({ ok: false, error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
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
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  let parsed;
  try {
    parsed = BodySchema.safeParse(await req.json());
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: parsed.error.flatten() }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    if (parsed.data.action === "enqueue") return await handleEnqueue(parsed.data);
    if (parsed.data.action === "tick") return await handleTick();
    return await handleMarkDemo(parsed.data);
  } catch (e) {
    console.error("whatsapp-followup unexpected error", e);
    const msg = e instanceof Error ? e.message : "unknown error";
    return new Response(JSON.stringify({ ok: false, error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
