import { createClient } from 'npm:@supabase/supabase-js@2'
import { createEmailWebhookHandler } from 'npm:@lovable.dev/email-js@0.3.1'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
)

type Outcome = {
  reason: 'bounce' | 'complaint' | 'unsubscribe'
  status: 'bounced' | 'complained' | 'suppressed'
  message: string
}

// Record a terminal delivery outcome: mark the recipient in suppressed_emails
// (notification-only record — Lovable enforces suppression at send time) and
// append an email_send_log row. Throws on failure so the event is retried;
// the upsert makes redeliveries safe.
async function recordOutcome(
  event: { event_id: string; data: { recipient: string } },
  outcome: Outcome,
) {
  const recipient = event.data.recipient.toLowerCase()

  const { error: suppressError } = await supabase
    .from('suppressed_emails')
    .upsert(
      { email: recipient, reason: outcome.reason, metadata: null },
      { onConflict: 'email' },
    )
  if (suppressError) {
    console.error('suppressed_emails upsert failed', {
      code: suppressError.code,
      message: suppressError.message,
      event_id: event.event_id,
    })
    throw new Error('Failed to record suppression')
  }

  const { error: logError } = await supabase.from('email_send_log').insert({
    message_id: null,
    template_name: 'system',
    recipient_email: recipient,
    status: outcome.status,
    error_message: outcome.message,
    metadata: null,
  })
  if (logError) {
    console.error('email_send_log insert failed', {
      code: logError.code,
      message: logError.message,
      event_id: event.event_id,
    })
    throw new Error('Failed to record delivery outcome')
  }
}

const handler = createEmailWebhookHandler({
  apiKey: Deno.env.get('LOVABLE_API_KEY')!,
  on: {
    'email.bounced': async (event) => {
      await recordOutcome(event, {
        reason: 'bounce',
        status: 'bounced',
        message: 'Permanent bounce — email address is invalid or rejected',
      })
    },
    'email.complaint': async (event) => {
      await recordOutcome(event, {
        reason: 'complaint',
        status: 'complained',
        message: 'Spam complaint — recipient marked email as spam',
      })
    },
    'email.unsubscribed': async (event) => {
      await recordOutcome(event, {
        reason: 'unsubscribe',
        status: 'suppressed',
        message: 'Recipient unsubscribed',
      })
    },
  },
})

Deno.serve((req) => handler(req))
