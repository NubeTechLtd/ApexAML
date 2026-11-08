/**
 * HMAC-signed email tracking links.
 *
 * Every open-pixel and click link carries `sig`, an HMAC-SHA256 (base64url)
 * over a versioned canonical string of the event kind, the sequence tracking
 * token, the email step and (for clicks) the exact destination URL. The key is
 * EMAIL_TRACKING_SECRET, which only edge functions can read, so a visitor
 * cannot forge an open or click, or reuse a signature for another
 * token, step or destination.
 */

export type TrackingKind = 'open' | 'click'

export interface TrackingPayload {
  kind: TrackingKind
  token: string
  step: number
  url?: string
}

const VERSION = 'v1'
const encoder = new TextEncoder()
const keyCache = new Map<string, Promise<CryptoKey>>()

// email_sequences.tracking_token is standard base64 (may contain + / =).
export const TOKEN_PATTERN = /^[A-Za-z0-9+/=_-]{8,128}$/
export const MIN_STEP = 1
export const MAX_STEP = 5
export const MAX_URL_LENGTH = 2048

export function isValidPayload(p: TrackingPayload): boolean {
  if (p.kind !== 'open' && p.kind !== 'click') return false
  if (typeof p.token !== 'string' || !TOKEN_PATTERN.test(p.token)) return false
  if (!Number.isInteger(p.step) || p.step < MIN_STEP || p.step > MAX_STEP) return false
  if (p.kind === 'click') {
    if (typeof p.url !== 'string' || p.url.length === 0 || p.url.length > MAX_URL_LENGTH) return false
  } else if (p.url !== undefined) {
    return false
  }
  return true
}

export function canonicalMessage(p: TrackingPayload): string {
  const parts = [VERSION, p.kind, p.token, String(p.step)]
  if (p.kind === 'click') parts.push(p.url ?? '')
  return parts.join('\n')
}

function importKey(secret: string): Promise<CryptoKey> {
  let key = keyCache.get(secret)
  if (!key) {
    key = crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
    keyCache.set(secret, key)
  }
  return key
}

function toBase64Url(bytes: Uint8Array): string {
  let bin = ''
  for (const b of bytes) bin += String.fromCharCode(b)
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function assertSecret(secret: string): void {
  if (typeof secret !== 'string' || secret.length < 32) {
    throw new Error('EMAIL_TRACKING_SECRET is missing or too short')
  }
}

export async function signTracking(secret: string, p: TrackingPayload): Promise<string> {
  assertSecret(secret)
  if (!isValidPayload(p)) throw new Error('invalid tracking payload')
  const mac = await crypto.subtle.sign('HMAC', await importKey(secret), encoder.encode(canonicalMessage(p)))
  return toBase64Url(new Uint8Array(mac))
}

function timingSafeEqual(a: string, b: string): boolean {
  const ab = encoder.encode(a)
  const bb = encoder.encode(b)
  let diff = ab.length ^ bb.length
  const len = Math.max(ab.length, bb.length)
  for (let i = 0; i < len; i++) diff |= (ab[i] ?? 0) ^ (bb[i] ?? 0)
  return diff === 0
}

/** True only when `sig` is the valid signature for this exact payload. */
export async function verifyTracking(secret: string, p: TrackingPayload, sig: string | null | undefined): Promise<boolean> {
  if (!sig || sig.length > 128 || !isValidPayload(p)) return false
  const expected = await signTracking(secret, p)
  return timingSafeEqual(expected, sig)
}

/** Signed 1x1 open-pixel URL. `base` is the functions URL, e.g. `${SUPABASE_URL}/functions/v1`. */
export async function signedOpenUrl(base: string, secret: string, token: string, step: number): Promise<string> {
  const sig = await signTracking(secret, { kind: 'open', token, step })
  const q = new URLSearchParams({ t: token, s: String(step), type: 'open', sig })
  return `${base}/email-track?${q}`
}

/** Signed click-through URL that redirects to `target` after logging the click. */
export async function signedClickUrl(base: string, secret: string, token: string, step: number, target: string): Promise<string> {
  const sig = await signTracking(secret, { kind: 'click', token, step, url: target })
  const q = new URLSearchParams({ t: token, s: String(step), url: target, sig })
  return `${base}/email-track?${q}`
}
