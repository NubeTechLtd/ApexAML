// Public demo entry: validate, honeypot, rate-limit, store lead + demo session, alert the team.
import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { z } from 'npm:zod@3.25.76'
import { sendTemplateEmail } from '../_shared/transactional-email-templates/send-email.ts'

const Schema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(255),
  organisationType: z.enum(['PSP', 'MFB', 'IMTO', 'Bank', 'Other']),
  role: z.string().trim().min(2).max(100),
  website: z.string().max(200).optional(),
})

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
  const parsed = Schema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return json({ ok: false, reason: 'invalid_payload' }, 400)
  const input = parsed.data
  // Bots get a normal-looking response but nothing is stored or sent.
  if (input.website && input.website.trim()) return json({ ok: true, sessionId: crypto.randomUUID() })

  const url = Deno.env.get('SUPABASE_URL')
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!url || !key) return json({ ok: false, reason: 'configuration_error' }, 500)
  const admin = createClient(url, key, { auth: { persistSession: false } })

  const ip = (req.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() || 'unknown'
  const fingerprint = await sha256(`demo_entry:${ip}`)
  const email = input.email.toLowerCase()
  const tenMin = new Date(Date.now() - 10 * 60_000).toISOString()
  const hour = new Date(Date.now() - 60 * 60_000).toISOString()
  const [fp, em] = await Promise.all([
    admin.from('leads').select('id', { count: 'exact', head: true }).eq('client_fingerprint', fingerprint).gte('created_at', tenMin),
    admin.from('demo_sessions').select('id', { count: 'exact', head: true }).eq('email', email).gte('created_at', hour),
  ])
  if (fp.error || em.error) return json({ ok: false, reason: 'server_error' }, 500)
  if ((fp.count ?? 0) >= 5 || (em.count ?? 0) >= 5) return json({ ok: false, reason: 'rate_limited' }, 429)

  const leadId = crypto.randomUUID()
  const sessionId = crypto.randomUUID()
  const lead = await admin.from('leads').insert({
    id: leadId, email, full_name: input.name, institution_type: input.organisationType,
    role: input.role, source: 'demo_entry', client_fingerprint: fingerprint,
  })
  if (lead.error) { console.error('Demo lead insert failed', lead.error.code); return json({ ok: false, reason: 'server_error' }, 500) }
  const session = await admin.from('demo_sessions').insert({ id: sessionId, email })
  if (session.error) { console.error('Demo session insert failed', session.error.code); return json({ ok: false, reason: 'server_error' }, 500) }

  try {
    const result = await sendTemplateEmail('demo-entry-internal-alert', 'adetokunboogun@gmail.com', {
      idempotencyKey: `demo-entry-internal-alert-${sessionId}`,
      replyTo: email,
      templateData: { name: input.name, email, organisationType: input.organisationType, role: input.role, sessionId },
    })
    if (result?.sent) await admin.from('demo_sessions').update({ emails_sent: 1 }).eq('id', sessionId)
  } catch (e) {
    console.error('Demo entry alert failed', e instanceof Error ? e.message : 'Unknown error')
  }
  return json({ ok: true, sessionId })
})
