// Open + click tracking handler. Every request must carry a valid HMAC `sig`
// (see _shared/email-tracking.ts); missing or invalid signatures are rejected
// before any lookup or write.
//   GET /email-track?t=<token>&s=<step>&type=open&sig=<hmac>  -> log open, 1x1 GIF
//   GET /email-track?t=<token>&s=<step>&url=<dest>&sig=<hmac> -> log click, 302 to <dest>
import { type TrackingPayload, verifyTracking } from '../_shared/email-tracking.ts'
import { trustedClientIp } from '../_shared/client-ip.ts'

export interface TrackEvent {
  sequence_id: string
  email: string
  email_step: number
  event_type: 'open' | 'click'
  url: string | null
  user_agent: string | null
  ip: string | null
}

export interface TrackDeps {
  secret: string | undefined
  findSequence(token: string): Promise<{ id: string; email: string } | null>
  insertEvent(event: TrackEvent): Promise<void>
}

const TRANSPARENT_GIF = Uint8Array.from([
  0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00, 0x01, 0x00, 0x80, 0x00,
  0x00, 0xff, 0xff, 0xff, 0x00, 0x00, 0x00, 0x21, 0xf9, 0x04, 0x01, 0x00,
  0x00, 0x00, 0x00, 0x2c, 0x00, 0x00, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00,
  0x00, 0x02, 0x02, 0x44, 0x01, 0x00, 0x3b,
])

const NO_STORE = { 'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0' }

function gif(): Response {
  return new Response(TRANSPARENT_GIF, { status: 200, headers: { 'Content-Type': 'image/gif', Pragma: 'no-cache', ...NO_STORE } })
}

function reject(status: number, reason: string): Response {
  return new Response(JSON.stringify({ ok: false, reason }), {
    status,
    headers: { 'Content-Type': 'application/json', ...NO_STORE },
  })
}

const ALLOWED_REDIRECT_HOSTS = new Set(['apexaml.com', 'www.apexaml.com', 'apexaml.lovable.app'])

export function isSafeRedirect(u: string): boolean {
  try {
    const parsed = new URL(u)
    if (parsed.protocol !== 'https:') return false
    if (parsed.username || parsed.password) return false
    return ALLOWED_REDIRECT_HOSTS.has(parsed.hostname.toLowerCase())
  } catch {
    return false
  }
}

/** Parses the query into a payload, or null when it is not a well-formed open/click request. */
export function parsePayload(params: URLSearchParams): TrackingPayload | null {
  const token = params.get('t')
  const stepRaw = params.get('s')
  const dest = params.get('url')
  const type = params.get('type')
  if (!token || !stepRaw || !/^\d$/.test(stepRaw)) return null
  const step = Number(stepRaw)
  if (dest !== null) {
    if (type !== null) return null
    return { kind: 'click', token, step, url: dest }
  }
  if (type === 'open') return { kind: 'open', token, step }
  return null
}

export async function handleTrack(req: Request, deps: TrackDeps): Promise<Response> {
  if (req.method !== 'GET' && req.method !== 'HEAD') return reject(405, 'method_not_allowed')

  // Fail closed: without the signing key nothing can be verified, so nothing is written.
  if (!deps.secret || deps.secret.length < 32) {
    console.error('email-track: EMAIL_TRACKING_SECRET is not configured')
    return reject(503, 'tracking_unavailable')
  }

  const params = new URL(req.url).searchParams
  const payload = parsePayload(params)
  if (!payload) return reject(400, 'invalid_request')

  const sig = params.get('sig')
  if (!sig) return reject(403, 'missing_signature')
  if (!(await verifyTracking(deps.secret, payload, sig))) return reject(403, 'invalid_signature')

  if (payload.kind === 'click' && !isSafeRedirect(payload.url!)) return reject(400, 'unsafe_destination')

  const seq = await deps.findSequence(payload.token)
  if (!seq) return reject(404, 'unknown_token')

  if (req.method === 'GET') {
    const ip = trustedClientIp(req.headers)
    try {
      await deps.insertEvent({
        sequence_id: seq.id,
        email: seq.email,
        email_step: payload.step,
        event_type: payload.kind,
        url: payload.kind === 'click' ? payload.url! : null,
        user_agent: req.headers.get('user-agent')?.slice(0, 512) ?? null,
        ip: ip === 'unknown' ? null : ip,
      })
    } catch (err) {
      // A logging failure must not break the reader's click or image load.
      console.error('email-track: event insert failed', err instanceof Error ? err.message : err)
    }
  }

  if (payload.kind === 'click') {
    return new Response(null, { status: 302, headers: { Location: payload.url!, ...NO_STORE } })
  }
  return gif()
}
