// Send the generated CBN AML roadmap to the compliance officer via Resend.
// Failures are logged to console only — the in-app roadmap is the primary UX.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const RESEND_GATEWAY_URL = "https://connector-gateway.lovable.dev/resend";

// Admin alert recipient — swap this out as needed
const ADMIN_ALERT_EMAIL = "adetokunboogun@yahoo.com";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const adminDb = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });

// Anti-abuse: verify (leadId, recipient email) corresponds to a roadmap_leads row
// inserted within the last 30 minutes. Prevents this endpoint from being used as
// an open relay for ApexAML's verified sender.
const LEAD_FRESHNESS_MS = 30 * 60 * 1000;
async function verifyFreshLead(leadId: string | undefined | null, email: string): Promise<boolean> {
  if (!leadId || typeof leadId !== "string") return false;
  const { data } = await adminDb
    .from("roadmap_leads")
    .select("id, email, created_at")
    .eq("id", leadId)
    .maybeSingle();
  if (!data) return false;
  if ((data.email ?? "").trim().toLowerCase() !== email.trim().toLowerCase()) return false;
  const created = new Date(data.created_at).getTime();
  return Number.isFinite(created) && Date.now() - created <= LEAD_FRESHNESS_MS;
}

interface RoadmapEmailPayload {
  to: string;
  name: string;
  institution: string;
  type: string;
  roadmapText: string;
  refNumber: string;
  leadId?: string;
  contactTitle?: string;
  phoneNumber?: string;
  amlSetup?: string;
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function isEmail(s: unknown): s is string {
  return typeof s === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

function buildHtml(p: RoadmapEmailPayload): string {
  const safeName = escapeHtml(p.name || "Compliance Officer");
  const safeInst = escapeHtml(p.institution || "your institution");
  const safeRef = escapeHtml(p.refNumber);
  const safeRoadmap = escapeHtml(p.roadmapText);
  const today = new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const ctaUrl = "https://apexaml.com/?utm_source=roadmap_email&utm_medium=email&utm_campaign=cbn_roadmap";
  const unsubUrl = `https://apexaml.com/unsubscribe?email=${encodeURIComponent(p.to)}`;

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>Your CBN AML Roadmap</title>
  </head>
  <body style="margin:0;padding:0;background:#f4f4f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#1a1a2e;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f4f4f7;padding:24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="640" cellpadding="0" cellspacing="0" border="0" style="max-width:640px;width:100%;background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.04);">
            <!-- HEADER -->
            <tr>
              <td style="background:#1a1a2e;padding:24px 28px;">
                <div style="font-size:22px;font-weight:600;color:#ffffff;letter-spacing:-0.01em;">ApexAML</div>
                <div style="font-size:12px;color:rgba(255,255,255,0.55);margin-top:4px;">CBN AML Compliance Platform</div>
              </td>
            </tr>

            <!-- BODY -->
            <tr>
              <td style="padding:32px 28px 8px 28px;">
                <p style="font-size:15px;line-height:1.6;color:#1a1a2e;margin:0 0 16px;">Dear ${safeName},</p>
                <p style="font-size:14px;line-height:1.7;color:#3a3a4e;margin:0 0 24px;">
                  Your CBN AML implementation roadmap for <strong style="color:#1a1a2e;">${safeInst}</strong> has been
                  generated and is attached below. This document is pre-formatted for submission to the CBN
                  Compliance Department in response to Circular
                  <span style="font-family:'SF Mono',Menlo,Consolas,monospace;font-size:13px;">BSD/DIR/PUB/LAB/019/002</span>.
                </p>
              </td>
            </tr>

            <!-- ROADMAP BODY -->
            <tr>
              <td style="padding:0 28px 24px 28px;">
                <pre style="background:#f4f4f7;border:1px solid #e5e5ec;border-radius:6px;padding:16px;font-family:'SF Mono',Menlo,Consolas,monospace;font-size:11.5px;line-height:1.7;color:#1a1a2e;white-space:pre-wrap;word-wrap:break-word;margin:0;overflow-x:auto;">${safeRoadmap}</pre>
              </td>
            </tr>

            <!-- DIVIDER -->
            <tr>
              <td style="padding:0 28px;">
                <div style="border-top:1px solid #e5e5ec;"></div>
              </td>
            </tr>

            <!-- WHAT NEXT -->
            <tr>
              <td style="padding:24px 28px 8px 28px;">
                <div style="font-size:13px;font-weight:600;color:#1a1a2e;margin:0 0 8px;text-transform:uppercase;letter-spacing:0.04em;">What next?</div>
                <p style="font-size:14px;line-height:1.7;color:#3a3a4e;margin:0 0 20px;">
                  This roadmap covers the controls — ApexAML is the platform that operates them. Sanctions screening,
                  transaction monitoring, NFIU goAML STRs, and the full IMTO regulatory pack are all live and
                  CBN-aligned.
                </p>
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px;">
                  <tr>
                    <td style="background:#1a1a2e;border-radius:6px;">
                      <a href="${ctaUrl}" style="display:inline-block;padding:12px 22px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;">Implement this roadmap with ApexAML →</a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- FOOTER -->
            <tr>
              <td style="padding:20px 28px 28px 28px;background:#fafafc;border-top:1px solid #eeeef3;">
                <div style="font-size:11px;line-height:1.7;color:#6b6b80;">
                  <div><strong style="color:#3a3a4e;">Reference:</strong> <span style="font-family:'SF Mono',Menlo,Consolas,monospace;">${safeRef}</span></div>
                  <div><strong style="color:#3a3a4e;">Generated:</strong> ${today}</div>
                  <div style="margin-top:10px;">
                    This email contains regulatory guidance prepared for ${safeInst}. NDPR notice: your contact
                    details were collected with consent at apexaml.com/roadmap and are processed solely to deliver this
                    roadmap and respond to compliance enquiries. We do not share your data with third parties.
                  </div>
                  <div style="margin-top:10px;">
                    <a href="${unsubUrl}" style="color:#6b6b80;text-decoration:underline;">Unsubscribe</a>
                    &nbsp;·&nbsp; ApexAML · hello@apexaml.com
                  </div>
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
function buildAdminAlertHtml(p: RoadmapEmailPayload): string {
  const safeName = escapeHtml(p.name || "Unknown");
  const safeTitle = escapeHtml(p.contactTitle || "");
  const safeInst = escapeHtml(p.institution || "Unknown");
  const safeType = escapeHtml(p.type || "");
  const safeEmail = escapeHtml(p.to);
  const safePhone = escapeHtml(p.phoneNumber || "Not provided");
  const safeSetup = escapeHtml(p.amlSetup || "Unknown");
  const safeRef = escapeHtml(p.refNumber);

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>New Enterprise Lead</title>
  </head>
  <body style="margin:0;padding:0;background:#f4f4f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#1a1a2e;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f4f4f7;padding:24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="640" cellpadding="0" cellspacing="0" border="0" style="max-width:640px;width:100%;background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.04);">
            <tr>
              <td style="background:#dc2626;padding:24px 28px;">
                <div style="font-size:18px;font-weight:600;color:#ffffff;letter-spacing:-0.01em;">🚨 New Enterprise Lead</div>
                <div style="font-size:12px;color:rgba(255,255,255,0.75);margin-top:4px;">ApexAML System Alert</div>
              </td>
            </tr>
            <tr>
              <td style="padding:28px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="font-size:14px;line-height:1.6;">
                  <tr>
                    <td style="padding:8px 0;border-bottom:1px solid #e5e5ec;width:140px;color:#6b6b80;vertical-align:top;"><strong>Name</strong></td>
                    <td style="padding:8px 0;border-bottom:1px solid #e5e5ec;color:#1a1a2e;vertical-align:top;">${safeName}${safeTitle ? ` <span style="color:#6b6b80;">(${safeTitle})</span>` : ""}</td>
                  </tr>
                  <tr>
                    <td style="padding:8px 0;border-bottom:1px solid #e5e5ec;color:#6b6b80;vertical-align:top;"><strong>Institution</strong></td>
                    <td style="padding:8px 0;border-bottom:1px solid #e5e5ec;color:#1a1a2e;vertical-align:top;">${safeInst}${safeType ? ` <span style="color:#6b6b80;">(${safeType})</span>` : ""}</td>
                  </tr>
                  <tr>
                    <td style="padding:8px 0;border-bottom:1px solid #e5e5ec;color:#6b6b80;vertical-align:top;"><strong>Email</strong></td>
                    <td style="padding:8px 0;border-bottom:1px solid #e5e5ec;color:#1a1a2e;vertical-align:top;"><a href="mailto:${safeEmail}" style="color:#1a1a2e;text-decoration:underline;">${safeEmail}</a></td>
                  </tr>
                  <tr>
                    <td style="padding:8px 0;border-bottom:1px solid #e5e5ec;color:#6b6b80;vertical-align:top;"><strong>Phone</strong></td>
                    <td style="padding:8px 0;border-bottom:1px solid #e5e5ec;color:#1a1a2e;vertical-align:top;">${safePhone}</td>
                  </tr>
                  <tr>
                    <td style="padding:8px 0;border-bottom:1px solid #e5e5ec;color:#6b6b80;vertical-align:top;"><strong>Current Setup</strong></td>
                    <td style="padding:8px 0;border-bottom:1px solid #e5e5ec;color:#1a1a2e;vertical-align:top;">${safeSetup}</td>
                  </tr>
                  <tr>
                    <td style="padding:8px 0;color:#6b6b80;vertical-align:top;"><strong>Reference</strong></td>
                    <td style="padding:8px 0;color:#1a1a2e;vertical-align:top;font-family:'SF Mono',Menlo,Consolas,monospace;font-size:13px;">${safeRef}</td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:0 28px 24px 28px;">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td style="background:#1a1a2e;border-radius:6px;">
                      <a href="https://apexaml.com/admin/roadmaps" style="display:inline-block;padding:12px 22px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;">View in Admin Dashboard →</a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 28px;background:#fafafc;border-top:1px solid #eeeef3;">
                <div style="font-size:11px;line-height:1.6;color:#6b6b80;">
                  This alert was generated automatically by the ApexAML system when a lead requested a CBN AML roadmap.
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("send-roadmap-email: LOVABLE_API_KEY not configured");
      return new Response(JSON.stringify({ ok: false, reason: "config" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      console.error("send-roadmap-email: RESEND_API_KEY not configured");
      return new Response(JSON.stringify({ ok: false, reason: "config" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = (await req.json().catch(() => null)) as Partial<RoadmapEmailPayload> | null;
    if (
      !body ||
      !isEmail(body.to) ||
      typeof body.roadmapText !== "string" ||
      body.roadmapText.trim().length < 50 ||
      typeof body.refNumber !== "string"
    ) {
      console.error("send-roadmap-email: invalid payload", {
        hasBody: !!body,
        toOk: isEmail(body?.to),
        roadmapLen: typeof body?.roadmapText === "string" ? body!.roadmapText.length : 0,
      });
      return new Response(JSON.stringify({ ok: false, reason: "invalid_payload" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Anti-abuse: only send when we can match this request to a fresh lead row.
    const leadOk = await verifyFreshLead(body.leadId, body.to);
    if (!leadOk) {
      console.warn("send-roadmap-email: lead validation failed", { leadId: body.leadId });
      return new Response(JSON.stringify({ ok: false, reason: "unauthorized" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const payload: RoadmapEmailPayload = {
      to: body.to,
      name: body.name || "Compliance Officer",
      institution: body.institution || "your institution",
      type: body.type || "",
      roadmapText: body.roadmapText,
      refNumber: body.refNumber,
    };

    const subject = `Your CBN AML Roadmap — ${payload.institution} — Ref ${payload.refNumber}`;
    const html = buildHtml(payload);

    const response = await fetch(`${RESEND_GATEWAY_URL}/emails`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "X-Connection-Api-Key": RESEND_API_KEY,
      },
      body: JSON.stringify({
        from: "ApexAML <hello@apexaml.com>>",
        to: [payload.to],
        reply_to: "hello@apexaml.com",
        subject,
        html,
      }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      console.error("send-roadmap-email: Resend error", response.status, data);
      return new Response(JSON.stringify({ ok: false, reason: "send_failed" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fire-and-forget internal admin alert — never blocks the user-facing response
    const alertSubject = `🚨 NEW ENTERPRISE LEAD: ${payload.institution}`;
    const alertHtml = buildAdminAlertHtml(payload);
    fetch(`${RESEND_GATEWAY_URL}/emails`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "X-Connection-Api-Key": RESEND_API_KEY,
      },
      body: JSON.stringify({
        from: "ApexAML System <hello@apexaml.com>",
        to: [ADMIN_ALERT_EMAIL],
        subject: alertSubject,
        html: alertHtml,
      }),
    }).catch((alertErr) => {
      console.error("send-roadmap-email: admin alert dispatch failed", alertErr);
    });

    return new Response(JSON.stringify({ ok: true, id: (data as { id?: string }).id ?? null }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("send-roadmap-email: unexpected error", err);
    return new Response(JSON.stringify({ ok: false, reason: "exception" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
