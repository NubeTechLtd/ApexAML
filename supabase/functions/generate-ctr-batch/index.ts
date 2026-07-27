// Daily CTR batch generator.
// Scans transaction_queue for the current WAT day, sums cash transactions per
// account, and enqueues a ctr_queue row for any customer exceeding ₦5M.
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-cron-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const CTR_THRESHOLD_NGN = 5_000_000;
const CASH_CHANNELS = ["CASH", "CASH_DEPOSIT", "CASH_WITHDRAWAL"];

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

/** Return YYYY-MM-DD for the current day in WAT (UTC+1). */
function watDate(now = new Date()): string {
  const wat = new Date(now.getTime() + 60 * 60 * 1000);
  return wat.toISOString().slice(0, 10);
}

/** WAT day boundaries expressed in UTC ISO strings. */
function watDayBoundsUTC(dateStr: string): { start: string; end: string } {
  // dateStr is a WAT calendar day; WAT = UTC+1
  const startUTC = new Date(`${dateStr}T00:00:00+01:00`);
  const endUTC = new Date(startUTC.getTime() + 24 * 60 * 60 * 1000);
  return { start: startUTC.toISOString(), end: endUTC.toISOString() };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const cronSecret = Deno.env.get("CRON_SECRET");
  const provided = req.headers.get("x-cron-secret");
  if (!cronSecret || provided !== cronSecret) {
    return json({ error: "Unauthorized" }, 401);
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const reportDate = watDate();
  const { start, end } = watDayBoundsUTC(reportDate);

  const { data: txns, error: fetchErr } = await supabase
    .from("transaction_queue")
    .select(
      "transaction_id, account_number, amount, channel, transaction_datetime, raw_payload",
    )
    .gte("transaction_datetime", start)
    .lt("transaction_datetime", end)
    .in("channel", CASH_CHANNELS);

  if (fetchErr) {
    console.error("generate-ctr-batch fetch error", fetchErr);
    return json({ error: "Failed to fetch transactions" }, 500);
  }

  // Group by account_number
  type Agg = {
    account: string;
    total: number;
    ids: string[];
    name: string | null;
  };
  const groups = new Map<string, Agg>();

  for (const tx of txns ?? []) {
    const acct = tx.account_number as string;
    const amt = Number(tx.amount) || 0;
    const payload = (tx.raw_payload ?? {}) as Record<string, unknown>;
    const name =
      (payload.customer_name as string) ||
      (payload.account_name as string) ||
      null;
    const existing = groups.get(acct);
    if (existing) {
      existing.total += amt;
      existing.ids.push(tx.transaction_id as string);
      if (!existing.name && name) existing.name = name;
    } else {
      groups.set(acct, {
        account: acct,
        total: amt,
        ids: [tx.transaction_id as string],
        name,
      });
    }
  }

  const rows = [...groups.values()]
    .filter((g) => g.total > CTR_THRESHOLD_NGN)
    .map((g) => ({
      customer_id: g.account,
      customer_name: g.name ?? `Account ${g.account}`,
      report_date: reportDate,
      total_cash_ngn: g.total,
      transaction_count: g.ids.length,
      transaction_ids: g.ids,
      status: "pending_review",
    }));

  let inserted = 0;
  if (rows.length > 0) {
    const { error: upsertErr, count } = await supabase
      .from("ctr_queue")
      .upsert(rows, {
        onConflict: "customer_id,report_date",
        ignoreDuplicates: false,
        count: "exact",
      });
    if (upsertErr) {
      console.error("generate-ctr-batch upsert error", upsertErr);
      return json({ error: "Failed to upsert CTR rows" }, 500);
    }
    inserted = count ?? rows.length;
  }

  console.log(
    `[generate-ctr-batch] date=${reportDate} scanned=${txns?.length ?? 0} flagged=${rows.length}`,
  );

  return json({
    report_date: reportDate,
    scanned: txns?.length ?? 0,
    flagged: rows.length,
    upserted: inserted,
  });
});
