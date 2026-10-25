// Ingest transaction webhook from core banking.
// Per-institution keys (x-institution-key), signed timestamp + "." + body (HMAC-SHA256),
// 5-minute freshness window, idempotent on event_id. Institution always comes from the key.
import { createClient } from "npm:@supabase/supabase-js@2";
import { decryptSecret, signatureValid, timestampFresh } from "./verify.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-webhook-signature, x-webhook-timestamp, x-institution-key",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const keyId = (req.headers.get("x-institution-key") ?? "").slice(0, 128) || null;
  let institutionId: string | null = null;
  let eventId: string | null = null;

  const reject = async (reason: string, status: number, message: string) => {
    const { error } = await supabase.from("webhook_rejections").insert({
      key_id: keyId,
      institution_id: institutionId,
      event_id: eventId,
      reason,
      ip_address: (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || null,
      user_agent: (req.headers.get("user-agent") ?? "").slice(0, 500) || null,
    });
    if (error) console.error("rejection log failed", reason, error.message);
    console.warn("ingest-transaction rejected", { reason, keyId });
    return json({ error: message }, status);
  };

  if (req.method !== "POST") return reject("method_not_allowed", 405, "Method not allowed");

  const masterKey = Deno.env.get("WEBHOOK_SECRETS_KEY");
  if (!masterKey) return reject("server_misconfigured", 500, "Webhook verification unavailable");

  const timestamp = req.headers.get("x-webhook-timestamp") ?? "";
  const signature = req.headers.get("x-webhook-signature") ?? "";
  if (!keyId) return reject("missing_key", 401, "Missing x-institution-key");
  if (!timestamp) return reject("missing_timestamp", 401, "Missing x-webhook-timestamp");
  if (!signature) return reject("missing_signature", 401, "Missing signature");
  if (!timestampFresh(timestamp)) return reject("stale_or_invalid_timestamp", 401, "Timestamp outside the 5-minute window");

  const { data: keyRow } = await supabase
    .from("institution_webhook_secrets")
    .select("institution_id, encrypted_secret, institutions!inner(institution_type)")
    .eq("key_id", keyId).eq("active", true).maybeSingle();
  if (!keyRow || (keyRow as any).institutions?.institution_type === "platform_control") {
    return reject("unknown_or_inactive_key", 401, "Invalid signature");
  }

  let secret: string;
  try { secret = await decryptSecret(keyRow.encrypted_secret, masterKey); }
  catch { return reject("secret_decrypt_failed", 500, "Webhook verification unavailable"); }

  const rawBody = await req.text();
  if (rawBody.length > 256_000) return reject("payload_too_large", 413, "Payload too large");
  if (!(await signatureValid(secret, timestamp, rawBody, signature))) return reject("invalid_signature", 401, "Invalid signature");
  institutionId = keyRow.institution_id; // authenticated: only now attribute the request

  let payload: Record<string, unknown>;
  try { payload = JSON.parse(rawBody); } catch { return reject("invalid_json", 400, "Invalid JSON"); }
  if (typeof payload.event_id === "string") eventId = payload.event_id.slice(0, 200);

  const p = payload;
  const optStr = (v: unknown) => v === undefined || v === null || typeof v === "string";
  if (
    typeof p.event_id !== "string" || !/^[A-Za-z0-9_.:-]{1,200}$/.test(p.event_id) ||
    typeof p.transaction_id !== "string" || typeof p.account_number !== "string" ||
    typeof p.amount !== "number" || !Number.isFinite(p.amount) ||
    typeof p.currency !== "string" || typeof p.channel !== "string" ||
    typeof p.transaction_datetime !== "string" || Number.isNaN(Date.parse(p.transaction_datetime)) ||
    (p.direction !== "debit" && p.direction !== "credit") ||
    !optStr(p.counterparty_account) || !optStr(p.counterparty_bank_code) || !optStr(p.narration)
  ) return reject("invalid_payload", 400, "Invalid payload");

  // Any institution_id in the payload is ignored; the key decides.
  const { institution_id: _ignored, ...tx } = p;
  const { data, error } = await supabase.rpc("record_webhook_transaction", {
    _institution_id: institutionId, _key_id: keyId, _event_id: p.event_id, _tx: tx,
  });
  if (error || !data) return reject("queue_failed", 500, "Failed to queue transaction");

  const result = data as { status: string; id: string | null };
  return json(result, 200);
});
