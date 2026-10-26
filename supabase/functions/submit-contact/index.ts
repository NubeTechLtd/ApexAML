// Public contact form: validate, honeypot, rate-limit, store in leads, alert the team.
import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { ContactSchema, isHoneypotTripped, isRateLimited } from './validation.ts'
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
  const parsed = ContactSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return json({ ok: false, reason: 'invalid_payload' }, 400)
  const input = parsed.data
  // Bots get a normal-looking response but nothing is stored or sent.
  if (isHoneypotTripped(input)) return json({ ok: true })

  const url = Deno.env.get('SUPABASE_URL')
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!url || !key) return json({ ok: false, reason: 'configuration_error' }, 500)
  const admin = createClient(url, key, { auth: { persistSession: false } })

  const ip = (req.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() || 'unknown'
  const fingerprint = await sha256(`contact:${ip}`)
  const email = input.email.toLowerCase()
  const tenMin = new Date(Date.now() - 10 * 60_000).toISOString()
  const hour = new Date(Date.now() - 60 * 60_000).toISOString()
  const [fp, em] = await Promise.all([
    admin.from('leads').select('id', { count: 'exact', head: true }).eq('client_fingerprint', fingerprint).gte('created_at', tenMin),
    admin.from('leads').select('id', { count: 'exact', head: true }).eq('source', 'contact_page').eq('email', email).gte('created_at', hour),
  ])
  if (fp.error || em.error) return json({ ok: false, reason: 'server_error' }, 500)
  if (isRateLimited({ fingerprint10Min: fp.count ?? 0, emailHour: em.count ?? 0 })) {
    return json({ ok: false, reason: 'rate_limited' }, 429)
  }

  const id = crypto.randomUUID()
  const { error } = await admin.from('leads').insert({
    id, email, full_name: input.name, institution_name: input.organisation,
    institution_type: input.organisationType, role: input.role, message: input.message,
    phone: input.phone || null, source: 'contact_page', client_fingerprint: fingerprint,
  })
  if (error) {
    console.error('Contact lead insert failed', error.code)
    return json({ ok: false, reason: 'server_error' }, 500)
  }

  try {
    await sendTemplateEmail('contact-lead-internal-alert', 'adetokunboogun@gmail.com', {
      idempotencyKey: `contact-lead-internal-alert-${id}`,
      replyTo: email,
      templateData: { name: input.name, email, organisation: input.organisation, organisationType: input.organisationType,
        role: input.role, phone: input.phone ?? '', message: input.message, leadId: id },
    })
  } catch (e) {
    console.error('Contact alert failed', e instanceof Error ? e.message : 'Unknown error')
  }
  return json({ ok: true })
})
