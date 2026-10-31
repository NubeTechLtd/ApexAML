// Issues the one-time demo email confirmation code. Limits (1 per address and
// 3 per IP per rolling hour) and the 30-minute validity are enforced atomically
// by reserve_demo_confirmation; suppressed addresses are skipped without
// consuming a send.
import type { SupabaseClient } from 'npm:@supabase/supabase-js@2'
import { sendTemplateEmail } from './transactional-email-templates/send-email.ts'

export type ConfirmationSendStatus = 'sent' | 'address_limit' | 'ip_limit' | 'suppressed' | 'already_confirmed' | 'failed'
export interface ConfirmationSendResult { status: ConfirmationSendStatus; retryAfterSeconds?: number }

export async function sha256Hex(text: string) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('')
}

/** Code hashes are bound to the session so a code cannot confirm another session. */
export const confirmationCodeHash = (sessionId: string, code: string) => sha256Hex(`demo-confirm:${sessionId}:${code}`)

function sixDigitCode() {
  const buf = new Uint32Array(1)
  // Rejection sampling keeps every code equally likely.
  do { crypto.getRandomValues(buf) } while (buf[0] >= 4_294_000_000)
  return String(buf[0] % 1_000_000).padStart(6, '0')
}

export async function issueDemoConfirmation(admin: SupabaseClient, sessionId: string, email: string, ip: string): Promise<ConfirmationSendResult> {
  const address = email.toLowerCase()
  const suppressed = await admin.from('suppressed_emails').select('id').ilike('email', address).limit(1)
  if (!suppressed.error && suppressed.data?.length) return { status: 'suppressed' }

  const code = sixDigitCode()
  const reserved = await admin.rpc('reserve_demo_confirmation', {
    _session_id: sessionId, _ip_hash: await sha256Hex(`demo_confirm_ip:${ip}`), _code_hash: await confirmationCodeHash(sessionId, code),
  })
  if (reserved.error) { console.error('Confirmation reservation failed', reserved.error.code); return { status: 'failed' } }
  const r = reserved.data as { allowed: boolean; reason?: string; send_id?: string; retry_after_seconds?: number }
  if (!r.allowed) {
    if (r.reason === 'address_limit' || r.reason === 'ip_limit') return { status: r.reason, retryAfterSeconds: r.retry_after_seconds }
    return { status: r.reason === 'already_confirmed' ? 'already_confirmed' : 'failed' }
  }
  try {
    const result = await sendTemplateEmail('demo-email-confirmation', address, {
      idempotencyKey: `demo-email-confirmation-${r.send_id}`,
      templateData: { code },
    })
    const status: ConfirmationSendStatus = result.sent ? 'sent' : 'suppressed'
    await admin.from('demo_confirmation_sends').update({ status }).eq('id', r.send_id)
    return { status }
  } catch (e) {
    console.error('Confirmation email failed', e instanceof Error ? e.message : 'Unknown error')
    await admin.from('demo_confirmation_sends').update({ status: 'failed' }).eq('id', r.send_id)
    return { status: 'failed' }
  }
}
