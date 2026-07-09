## Goal
Switch demo booking confirmation emails off Resend and onto Lovable's built-in email infrastructure. Sender domain: `notify.apexaml.com`. Visible `From`: `hello@apexaml.com` (display-from-root).

## Steps

1. **Configure sender domain** — open the email setup dialog so you can add `notify.apexaml.com` and paste the NS records at your DNS provider. Setup continues while DNS propagates.

2. **Provision email infrastructure** — create the pgmq queues, send log, suppression list, unsubscribe tokens, queue processor, and cron job.

3. **Scaffold app emails** — generate the shared `send-transactional-email` Edge Function, unsubscribe handler, suppression webhook, and template registry. Set `FROM_DOMAIN` to `apexaml.com` so recipients see `hello@apexaml.com`.

4. **Create two branded templates** in `supabase/functions/_shared/transactional-email-templates/`, styled to ApexAML slate/navy (white body per email rules):
   - `demo-booking-confirmation` — attendee-facing (booking details, meeting time, what to expect).
   - `demo-booking-internal-alert` — internal team notification with lead details.

5. **Rewire the demo booking function** — update `supabase/functions/send-demo-confirmation/index.ts` to stop calling Resend and instead invoke `send-transactional-email` twice (attendee + internal), each with an `idempotencyKey` derived from the booking id. DB insert order and trigger points unchanged.

6. **Unsubscribe page** — add a small branded route at the path the scaffold returns, so footer unsubscribe links resolve inside the app.

7. **Deploy & verify** — deploy the updated/new Edge Functions. Once DNS verifies, book a test demo and confirm both emails arrive and appear in the email send log.

## Technical notes
- Sender FQDN: `notify.apexaml.com` (NS-delegated to Lovable).
- Visible From: `hello@apexaml.com` via display-from-root.
- Resend code and `RESEND_API_KEY` become unused (left in place, no secret changes).
- No changes to `demo_bookings` schema or RLS.
- Bookings still record if a send fails; the queue retries and DLQs automatically.
