// Weekly adverse media re-screening sweep.
//
// Finds every customer whose latest adverse media screening is past its
// next_review_date and re-runs screen-adverse-media for them. Customers who
// previously had no High risk exposure and now do are reported back as
// escalations (screen-adverse-media also lifts their risk score).
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-cron-secret, lovable-context",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const MAX_PER_RUN = 25;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const cronSecret = Deno.env.get("CRON_SECRET");
  const provided = req.headers.get("x-cron-secret");
  if (!cronSecret || provided !== cronSecret) {
    return json({ error: "Unauthorized" }, 401);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });

  const today = new Date().toISOString().slice(0, 10);

  const { data: due, error } = await supabase
    .from("adverse_media_results")
    .select("customer_id, customer_name, bvn, institution_name, next_review_date, search_date")
    .lte("next_review_date", today)
    .order("search_date", { ascending: false })
    .limit(500);

  if (error) return json({ error: error.message }, 500);

  // Keep only the latest screening per customer.
  const latest = new Map<string, any>();
  for (const row of due ?? []) {
    if (!latest.has(row.customer_id)) latest.set(row.customer_id, row);
  }

  const batch = [...latest.values()].slice(0, MAX_PER_RUN);
  const escalations: string[] = [];
  let rescreened = 0;
  let failed = 0;

  for (const row of batch) {
    try {
      const res = await fetch(`${supabaseUrl}/functions/v1/screen-adverse-media`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${serviceKey}`,
          "Lovable-Context": "cron",
        },
        body: JSON.stringify({
          customer_id: row.customer_id,
          customer_name: row.customer_name,
          bvn: row.bvn,
          institution_name: row.institution_name,
          screened_by: "weekly-rescreen",
        }),
      });
      if (!res.ok) {
        failed++;
        console.warn("rescreen failed", row.customer_id, res.status);
        continue;
      }
      const body = await res.json();
      rescreened++;
      if (body?.escalated) escalations.push(row.customer_id);
    } catch (err) {
      failed++;
      console.warn("rescreen error", row.customer_id, String(err));
    }
  }

  return json({
    due: latest.size,
    rescreened,
    failed,
    escalated: escalations,
    remaining: Math.max(0, latest.size - batch.length),
  });
});
