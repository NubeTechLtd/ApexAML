// Pure webhook verification helpers (no Deno APIs) so they can be unit tested.
export const MAX_WEBHOOK_AGE_SECONDS = 5 * 60;

const enc = new TextEncoder();
const toHex = (b: ArrayBuffer) => Array.from(new Uint8Array(b)).map((x) => x.toString(16).padStart(2, "0")).join("");

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length || a.length === 0) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** Timestamp is Unix seconds; reject anything older than 5 minutes or more than 5 minutes in the future. */
export function timestampFresh(header: string, nowMs = Date.now()): boolean {
  if (!/^\d{9,11}$/.test(header)) return false;
  return Math.abs(nowMs / 1000 - Number(header)) <= MAX_WEBHOOK_AGE_SECONDS;
}

/** Signature is hex HMAC-SHA256 over `${timestamp}.${rawBody}`, optionally prefixed "sha256=". */
export async function signWebhook(secret: string, timestamp: string, rawBody: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return toHex(await crypto.subtle.sign("HMAC", key, enc.encode(`${timestamp}.${rawBody}`)));
}

export async function signatureValid(secret: string, timestamp: string, rawBody: string, header: string): Promise<boolean> {
  const given = (header.startsWith("sha256=") ? header.slice(7) : header).toLowerCase();
  return safeEqual(await signWebhook(secret, timestamp, rawBody), given);
}

const b64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

/** AES-256 key = SHA-256 of the server-held master string. */
const aesKey = async (master: string, use: KeyUsage) =>
  crypto.subtle.importKey("raw", await crypto.subtle.digest("SHA-256", enc.encode(master)), "AES-GCM", false, [use]);

/** Stored secrets are base64(iv[12] || AES-256-GCM ciphertext). */
export async function decryptSecret(encrypted: string, masterKeyB64: string): Promise<string> {
  const raw = b64(encrypted);
  const key = await aesKey(masterKeyB64, "decrypt");
  const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv: raw.slice(0, 12) }, key, raw.slice(12));
  return new TextDecoder().decode(plain);
}

export async function encryptSecret(secret: string, masterKeyB64: string): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await aesKey(masterKeyB64, "encrypt");
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, enc.encode(secret)));
  const out = new Uint8Array(12 + ct.length);
  out.set(iv); out.set(ct, 12);
  return btoa(String.fromCharCode(...out));
}
