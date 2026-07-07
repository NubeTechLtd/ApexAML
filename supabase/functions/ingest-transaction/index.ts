// Ingest transaction webhook from core banking.
// Validates HMAC-SHA256 signature, queues payload, returns immediately.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-webhook-signature",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

function hexToBytes(hex: string): Uint8Array {
  const clean = hex.startsWith("sha256=") ? hex.slice(7) : hex;
  if (clean.length % 2 !== 0) return new Uint8Array();
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < out.length; i++) {
    const b = parseInt(clean.substr(i * 2, 2), 16);
    if (Number.isNaN(b)) return new Uint8Array();
    out[i] = b;
  }
  return out;
}

function bytesToHex(bytes: ArrayBuffer): string {
  return Array.from(new Uint8Array(bytes))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length || a.length === 0) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

async function verifySignature(
  secret: string,
  rawBody: string,
  headerSig: string,
): Promise<boolean> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const mac = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(rawBody),
  );
  const expectedHex = bytesToHex(mac);
  return timingSafeEqual(
    new TextEncoder().encode(expectedHex),
    new TextEncoder().encode(
      headerSig.startsWith("sha256=") ? headerSig.slice(7) : headerSig,
    ),
  ) || timingSafeEqual(hexToBytes(expectedHex), hexToBytes(headerSig));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  const secret = Deno.env.get("CORE_BANKING_WEBHOOK_SECRET");
  if (!secret) {
    return json({ error: "Webhook secret not configured" }, 500);
  }

  const signature = req.headers.get("x-webhook-signature") ?? "";
  if (!signature) return json({ error: "Missing signature" }, 401);

  const rawBody = await req.text();
  const valid = await verifySignature(secret, rawBody, signature);
  if (!valid) return json({ error: "Invalid signature" }, 401);

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  const {
    transaction_id,
    account_number,
    amount,
    currency,
    channel,
    counterparty_account,
    counterparty_bank_code,
    transaction_datetime,
    narration,
    direction,
  } = payload as Record<string, unknown>;

  if (
    typeof transaction_id !== "string" ||
    typeof account_number !== "string" ||
    typeof amount !== "number" ||
    typeof currency !== "string" ||
    typeof channel !== "string" ||
    typeof transaction_datetime !== "string" ||
    (direction !== "debit" && direction !== "credit")
  ) {
    return json({ error: "Invalid payload" }, 400);
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data, error } = await supabase
    .from("transaction_queue")
    .insert({
      transaction_id,
      account_number,
      amount,
      currency,
      channel,
      counterparty_account: (counterparty_account as string) ?? null,
      counterparty_bank_code: (counterparty_bank_code as string) ?? null,
      transaction_datetime,
      narration: (narration as string) ?? null,
      direction,
      status: "pending",
      raw_payload: payload,
    })
    .select("id")
    .single();

  if (error || !data) {
    return json({ error: "Failed to queue transaction" }, 500);
  }

  // Return immediately — no downstream processing awaited.
  return json({ status: "queued", id: data.id }, 200);
});
