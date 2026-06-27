// Book a demo: validate, persist the demo_request, mark the slot as booked,
// and dispatch both an attendee confirmation email and an internal alert.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const RESEND_GATEWAY_URL = "https://connector-gateway.lovable.dev/resend";

// Internal alert + Zoom meeting (swap for production values)
const INTERNAL_ALERT_EMAIL = "adetokunboogun@gmail.com";
const ZOOM_LINK = "https://zoom.us/j/0000000000?pwd=apexaml";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const admin = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });

interface BookingPayload {
  institutionName: string;
  institutionType: string;
  role: string;
  fullName: string;
  email: string;
  whatsapp?: string;
  focusAreas?: string;
  slotDatetime: string; // ISO
}

function isEmail(v: unknown): v is string {
  return typeof v === "string" && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v);
}
function esc(v: string) {
  return v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
function fmtSlot(iso: string) {
  const d = new Date(iso);
  // Render in WAT (UTC+1)
  const wat = new Date(d.getTime());
  const day = wat.toLocaleDateString("en-GB", { weekday: "long", timeZone: "Africa/Lagos" });
  const date = wat.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "Africa/Lagos" });
  const time = wat.toLocaleTimeString("en-GB", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: "Africa/Lagos" });
  return { day, date, time, label: `${day}, ${date} at ${time} WAT` };
}

function attendeeHtml(p: BookingPayload, slotLabel: string) {
  return `<!doctype html><html><body style="margin:0;background:#0a0f1c;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#1a1a2e;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0a0f1c;padding:32px 0;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:14px;overflow:hidden;max-width:600px;">
        <tr><td style="background:#0a0f1c;padding:28px;color:#fff;">
          <div style="font-size:12px;letter-spacing:.18em;color:#D4A843;text-transform:uppercase;">ApexAML</div>
          <div style="font-size:22px;font-weight:700;margin-top:6px;">Your demo is confirmed</div>
          <div style="font-size:13px;color:rgba(255,255,255,.7);margin-top:6px;">${esc(slotLabel)}</div>
        </td></tr>
        <tr><td style="padding:28px;">
          <p style="margin:0 0 14px;font-size:15px;line-height:1.6;">Hi ${esc(p.fullName.split(" ")[0])},</p>
          <p style="margin:0 0 14px;font-size:14px;line-height:1.6;color:#444;">Thank you for booking a 30-minute walkthrough of ApexAML for <strong>${esc(p.institutionName)}</strong>. Your slot is locked in and a calendar invite will follow shortly.</p>
          <div style="background:#f6f7fb;border-left:3px solid #D4A843;padding:14px 18px;border-radius:8px;margin:18px 0;">
            <div style="font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#6b6b80;">Join via Zoom</div>
            <a href="${ZOOM_LINK}" style="font-size:14px;color:#0a0f1c;font-weight:600;word-break:break-all;">${ZOOM_LINK}</a>
          </div>
          <div style="font-size:13px;font-weight:700;color:#0a0f1c;margin:22px 0 10px;">30-MINUTE AGENDA — ${esc(p.institutionName)}</div>
          <ol style="font-size:14px;line-height:1.7;color:#333;padding-left:20px;margin:0 0 18px;">
            <li><strong>0–5 min</strong> · Compliance posture & CBN Circular alignment for ${esc(p.institutionType || "your institution")}</li>
            <li><strong>5–20 min</strong> · Live walkthrough: AI STR co-pilot, transaction monitoring, NFIU goAML export</li>
            <li><strong>20–28 min</strong> · ${esc(p.focusAreas?.trim() || "Tailored deep-dive on your priority workflows")}</li>
            <li><strong>28–30 min</strong> · Implementation timeline & next steps</li>
          </ol>
          <div style="font-size:13px;font-weight:700;color:#0a0f1c;margin:22px 0 10px;">3 QUESTIONS TO PREPARE</div>
          <ul style="font-size:14px;line-height:1.7;color:#333;padding-left:20px;margin:0 0 18px;">
            <li>How many alerts does your team review per month today?</li>
            <li>How long does a typical STR take from alert to NFIU submission?</li>
            <li>Which CBN obligation gives your team the most operational pain?</li>
          </ul>
          <p style="margin:24px 0 0;font-size:13px;color:#6b6b80;">If you need to reschedule, just reply to this email.</p>
        </td></tr>
        <tr><td style="padding:16px 28px;background:#fafafc;border-top:1px solid #eee;font-size:11px;color:#6b6b80;">ApexAML — Nigeria's AML Compliance Intelligence Platform</td></tr>
      </table>
    </td></tr>
  </table></body></html>`;
}

function internalHtml(p: BookingPayload, slotLabel: string, requestId: string) {
  return `<!doctype html><html><body style="font-family:-apple-system,sans-serif;background:#f4f5f9;padding:24px;">
  <table role="presentation" width="640" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;margin:0 auto;">
    <tr><td style="background:#0a0f1c;color:#fff;padding:22px 26px;">
      <div style="font-size:11px;letter-spacing:.18em;color:#D4A843;text-transform:uppercase;">New demo booking</div>
      <div style="font-size:20px;font-weight:700;margin-top:4px;">${esc(p.institutionName)} — ${esc(p.institutionType)}</div>
      <div style="font-size:13px;color:rgba(255,255,255,.7);margin-top:4px;">${esc(slotLabel)}</div>
    </td></tr>
    <tr><td style="padding:22px 26px;font-size:14px;line-height:1.7;color:#1a1a2e;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="color:#6b6b80;width:160px;padding:6px 0;">Contact</td><td style="padding:6px 0;"><strong>${esc(p.fullName)}</strong> · ${esc(p.role)}</td></tr>
        <tr><td style="color:#6b6b80;padding:6px 0;">Email</td><td style="padding:6px 0;"><a href="mailto:${esc(p.email)}">${esc(p.email)}</a></td></tr>
        <tr><td style="color:#6b6b80;padding:6px 0;">WhatsApp</td><td style="padding:6px 0;">${esc(p.whatsapp || "—")}</td></tr>
        <tr><td style="color:#6b6b80;padding:6px 0;">Institution</td><td style="padding:6px 0;">${esc(p.institutionName)} (${esc(p.institutionType)})</td></tr>
        <tr><td style="color:#6b6b80;padding:6px 0;vertical-align:top;">Wants to see</td><td style="padding:6px 0;">${esc(p.focusAreas || "—")}</td></tr>
        <tr><td style="color:#6b6b80;padding:6px 0;">Request ID</td><td style="padding:6px 0;font-family:monospace;font-size:12px;">${esc(requestId)}</td></tr>
      </table>
      <div style="margin-top:18px;padding:14px;background:#fff8e6;border-left:3px solid #D4A843;border-radius:6px;font-size:13px;">
        <strong>Prep checklist:</strong> Review their institution type, pre-load relevant typologies (${esc(p.institutionType || "general")}), and prep the focus-area demo: ${esc(p.focusAreas || "general walkthrough")}.
      </div>
    </td></tr>
  </table></body></html>`;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = (await req.json().catch(() => null)) as Partial<BookingPayload> | null;
    if (
      !body ||
      typeof body.institutionName !== "string" || body.institutionName.trim().length < 2 ||
      typeof body.institutionType !== "string" ||
      typeof body.role !== "string" ||
      typeof body.fullName !== "string" || body.fullName.trim().length < 2 ||
      !isEmail(body.email) ||
      typeof body.slotDatetime !== "string"
    ) {
      return new Response(JSON.stringify({ ok: false, reason: "invalid_payload" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const slotDate = new Date(body.slotDatetime);
    if (Number.isNaN(slotDate.getTime()) || slotDate.getTime() < Date.now() - 5 * 60_000) {
      return new Response(JSON.stringify({ ok: false, reason: "invalid_slot" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Reject if slot already booked
    const { data: existingSlot } = await admin
      .from("demo_slots")
      .select("id, status")
      .eq("slot_datetime", slotDate.toISOString())
      .maybeSingle();
    if (existingSlot && existingSlot.status === "booked") {
      return new Response(JSON.stringify({ ok: false, reason: "slot_taken" }), {
        status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const payload: BookingPayload = {
      institutionName: body.institutionName.trim().slice(0, 200),
      institutionType: body.institutionType.trim().slice(0, 50),
      role: body.role.trim().slice(0, 80),
      fullName: body.fullName.trim().slice(0, 120),
      email: body.email.trim().toLowerCase(),
      whatsapp: (body.whatsapp || "").trim().slice(0, 40),
      focusAreas: (body.focusAreas || "").trim().slice(0, 800),
      slotDatetime: slotDate.toISOString(),
    };

    const { data: insertReq, error: insertErr } = await admin
      .from("demo_requests")
      .insert({
        contact_name: payload.fullName,
        institution_name: payload.institutionName,
        institution_type: payload.institutionType,
        role: payload.role,
        email: payload.email,
        whatsapp: payload.whatsapp || null,
        focus_areas: payload.focusAreas || null,
        slot_datetime: payload.slotDatetime,
        source: "book_demo_sheet_v2",
      })
      .select("id")
      .single();

    if (insertErr || !insertReq) {
      console.error("send-demo-confirmation: insert failed", insertErr);
      return new Response(JSON.stringify({ ok: false, reason: "db_error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Upsert the slot as booked
    await admin
      .from("demo_slots")
      .upsert(
        {
          slot_datetime: payload.slotDatetime,
          status: "booked",
          booked_by_request_id: insertReq.id,
        },
        { onConflict: "slot_datetime" },
      );

    const slot = fmtSlot(payload.slotDatetime);

    // Fire emails (don't fail the request if email infra is missing)
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (LOVABLE_API_KEY && RESEND_API_KEY) {
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "X-Connection-Api-Key": RESEND_API_KEY,
      };

      const attendeeBody = JSON.stringify({
        from: "ApexAML <hello@apexaml.com>",
        to: [payload.email],
        reply_to: "hello@apexaml.com",
        subject: `Demo confirmed — ${slot.label}`,
        html: attendeeHtml(payload, slot.label),
      });
      fetch(`${RESEND_GATEWAY_URL}/emails`, { method: "POST", headers, body: attendeeBody })
        .then((r) => { if (!r.ok) console.error("attendee email failed", r.status); })
        .catch((e) => console.error("attendee email error", e));

      const internalBody = JSON.stringify({
        from: "ApexAML System <hello@apexaml.com>",
        to: [INTERNAL_ALERT_EMAIL],
        subject: `📅 New demo: ${payload.institutionName} — ${slot.label}`,
        html: internalHtml(payload, slot.label, insertReq.id),
      });
      fetch(`${RESEND_GATEWAY_URL}/emails`, { method: "POST", headers, body: internalBody })
        .then((r) => { if (!r.ok) console.error("internal email failed", r.status); })
        .catch((e) => console.error("internal email error", e));
    } else {
      console.warn("send-demo-confirmation: email infra missing, skipping sends");
    }

    return new Response(
      JSON.stringify({
        ok: true,
        requestId: insertReq.id,
        slot: { iso: payload.slotDatetime, label: slot.label, day: slot.day, date: slot.date, time: slot.time },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("send-demo-confirmation: unexpected error", err);
    return new Response(JSON.stringify({ ok: false, reason: "exception" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
