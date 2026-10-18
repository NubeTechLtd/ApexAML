// Paused by the owner: no enrollment, tick, or automatic sales sends.
// Original emails 2–5 are preserved in docs/archived-followups.md.
// Tables and this deployed endpoint are intentionally retained.
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'

Deno.serve((req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })
  return new Response(JSON.stringify({ ok: false, reason: 'sales_followups_disabled' }), {
    status: 410,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
