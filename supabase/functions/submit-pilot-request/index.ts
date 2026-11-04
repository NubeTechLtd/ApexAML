// Pilot access request from a signed-in user whose institution is not provisioned yet:
// verify the session, validate, honeypot, rate-limit, store in leads, alert the team.
import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { PILOT_SOURCE, isPilotHoneypotTripped, isPilotRateLimited, parsePilotRequest } from './validation.ts'
import { trustedClientIp } from '../_shared/client-ip.ts'
import { sendTemplateEmail } from '../_shared/transactional-email-templates/send-email.ts'

function json(data: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
}

async function sha256(text: string) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('')
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })
  if (req.method !== 'POST') return json({ ok: false, reason: 'method_not_allowed' }, 405)

  const url = Deno.env.get('SUPABASE_URL')
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!url || !key) return json({ ok: false, reason: 'configuration_error' }, 500)
  const admin = createClient(url, key, { auth: { persistSession: false } })

  // The requester must be signed in; their verified account email is used, never one from the body.
  const token = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '') ?? ''
  const { data: auth, error: authError } = token ? await admin.auth.getUser(token) : { data: { user: null }, error: null }
  const user = auth?.user
  if (authError || !user?.email) return json({ ok: false, reason: 'unauthorized' }, 401)

  const input = parsePilotRequest(await req.json().catch(() => null))
  if (!input) return json({ ok: false, reason: 'invalid_payload' }, 400)
  if (isPilotHoneypotTripped(input)) return json({ ok: true })

  const email = user.email.toLowerCase()
  const fingerprint = await sha256(`pilot:${trustedClientIp(req.headers)}`)
  const tenMin = new Date(Date.now() - 10 * 60_000).toISOString()
  const hour = new Date(Date.now() - 60 * 60_000).toISOString()
  const [acct, fp] = await Promise.all([
    admin.from('leads').select('id', { count: 'exact', head: true }).eq('source', PILOT_SOURCE).eq('email', email).gte('created_at', hour),
    admin.from('leads').select('id', { count: 'exact', head: true }).eq('client_fingerprint', fingerprint).gte('created_at', tenMin),
  ])
  if (acct.error || fp.error) return json({ ok: false, reason: 'server_error' }, 500)
  if (isPilotRateLimited({ accountHour: acct.count ?? 0, fingerprint10Min: fp.count ?? 0 })) {
    return json({ ok: false, reason: 'rate_limited' }, 429)
  }

  const id = crypto.randomUUID()
  const { error } = await admin.from('leads').insert({
    id, email, full_name: input.name, institution_name: input.institutionName,
    institution_type: input.institutionType, role: input.role, message: input.message || null,
    phone: input.phone || null, source: PILOT_SOURCE, client_fingerprint: fingerprint,
  })
  if (error) {
    console.error('Pilot request insert failed', error.code)
    return json({ ok: false, reason: 'server_error' }, 500)
  }

  try {
    await sendTemplateEmail('pilot-request-internal-alert', 'adetokunboogun@gmail.com', {
      idempotencyKey: `pilot-request-internal-alert-${id}`,
      replyTo: email,
      templateData: { name: input.name, email, institution: input.institutionName, institutionType: input.institutionType,
        role: input.role, phone: input.phone, message: input.message, leadId: id, userId: user.id },
    })
  } catch (e) {
    console.error('Pilot request alert failed', e instanceof Error ? e.message : 'Unknown error')
  }
  return json({ ok: true })
})
