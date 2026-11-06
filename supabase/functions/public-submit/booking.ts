// Walkthrough booking side effects for public-submit: slot checks, slot
// reservation and the attendee confirmation + fixed internal alert emails.
import type { SupabaseClient } from 'npm:@supabase/supabase-js@2'
import { sendTemplateEmail } from '../_shared/transactional-email-templates/send-email.ts'

export const INTERNAL_ALERT_EMAIL = 'adetokunboogun@gmail.com'
const ZOOM_LINK = 'https://zoom.us/j/0000000000?pwd=apexaml'

export function fmtSlot(iso: string) {
  const d = new Date(iso)
  const day = d.toLocaleDateString('en-GB', { weekday: 'long', timeZone: 'Africa/Lagos' })
  const date = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Africa/Lagos' })
  const time = d.toLocaleTimeString('en-GB', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'Africa/Lagos' })
  return { iso: d.toISOString(), day, date, time, label: `${day}, ${date} at ${time} WAT` }
}

/** A slot must be a real time no more than five minutes in the past. */
export function isBookableSlot(iso: string, now = Date.now()) {
  const t = new Date(iso).getTime()
  return Number.isFinite(t) && t >= now - 5 * 60_000
}

export async function isSlotTaken(admin: SupabaseClient, iso: string) {
  const { data } = await admin.from('demo_slots').select('status').eq('slot_datetime', iso).maybeSingle()
  return data?.status === 'booked'
}

async function logSend(admin: SupabaseClient, template: string, recipient: string, status: 'sent' | 'suppressed' | 'failed', message?: string) {
  const { error } = await admin.from('email_send_log').insert({
    template_name: template, recipient_email: recipient, status, error_message: message?.slice(0, 1000) ?? null,
  })
  if (error) console.error('email_send_log insert failed', error.code)
}

async function sendAndLog(admin: SupabaseClient, template: string, to: string, idempotencyKey: string, templateData: Record<string, unknown>) {
  try {
    const result = await sendTemplateEmail(template, to, { idempotencyKey, templateData })
    await logSend(admin, template, to, result.sent ? 'sent' : 'suppressed')
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    console.error(`${template} send failed`, message)
    await logSend(admin, template, to, 'failed', message)
  }
}

export interface BookingRow {
  id: string; contact_name: string; institution_name: string; institution_type: string; role: string
  email: string; whatsapp: string | null; focus_areas: string | null; slot_datetime: string
}

/** Marks the slot booked and sends both emails. Email failures never fail the booking. */
export async function completeBooking(admin: SupabaseClient, row: BookingRow) {
  await admin.from('demo_slots').upsert(
    { slot_datetime: row.slot_datetime, status: 'booked', booked_by_request_id: row.id },
    { onConflict: 'slot_datetime' },
  )
  const slot = fmtSlot(row.slot_datetime)
  const shared = {
    institutionName: row.institution_name, institutionType: row.institution_type,
    focusAreas: row.focus_areas ?? '', slotLabel: slot.label,
  }
  await Promise.all([
    sendAndLog(admin, 'demo-booking-confirmation', row.email, `demo-booking-confirmation-${row.id}`, {
      ...shared, firstName: row.contact_name.split(' ')[0], zoomLink: ZOOM_LINK,
    }),
    sendAndLog(admin, 'demo-booking-internal-alert', INTERNAL_ALERT_EMAIL, `demo-booking-internal-alert-${row.id}`, {
      ...shared, fullName: row.contact_name, role: row.role, email: row.email, whatsapp: row.whatsapp ?? '', requestId: row.id,
    }),
  ])
  return slot
}
