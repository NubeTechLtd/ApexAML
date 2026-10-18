// Deliver only the roadmap requested by a fresh, matching lead.
// No promotional follow-ups, Resend fallback, or client-supplied roadmap HTML.
import { createClient, FunctionsHttpError } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { z } from 'npm:zod@3.25.76'
import { canDeliverRoadmap } from './validation.ts'

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
    const { data, error: sendError } = await admin.functions.invoke('send-transactional-email', {
      headers: { Authorization: `Bearer ${key}` },
      body: {
        templateName: 'roadmap-delivery',
        recipientEmail: lead.email.trim().toLowerCase(),
        idempotencyKey: `roadmap-delivery-${lead.id}`,
        templateData: {
          name: lead.contact_name,
          institution: lead.institution_name,
          refNumber: parsed.data.refNumber,
          roadmapText: lead.roadmap_text,
        },
      },
    })
    if (sendError) {
      const details = sendError instanceof FunctionsHttpError ? await sendError.context.text() : sendError.message
      console.error('Roadmap enqueue failed', { details })
      return json({ ok: false, reason: 'enqueue_failed', details }, 502)
    }
    if (!data?.success || !data?.queued) {
      return json({ ok: false, reason: data?.reason ?? 'not_queued' })
    }
    return json({ ok: true, queued: true })
  } catch (error) {
    console.error('Requested roadmap delivery failed', error instanceof Error ? error.message : 'Unknown error')
    return json({ ok: false, reason: 'delivery_failed' }, 500)
  }
})
