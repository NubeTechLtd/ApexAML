// Open + click tracking. Public endpoint (verify_jwt = false).
//   GET /email-track?t=<token>&s=<step>&type=open  -> log open, return 1x1 GIF
//   GET /email-track?t=<token>&s=<step>&url=<dest> -> log click, 302 to <dest>
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = { "Access-Control-Allow-Origin": "*" };
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const admin = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });

// 1×1 transparent GIF
const TRANSPARENT_GIF = Uint8Array.from([
  0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00, 0x01, 0x00, 0x80, 0x00,
  0x00, 0xff, 0xff, 0xff, 0x00, 0x00, 0x00, 0x21, 0xf9, 0x04, 0x01, 0x00,
  0x00, 0x00, 0x00, 0x2c, 0x00, 0x00, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00,
  0x00, 0x02, 0x02, 0x44, 0x01, 0x00, 0x3b,
]);

function gifResponse() {
  return new Response(TRANSPARENT_GIF, {
    status: 200,
    headers: {
      "Content-Type": "image/gif",
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      "Pragma": "no-cache",
      ...corsHeaders,
    },
  });
}

function isSafeUrl(u: string): boolean {
  try {
    const parsed = new URL(u);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch { return false; }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const url = new URL(req.url);
  const token = url.searchParams.get("t");
  const stepRaw = url.searchParams.get("s");
  const type = url.searchParams.get("type"); // 'open' | undefined
  const dest = url.searchParams.get("url");
  const step = stepRaw ? Number(stepRaw) : null;

  if (!token) return gifResponse();

  // Look up the sequence row by tracking token (no PII leaked back to caller).
  const { data: seq } = await admin
    .from("email_sequences")
    .select("id, email")
    .eq("tracking_token", token)
    .maybeSingle();

  const eventBase = {
    sequence_id: seq?.id ?? null,
    email: seq?.email ?? null,
    email_step: step && step >= 1 && step <= 5 ? step : null,
    user_agent: req.headers.get("user-agent"),
    ip: req.headers.get("x-forwarded-for") ?? req.headers.get("cf-connecting-ip"),
  };

  // Click flow
  if (dest && isSafeUrl(dest)) {
    await admin.from("email_events").insert({
      ...eventBase, event_type: "click", url: dest,
    });
    return new Response(null, {
      status: 302,
      headers: { Location: dest, "Cache-Control": "no-store", ...corsHeaders },
    });
  }

  // Open flow (default)
  if (type === "open" || !dest) {
    await admin.from("email_events").insert({
      ...eventBase, event_type: "open",
    });
  }
  return gifResponse();
});
