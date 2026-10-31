// Demo email confirmation: check status, verify the six-digit code, or request a new code.
// Authenticated by the demo session token; limits are enforced in the database.
import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { z } from 'npm:zod@3.25.76'
import { trustedClientIp } from '../_shared/client-ip.ts'
import { confirmationCodeHash, issueDemoConfirmation, sha256Hex } from '../_shared/demo-email-confirmation.ts'

const Schema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('status'), sessionId: z.string().uuid() }).strict(),
  z.object({ action: z.literal('resend'), sessionId: z.string().uuid() }).strict(),
  z.object({ action: z.literal('verify'), sessionId: z.string().uuid(), code: z.string().regex(/^\d{6}$/) }).strict(),
])
const demoCors = { ...corsHeaders, 'Access-Control-Allow-Headers': `${corsHeaders['Access-Control-Allow-Headers']}, x-demo-token` }
const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers: { ...demoCors, 'Content-Type': 'application/json' } })

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: demoCors })
  if (req.method !== 'POST') return json({ reason: 'method_not_allowed' }, 405)
  const parsed = Schema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return json({ reason: 'invalid_payload' }, 400)
  const token = req.headers.get('x-demo-token')
  if (!token || token.length > 100) return json({ reason: 'invalid_session' }, 403)
  const url = Deno.env.get('SUPABASE_URL'); const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!url || !key) return json({ reason: 'configuration_error' }, 500)
  const admin = createClient(url, key, { auth: { persistSession: false } })
  const input = parsed.data

  const { data: session, error } = await admin.from('demo_sessions')
    .select('email,notification_token_hash,email_confirmed_at,confirmation_expires_at').eq('id', input.sessionId).maybeSingle()
  if (error || !session || session.notification_token_hash !== await sha256Hex(token)) return json({ reason: 'invalid_session' }, 403)

  if (input.action === 'status') {
    return json({ confirmed: Boolean(session.email_confirmed_at), expiresAt: session.confirmation_expires_at })
  }
  if (input.action === 'resend') {
    if (session.email_confirmed_at) return json({ confirmed: true, status: 'already_confirmed' })
    const result = await issueDemoConfirmation(admin, input.sessionId, session.email, trustedClientIp(req.headers))
    return json({ confirmed: false, ...result }, result.status === 'address_limit' || result.status === 'ip_limit' ? 429 : 200)
  }
  const verified = await admin.rpc('confirm_demo_email', { _session_id: input.sessionId, _code_hash: await confirmationCodeHash(input.sessionId, input.code) })
  if (verified.error) return json({ reason: 'server_error' }, 500)
  return json(verified.data)
})
