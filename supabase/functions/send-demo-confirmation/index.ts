// Book a demo: validate, persist the demo_request, mark the slot as booked,
// and dispatch both an attendee confirmation email and an internal alert.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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

    // Enqueue both emails via the shared transactional email pipeline.
    // Failures here don't fail the booking — the queue retries and DLQs.
    try {
      const invokeSend = (templateName: string, recipientEmail: string, templateData: Record<string, unknown>) =>
        admin.functions.invoke("send-transactional-email", {
          headers: { Authorization: `Bearer ${SERVICE_ROLE}` },
          body: {
            templateName,
            recipientEmail,
            idempotencyKey: `${templateName}-${insertReq.id}`,
            templateData,
          },
        });

      const firstName = payload.fullName.split(" ")[0];
      const shared = {
        institutionName: payload.institutionName,
        institutionType: payload.institutionType,
        focusAreas: payload.focusAreas || "",
        slotLabel: slot.label,
      };

      await Promise.all([
        invokeSend("demo-booking-confirmation", payload.email, {
          ...shared,
          firstName,
          zoomLink: ZOOM_LINK,
        }).catch((e) => console.error("attendee email enqueue failed", e)),
        invokeSend("demo-booking-internal-alert", INTERNAL_ALERT_EMAIL, {
          ...shared,
          fullName: payload.fullName,
          role: payload.role,
          email: payload.email,
          whatsapp: payload.whatsapp || "",
          requestId: insertReq.id,
        }).catch((e) => console.error("internal email enqueue failed", e)),
      ]);
    } catch (e) {
      console.error("send-demo-confirmation: email dispatch failed", e);
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
