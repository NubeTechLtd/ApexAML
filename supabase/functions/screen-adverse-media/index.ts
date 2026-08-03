// Adverse media screening for AML/CFT customer due diligence.
//
// Searches Nigerian news outlets for negative mentions of a customer, uses
// Lovable AI to judge whether each article is actually about that customer and
// to classify the risk level, then stores the outcome in adverse_media_results.
//
// Callable by the app (an authenticated compliance officer) and by the weekly
// re-screening cron (Lovable-Context: cron + service role key).
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, lovable-context",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

/** Negative keyword pairs used with the customer name. */
const NEGATIVE_KEYWORDS = [
  "fraud",
  "money laundering",
  "EFCC",
  "ICPC",
  "arrested",
  "convicted",
  "scam",
  "CBN sanction",
];

/** Nigerian outlets prioritised in the search and in ranking. */
const PRIORITY_SOURCES = [
  "punchng.com",
  "vanguardngr.com",
  "thisdaylive.com",
  "businessday.ng",
  "thecable.ng",
  "premiumtimesng.com",
  "saharareporters.com",
];

const SITE_FILTER = PRIORITY_SOURCES.map((s) => `site:${s}`).join(" OR ");

const RISK_ORDER = ["None", "Low", "Medium", "High"] as const;
type RiskLevel = (typeof RISK_ORDER)[number];

interface RawArticle {
  source: string;
  headline: string;
  url: string;
  published_at: string | null;
}

interface MediaResult extends RawArticle {
  relevance_score: number;
  risk_level: Exclude<RiskLevel, "None">;
  rationale: string;
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function decodeXml(value: string) {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/<[^>]+>/g, "")
    .trim();
}

function pick(block: string, tag: string) {
  const m = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i"));
  return m ? decodeXml(m[1]) : "";
}

/** Google News RSS search — no API key required, indexes Nigerian outlets. */
async function searchNews(query: string): Promise<RawArticle[]> {
  const url =
    "https://news.google.com/rss/search?q=" +
    encodeURIComponent(query) +
    "&hl=en-NG&gl=NG&ceid=NG:en";

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; ApexAML/1.0)" },
    });
    if (!res.ok) {
      console.warn("news search failed", query, res.status);
      return [];
    }
    const xml = await res.text();
    const items = xml.match(/<item>[\s\S]*?<\/item>/g) ?? [];
    return items.map((block) => {
      const pubDate = pick(block, "pubDate");
      const parsed = pubDate ? new Date(pubDate) : null;
      return {
        headline: pick(block, "title"),
        url: pick(block, "link"),
        source: pick(block, "source") || "Unknown outlet",
        published_at:
          parsed && !isNaN(parsed.getTime()) ? parsed.toISOString() : null,
      };
    }).filter((a) => a.headline && a.url);
  } catch (err) {
    console.warn("news search error", query, String(err));
    return [];
  }
}

async function classify(
  articles: RawArticle[],
  customerName: string,
  institutionName: string | null,
  apiKey: string,
): Promise<MediaResult[]> {
  const numbered = articles
    .map(
      (a, i) =>
        `${i}. [${a.source}] ${a.headline} (${a.published_at?.slice(0, 10) ?? "date unknown"})`,
    )
    .join("\n");

  const body = {
    model: "openai/gpt-5.6-sol",
    reasoning_effort: "none",
    messages: [
      {
        role: "system",
        content:
          "You are an AML adverse media analyst at a Nigerian bank. For each numbered headline decide whether it is genuinely about the named customer (beware of different people sharing a common Nigerian name) and classify the AML risk. " +
          "risk_level rules: High = criminal activity, fraud, money laundering, corruption, EFCC/ICPC prosecution, arrest, conviction or sanctions. Medium = regulatory action, CBN penalty, litigation, investigation without charge. Low = general business or neutral mentions. " +
          "relevance_score is 0-100 confidence that the article concerns this exact customer. Keep rationale under 20 words. Reply with JSON only.",
      },
      {
        role: "user",
        content:
          `Customer: ${customerName}\n` +
          (institutionName ? `Associated institution: ${institutionName}\n` : "") +
          `\nHeadlines:\n${numbered}\n\n` +
          'Reply as {"results":[{"index":0,"about_customer":true,"relevance_score":0,"risk_level":"High|Medium|Low","rationale":""}]}',
      },
    ],
    response_format: { type: "json_object" },
  };

  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": apiKey,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const detail = await res.text();
    throw Object.assign(new Error(`AI classification failed: ${detail}`), {
      status: res.status,
    });
  }

  const payload = await res.json();
  let parsed: any = {};
  try {
    parsed = JSON.parse(payload?.choices?.[0]?.message?.content ?? "{}");
  } catch {
    parsed = {};
  }

  const rows: any[] = Array.isArray(parsed?.results) ? parsed.results : [];
  const out: MediaResult[] = [];

  for (const row of rows) {
    const article = articles[Number(row?.index)];
    if (!article) continue;
    const relevance = Math.max(0, Math.min(100, Number(row?.relevance_score) || 0));
    const level = ["High", "Medium", "Low"].includes(row?.risk_level)
      ? row.risk_level
      : "Low";
    if (row?.about_customer !== true || relevance < 40) continue;
    out.push({
      ...article,
      relevance_score: relevance,
      risk_level: level,
      rationale: String(row?.rationale ?? "").slice(0, 200),
    });
  }

  return out.sort(
    (a, b) =>
      RISK_ORDER.indexOf(b.risk_level) - RISK_ORDER.indexOf(a.risk_level) ||
      b.relevance_score - a.relevance_score,
  );
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!apiKey || !supabaseUrl || !serviceKey) {
    return json({ error: "Screening service is not configured" }, 500);
  }

  let payload: any;
  try {
    payload = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const customerName = String(payload?.customer_name ?? "").trim();
  if (customerName.length < 3 || customerName.length > 120) {
    return json({ error: "customer_name must be 3-120 characters" }, 400);
  }
  const bvnRaw = String(payload?.bvn ?? "").trim();
  const bvn = /^\d{11}$/.test(bvnRaw) ? bvnRaw : null;
  const institutionName = payload?.institution_name
    ? String(payload.institution_name).trim().slice(0, 160)
    : null;
  const customerId = String(payload?.customer_id ?? bvn ?? customerName).slice(0, 120);
  const screenedBy = String(payload?.screened_by ?? "system").slice(0, 120);

  const supabase = createClient(supabaseUrl, serviceKey);

  try {
    // Previous screening outcome — used to detect newly-surfaced High risk.
    const { data: previous } = await supabase
      .from("adverse_media_results")
      .select("overall_risk_level")
      .eq("customer_id", customerId)
      .order("search_date", { ascending: false })
      .limit(1)
      .maybeSingle();

    const searches = await Promise.all(
      NEGATIVE_KEYWORDS.map((keyword) =>
        searchNews(`"${customerName}" ${keyword} (${SITE_FILTER})`),
      ),
    );

    const seen = new Set<string>();
    const articles: RawArticle[] = [];
    for (const batch of searches) {
      for (const article of batch) {
        const key = article.url.split("?")[0];
        if (seen.has(key)) continue;
        seen.add(key);
        articles.push(article);
      }
    }

    const candidates = articles.slice(0, 30);
    const results = candidates.length
      ? await classify(candidates, customerName, institutionName, apiKey)
      : [];

    const overall: RiskLevel = results.reduce<RiskLevel>((acc, r) => {
      return RISK_ORDER.indexOf(r.risk_level) > RISK_ORDER.indexOf(acc)
        ? r.risk_level
        : acc;
    }, "None");

    const reviewDays = overall === "High" ? 30 : 90;
    const nextReview = new Date(Date.now() + reviewDays * 86_400_000)
      .toISOString()
      .slice(0, 10);

    const { data: inserted, error } = await supabase
      .from("adverse_media_results")
      .insert({
        customer_id: customerId,
        customer_name: customerName,
        bvn,
        institution_name: institutionName,
        results,
        overall_risk_level: overall,
        screened_by: screenedBy,
        next_review_date: nextReview,
      })
      .select()
      .single();

    if (error) throw error;

    // Newly-surfaced High risk exposure feeds the customer's risk score.
    const escalated =
      overall === "High" && (previous?.overall_risk_level ?? "None") !== "High";
    if (escalated && bvn) {
      try {
        await supabase.functions.invoke("recalculate-risk-score", {
          body: {
            customer_id: bvn,
            trigger_type: "MANUAL_REVIEW",
            trigger_reference: `ADVERSE_MEDIA_MATCH:${inserted.id}`,
            calculated_by: "adverse-media-screening",
            signals: { customer_name: customerName },
          },
        });
      } catch (err) {
        console.warn("risk recalculation after adverse media failed", String(err));
      }
    }

    return json({
      screening: inserted,
      searched_keywords: NEGATIVE_KEYWORDS.length,
      candidates_reviewed: candidates.length,
      escalated,
    });
  } catch (err: any) {
    const status = err?.status === 429 ? 429 : err?.status === 402 ? 402 : 500;
    console.error("adverse media screening failed", String(err?.message ?? err));
    return json(
      {
        error:
          status === 429
            ? "Screening rate limit reached — try again shortly."
            : status === 402
              ? "AI credits exhausted — top up to continue screening."
              : "Adverse media screening failed.",
      },
      status,
    );
  }
});
