// Recalculates a customer's AML risk score using an additive model (0-100),
// records the movement in risk_score_history and updates customer_risk_scores.
//
// Called by database triggers (ctr_queue filings), by the app when an alert
// fires or is resolved, and by the nightly clean-period sweep.
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, lovable-context",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const TRIGGER_TYPES = [
  "ALERT_FIRED",
  "ALERT_DISMISSED",
  "STR_FILED",
  "KYC_UPGRADE",
  "SANCTIONS_MATCH",
  "CLEAN_PERIOD_30D",
  "MANUAL_REVIEW",
] as const;

type TriggerType = (typeof TRIGGER_TYPES)[number];

/** Base score contributed by the customer's KYC tier. */
const TIER_BASE: Record<string, number> = {
  "Tier 1": 30,
  "Tier 2": 20,
  "Tier 3": 15,
  TIER_1: 30,
  TIER_2: 20,
  TIER_3: 15,
};

interface Payload {
  customer_id: string;
  trigger_type: TriggerType;
  trigger_reference?: string | null;
  calculated_by?: string;
  /** Optional facts supplied by the caller (alert engine is app-side today). */
  signals?: {
    kyc_tier?: string;
    open_critical_alerts?: number;
    open_high_alerts?: number;
    sanctions_match_confidence?: number;
    dormant_over_6m?: boolean;
    pep_confirmed?: boolean;
    connected_entities_with_alerts?: number;
    days_since_last_alert?: number;
    days_since_last_str?: number;
    customer_name?: string;
  };
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function clamp(n: number) {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function levelFor(score: number): "High" | "Medium" | "Low" {
  if (score >= 70) return "High";
  if (score >= 40) return "Medium";
  return "Low";
}

const DAY = 24 * 60 * 60 * 1000;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  let body: Payload;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const customerId = typeof body?.customer_id === "string" ? body.customer_id.trim() : "";
  if (!customerId || customerId.length > 128) {
    return json({ error: "customer_id is required" }, 400);
  }
  const triggerType = body?.trigger_type;
  if (!TRIGGER_TYPES.includes(triggerType)) {
    return json({ error: `trigger_type must be one of ${TRIGGER_TYPES.join(", ")}` }, 400);
  }
  const triggerReference =
    typeof body?.trigger_reference === "string" ? body.trigger_reference.slice(0, 128) : null;
  const signals = body?.signals ?? {};

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );

  try {
    // ---- Current state ------------------------------------------------------
    const { data: current } = await supabase
      .from("customer_risk_scores")
      .select("risk_score, kyc_tier")
      .eq("customer_id", customerId)
      .maybeSingle();

    const kycTier = signals.kyc_tier ?? current?.kyc_tier ?? "Tier 2";
    const previousScore: number | null =
      typeof current?.risk_score === "number" ? current.risk_score : null;

    const factors: { label: string; points: number }[] = [];
    let score = TIER_BASE[kycTier] ?? 20;
    factors.push({ label: `${kycTier} base score`, points: score });

    const add = (label: string, points: number) => {
      if (points === 0) return;
      score += points;
      factors.push({ label, points });
    };

    // ---- Risk factors ------------------------------------------------------
    if ((signals.open_critical_alerts ?? 0) > 0) add("Open Critical alert", 20);
    if ((signals.open_high_alerts ?? 0) > 0) add("Open High alert", 15);

    // STRs/CTRs filed in the last 90 days: +10 each, capped at +30.
    const since90 = new Date(Date.now() - 90 * DAY).toISOString();
    const { count: recentFilings } = await supabase
      .from("ctr_queue")
      .select("id", { count: "exact", head: true })
      .eq("customer_id", customerId)
      .eq("status", "filed")
      .gte("filed_at", since90);
    const filings = recentFilings ?? 0;
    add(`${filings} report(s) filed in last 90 days`, Math.min(filings * 10, 30));

    // Sanctions screening — fuzzy match on the customer name.
    let sanctionsConfidence = signals.sanctions_match_confidence ?? 0;
    if (!sanctionsConfidence && signals.customer_name) {
      const { data: matches } = await supabase.rpc("screen_entity", {
        search_name: signals.customer_name,
        threshold: 0.7,
      });
      const top = Array.isArray(matches) && matches.length > 0 ? Number(matches[0].score) : 0;
      sanctionsConfidence = Number.isFinite(top) ? top * 100 : 0;
    }
    if (sanctionsConfidence > 70) add("Sanctions match above 70% confidence", 15);

    if (signals.dormant_over_6m) add("Dormant over 6 months before current activity", 10);
    if (signals.pep_confirmed) add("PEP status confirmed", 10);

    const linkedWithAlerts = Math.max(0, signals.connected_entities_with_alerts ?? 0);
    add(`${linkedWithAlerts} connected entity(ies) with open alerts`, linkedWithAlerts * 5);

    // ---- Clean signals -----------------------------------------------------
    const daysSinceLastAlert = signals.days_since_last_alert ?? 0;
    const cleanBlocks = Math.floor(daysSinceLastAlert / 30);
    if (cleanBlocks > 0) {
      add(`${cleanBlocks * 30} consecutive days with no alerts`, -5 * cleanBlocks);
    }

    let daysSinceLastStr = signals.days_since_last_str;
    if (daysSinceLastStr === undefined) {
      const { data: lastFiling } = await supabase
        .from("ctr_queue")
        .select("filed_at")
        .eq("customer_id", customerId)
        .eq("status", "filed")
        .order("filed_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      daysSinceLastStr = lastFiling?.filed_at
        ? Math.floor((Date.now() - new Date(lastFiling.filed_at).getTime()) / DAY)
        : Infinity;
    }
    if (daysSinceLastStr > 180) add("No report filed in over 180 days", -10);

    // All required KYC documents current and verified.
    const { data: docs } = await supabase
      .from("kyc_documents")
      .select("verified, is_current")
      .eq("customer_id", customerId);
    if (docs && docs.length > 0 && docs.every((d) => d.verified && d.is_current)) {
      add("All KYC documents current and verified", -5);
    }

    const newScore = clamp(score);
    const scoreChange = previousScore === null ? null : newScore - previousScore;

    // ---- Persist -----------------------------------------------------------
    const { error: histError } = await supabase.from("risk_score_history").insert({
      customer_id: customerId,
      previous_score: previousScore,
      new_score: newScore,
      score_change: scoreChange,
      trigger_type: triggerType,
      trigger_reference: triggerReference,
      calculated_by: body.calculated_by?.slice(0, 64) ?? "SYSTEM",
      factors,
    });
    if (histError) throw histError;

    const { error: upsertError } = await supabase.from("customer_risk_scores").upsert(
      {
        customer_id: customerId,
        risk_score: newScore,
        risk_level: levelFor(newScore),
        kyc_tier: kycTier,
        last_calculated_at: new Date().toISOString(),
      },
      { onConflict: "customer_id" },
    );
    if (upsertError) throw upsertError;

    return json({
      customer_id: customerId,
      previous_score: previousScore,
      new_score: newScore,
      score_change: scoreChange,
      risk_level: levelFor(newScore),
      trigger_type: triggerType,
      factors,
    });
  } catch (err) {
    console.error("recalculate-risk-score failed", err);
    return json({ error: "Risk recalculation failed" }, 500);
  }
});
