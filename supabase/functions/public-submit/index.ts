// Single entry point for every public form and public tracker.
// Order: size cap -> envelope -> form allowlist -> honeypot -> column validation
// -> per-IP rate limit (hashed IP) -> Turnstile (forms only) -> service-role insert.
import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { trustedClientIp } from '../_shared/client-ip.ts'
import { issueDemoConfirmation, sha256Hex } from '../_shared/demo-email-confirmation.ts'
import { sendTemplateEmail } from '../_shared/transactional-email-templates/send-email.ts'
import { buildRow, Envelope, getForm, isHoneypotTripped, RATE_LIMIT, readLimitedBody, type FormSpec } from './forms.ts'
import { verifyTurnstile } from './turnstile.ts'
import { completeBooking, fmtSlot, INTERNAL_ALERT_EMAIL, isBookableSlot, isSlotTaken, type BookingRow } from './booking.ts'

function json(data: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
}

async function hashIp(ip: string, secret: string) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(ip))
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, '0')).join('')
}

/** What a bot that filled the honeypot sees: a normal-looking success, nothing stored or sent. */
function honeypotResponse(form: string, data: Record<string, unknown>) {
  if (form === 'demo_entry') return json({ ok: true, sessionId: crypto.randomUUID(), confirmation: { status: 'sent' } })
  if (form === 'demo_booking') {
    const iso = typeof data.slot_datetime === 'string' && !Number.isNaN(Date.parse(data.slot_datetime)) ? data.slot_datetime : new Date().toISOString()
    return json({ ok: true, requestId: crypto.randomUUID(), slot: fmtSlot(iso) })
  }
  return json({ ok: true, id: crypto.randomUUID() })
}

async function insertRow(admin: SupabaseClient, spec: FormSpec, row: Record<string, unknown>) {
  // No .select(): the id is generated here, so nothing needs to be read back.
  const { error } = await admin.from(spec.table).insert(row)
  if (error) console.error(`public-submit insert into ${spec.table} failed`, error.code)
  return !error
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })
  if (req.method !== 'POST') return json({ ok: false, reason: 'method_not_allowed' }, 405)

  const body = await readLimitedBody(req)
  if (!body.ok) return json({ ok: false, reason: body.reason }, body.status)
  let raw: unknown
  try { raw = JSON.parse(body.text) } catch { return json({ ok: false, reason: 'invalid_payload' }, 400) }
  const envelope = Envelope.safeParse(raw)
  if (!envelope.success) return json({ ok: false, reason: 'invalid_payload' }, 400)
  const { form, data, turnstileToken, website } = envelope.data
  const spec = getForm(form)
  if (!spec) return json({ ok: false, reason: 'unknown_form' }, 400)

  if (isHoneypotTripped(website)) return honeypotResponse(form, data)

  const parsed = spec.schema.safeParse(data)
  if (!parsed.success) {
    const fields = [...new Set(parsed.error.issues.flatMap((i) =>
      i.code === 'unrecognized_keys' ? i.keys : [String(i.path[0] ?? '')]))].filter(Boolean).slice(0, 20)
    return json({ ok: false, reason: 'invalid_payload', fields }, 400)
  }
  const input = parsed.data as Record<string, unknown>

  const url = Deno.env.get('SUPABASE_URL')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  const ipSecret = Deno.env.get('IP_HASH_SECRET')
  const turnstileSecret = Deno.env.get('TURNSTILE_SECRET_KEY')
  if (!url || !serviceKey || !ipSecret || (spec.turnstile && !turnstileSecret)) {
    console.error('public-submit configuration missing')
    return json({ ok: false, reason: 'configuration_error' }, 500)
  }
  const admin = createClient(url, serviceKey, { auth: { persistSession: false } })

  const ip = trustedClientIp(req.headers)
  const ipHash = await hashIp(ip, ipSecret)
  const limit = await admin.rpc('consume_rate_limit', {
    _bucket: spec.bucket, _ip_hash: ipHash, _limit: RATE_LIMIT.limit, _window_seconds: RATE_LIMIT.windowSeconds,
  })
  if (limit.error) { console.error('rate limit check failed', limit.error.code); return json({ ok: false, reason: 'server_error' }, 500) }
  if (limit.data !== true) return json({ ok: false, reason: 'rate_limited' }, 429)

  if (spec.turnstile) {
    if (!turnstileToken) return json({ ok: false, reason: 'verification_failed' }, 403)
    const verified = await verifyTurnstile(turnstileToken, turnstileSecret!, ip, form)
    if (!verified) return json({ ok: false, reason: 'verification_failed' }, 403)
  }

  const id = crypto.randomUUID()
  const server: Record<string, unknown> = { id }
  if (spec.table === 'leads') server.client_fingerprint = ipHash
  if (spec.table === 'page_events') server.user_agent = req.headers.get('user-agent')?.slice(0, 500) ?? null

  if (form === 'demo_booking') {
    const slotIso = new Date(String(input.slot_datetime)).toISOString()
    if (!isBookableSlot(slotIso)) return json({ ok: false, reason: 'invalid_slot' }, 400)
    if (await isSlotTaken(admin, slotIso)) return json({ ok: false, reason: 'slot_taken' }, 409)
    const row = buildRow(spec, { ...input, slot_datetime: slotIso }, server)
    if (!(await insertRow(admin, spec, row))) return json({ ok: false, reason: 'server_error' }, 500)
    const slot = await completeBooking(admin, row as unknown as BookingRow)
    return json({ ok: true, requestId: id, slot })
  }

  const row = buildRow(spec, input, server)
  if (!(await insertRow(admin, spec, row))) return json({ ok: false, reason: 'server_error' }, 500)

  if (form === 'contact') {
    try {
      await sendTemplateEmail('contact-lead-internal-alert', INTERNAL_ALERT_EMAIL, {
        idempotencyKey: `contact-lead-internal-alert-${id}`,
        replyTo: String(input.email),
        templateData: {
          name: input.full_name, email: input.email, organisation: input.institution_name,
          organisationType: input.institution_type, role: input.role, phone: input.phone ?? '',
          message: input.message, leadId: id,
        },
      })
    } catch (e) {
      console.error('Contact alert failed', e instanceof Error ? e.message : 'Unknown error')
    }
  }

  if (form === 'demo_entry') {
    const email = String(input.email)
    const sessionId = crypto.randomUUID()
    const notificationToken = crypto.randomUUID()
    const session = await admin.from('demo_sessions').insert({
      id: sessionId, email, notification_token_hash: await sha256Hex(notificationToken),
    })
    if (session.error) { console.error('Demo session insert failed', session.error.code); return json({ ok: false, reason: 'server_error' }, 500) }
    // Demo notifications are emailed only after this address is confirmed with the code sent here.
    const confirmation = await issueDemoConfirmation(admin, sessionId, email, ip)
    try {
      await sendTemplateEmail('demo-entry-internal-alert', INTERNAL_ALERT_EMAIL, {
        idempotencyKey: `demo-entry-internal-alert-${sessionId}`,
        replyTo: email,
        templateData: { name: input.full_name, email, organisationType: input.institution_type, role: input.role, sessionId },
      })
    } catch (e) {
      console.error('Demo entry alert failed', e instanceof Error ? e.message : 'Unknown error')
    }
    return json({ ok: true, sessionId, notificationToken, confirmation })
  }

  return json({ ok: true, id })
})
