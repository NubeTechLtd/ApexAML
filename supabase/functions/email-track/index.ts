// Public email open/click tracking endpoint (verify_jwt = false).
// Links must be HMAC-signed with EMAIL_TRACKING_SECRET; see handler.ts.
import { createClient } from 'npm:@supabase/supabase-js@2'
import { handleTrack } from './handler.ts'

const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
  auth: { persistSession: false },
})

Deno.serve((req) =>
  handleTrack(req, {
    secret: Deno.env.get('EMAIL_TRACKING_SECRET'),
    async findSequence(token) {
      const { data, error } = await admin
        .from('email_sequences')
        .select('id, email')
        .eq('tracking_token', token)
        .maybeSingle()
      if (error) throw new Error(error.message)
      return data
    },
    async insertEvent(event) {
      // No .select(): the insert must not depend on reading the row back.
      const { error } = await admin.from('email_events').insert(event)
      if (error) throw new Error(error.message)
    },
  })
)
