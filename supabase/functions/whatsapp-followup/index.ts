// DISABLED: the SMS/WhatsApp follow-up feature has been removed.
// This function rejects every request. The whatsapp_sequences table is kept but unused.
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

Deno.serve((req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  return new Response(JSON.stringify({ error: "This feature has been removed." }), {
    status: 410,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
