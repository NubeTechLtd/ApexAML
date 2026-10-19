// Deliver only the roadmap requested by a fresh, matching lead.
// No promotional follow-ups, Resend fallback, or client-supplied roadmap HTML.
import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { z } from 'npm:zod@3.25.76'
import { canDeliverRoadmap } from './validation.ts'
import { sendTemplateEmail } from '../_shared/transactional-email-templates/send-email.ts'

// Record the send outcome in email_send_log (append-only audit trail).
// A log row never decides the send result — failures are only logged.
async function logSend(
  admin: ReturnType<typeof createClient>,
  recipient: string,
  status: 'sent' | 'suppressed' | 'failed',
  errorMessage?: string,
) {
  const { error } = await admin.from('email_send_log').insert({
    template_name: 'roadmap-delivery',
    recipient_email: recipient,
    status,
    error_message: errorMessage?.slice(0, 1000) ?? null,
  })
  if (error) console.error('email_send_log insert failed', { code: error.code, message: error.message })
}

const BodySchema = z.object({
  leadId: z.string().uuid(),
  to: z.string().trim().email().max(255),
  refNumber: z.string().trim().min(1).max(80),
})

function json(data: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })
  if (req.method !== 'POST') return json({ ok: false, reason: 'method_not_allowed' }, 405)
  const parsed = BodySchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return json({ ok: false, reason: 'invalid_payload' }, 400)
  const url = Deno.env.get('SUPABASE_URL')
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!url || !key) return json({ ok: false, reason: 'configuration_error' }, 500)
  const admin = createClient(url, key, { auth: { persistSession: false } })
  try {
    const { data: lead, error } = await admin.from('roadmap_leads')
      .select('id,email,created_at,roadmap_text,contact_name,institution_name')
      .eq('id', parsed.data.leadId).maybeSingle()
    if (error) throw new Error('Unable to load requested roadmap')
    if (!lead || !canDeliverRoadmap(lead, parsed.data.to)) return json({ ok: false, reason: 'unauthorized' }, 403)
    const recipient = lead.email.trim().toLowerCase()
    try {
      const result = await sendTemplateEmail('roadmap-delivery', recipient, {
        idempotencyKey: `roadmap-delivery-${lead.id}`,
        templateData: {
          name: lead.contact_name,
          institution: lead.institution_name,
          refNumber: parsed.data.refNumber,
          roadmapText: lead.roadmap_text,
        },
      })
      await logSend(admin, recipient, result.sent ? 'sent' : 'suppressed')
      if (!result.sent) return json({ ok: false, reason: 'recipient_suppressed' })
    } catch (sendError) {
      const message = sendError instanceof Error ? sendError.message : 'Unknown error'
      console.error('Roadmap send failed', { message })
      await logSend(admin, recipient, 'failed', message)
      return json({ ok: false, reason: 'send_failed' }, 502)
    }
    return json({ ok: true, queued: true })
  } catch (error) {
    console.error('Requested roadmap delivery failed', error instanceof Error ? error.message : 'Unknown error')
    return json({ ok: false, reason: 'delivery_failed' }, 500)
  }
})
