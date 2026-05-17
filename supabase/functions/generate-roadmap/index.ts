// Edge function: generate a CBN AML implementation roadmap via Lovable AI Gateway.
// No JWT required — public lead-gen tool. Validates input with Zod and falls back
// to a hardcoded roadmap if the AI call fails.
import { z } from "https://esm.sh/zod@3.23.8";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const adminDb = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });

async function persistRoadmap(leadId: string | null | undefined, text: string) {
  if (!leadId || typeof leadId !== "string") return;
  const { error } = await adminDb
    .from("roadmap_leads")
    .update({ roadmap_text: text })
    .eq("id", leadId);
  if (error) console.warn("generate-roadmap: failed to persist roadmap_text", error);
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const BodySchema = z.object({
  institutionName: z.string().min(1).max(200),
  institutionType: z.string().min(1).max(100),
  amlSetup: z.string().min(1).max(200),
  volume: z.string().min(1).max(100),
  contactName: z.string().min(1).max(150),
  title: z.string().min(1).max(150),
  email: z.string().email().max(255),
  phone: z.string().max(40).optional().nullable(),
  deadline: z.string().min(1).max(80),
  leadId: z.string().uuid().optional().nullable(),
});

type Body = z.infer<typeof BodySchema>;

function institutionTypeBlock(type: string): string {
  const t = type.toLowerCase();
  if (/dmb|deposit money/.test(t)) {
    return "This is a Deposit Money Bank. Emphasise correspondent banking due diligence, cross-border transaction monitoring, and the 18-month full compliance timeline to September 2027. Include NIBSS integration milestones.";
  }
  if (/imto/.test(t)) {
    return "This is an IMTO. Include specific milestones for: (1) the $200 USD equivalent cash-payout threshold structuring rule with cumulative 24-hour beneficiary tracking, (2) inbound-only and naira-only settlement validation, (3) the 24-hour cross-border STR mandate with overseas compliance API webhook, (4) B2B/B2P phantom payroll detection for the newly permitted business remittance channels, (5) May 2026 settlement account segregation monitoring. These are IMTO-specific CBN obligations.";
  }
  if (/mfb|microfinance/.test(t)) {
    return "This is a Microfinance Bank. Emphasise agent banking network monitoring, Tier 1/2/3 KYC upgrade workflows, and rural transaction pattern analysis.";
  }
  if (/psp|fintech|payment/.test(t)) {
    return "This is a payment service provider. Emphasise API-first integration, POS terminal network monitoring, real-time transaction velocity checks, and the 24-month compliance timeline to March 2028.";
  }
  return `This institution is regulated as a ${type}. Tailor every milestone to its licence-specific CBN obligations.`;
}

function amlSetupBlock(setup: string): string {
  const s = setup.toLowerCase();
  if (/none|no\s|nothing|absent/.test(s)) {
    return "This institution has no existing AML infrastructure — Phase 1 must include a vendor selection milestone.";
  }
  if (/manual|spreadsheet|excel/.test(s)) {
    return "Phase 1 should include migration from manual processes with a parallel-run period.";
  }
  if (/legacy|old|existing system|in-house|inhouse/.test(s)) {
    return "Include a legacy system decommission milestone in Phase 2.";
  }
  return `Current AML maturity: ${setup}. Calibrate Phase 1 deliverables accordingly.`;
}

function buildPrompt(d: Body): string {
  const typeBlock = institutionTypeBlock(d.institutionType);
  const setupBlock = amlSetupBlock(d.amlSetup);

  return `You are Nigeria's most experienced AML compliance consultant. You have advised the CBN, NFIU, and 200+ Nigerian financial institutions. Generate a formal, examination-ready CBN AML implementation roadmap. Use official CBN regulatory language throughout. Every milestone must reference a specific CBN capability area number from Circular BSD/DIR/PUB/LAB/019/002.

INSTITUTION DETAILS
- Institution Name: ${d.institutionName}
- Institution Type: ${d.institutionType}
- Current AML setup: ${d.amlSetup}
- Monthly transaction volume: ${d.volume}
- Compliance Officer: ${d.contactName}, ${d.title}
- Contact email: ${d.email}
- WhatsApp: ${d.phone || "not provided"}
- Full compliance deadline: ${d.deadline}
- CBN initial submission deadline: 10 June 2026 (Circular BSD/DIR/PUB/LAB/019/002)

INSTITUTION-TYPE GUIDANCE
${typeBlock}

CURRENT-STATE GUIDANCE
${setupBlock}

OUTPUT FORMAT
Plain text only. NO markdown, NO asterisks, NO hashes, NO bullet characters other than hyphens. Use these EXACT section headings in upper case, each on its own line:

EXECUTIVE SUMMARY
REGULATORY CONTEXT
PHASE 1 — FOUNDATION (Months 1-3)
PHASE 2 — CORE IMPLEMENTATION (Months 4-9)
PHASE 3 — ADVANCED COMPLIANCE (Months 10-18)
PHASE 4 — FULL COMPLIANCE CERTIFICATION (Months 18-24)
KEY RISKS AND MITIGATIONS
ATTESTATION

Each phase must list 4-6 concrete deliverables with target months. Every deliverable MUST cite the specific CBN capability area number it addresses (e.g. "Capability Area 3 — Sanctions Screening"). Reference CBN Circular BSD/DIR/PUB/LAB/019/002 explicitly throughout. Tailor every section to ${d.institutionName}'s specific licence type and stated AML maturity — do not produce generic content.

The ATTESTATION section MUST end with this exact attestation block, verbatim, with the placeholders replaced:

ATTESTATION — I, ${d.contactName}, ${d.title} of ${d.institutionName}, hereby certify that this roadmap represents our institution's genuine commitment to AML/CFT/CPF compliance in accordance with CBN Circular BSD/DIR/PUB/LAB/019/002. Signature: _______________ Date: _______________ CBN Licence Number: _______________

Return only the roadmap text. No preamble, no closing remarks.`;
}

function fallbackRoadmap(d: Body): string {
  const isImto = /IMTO/i.test(d.institutionType);
  const imtoBlock = isImto
    ? `
- Implement $200 USD cash-limit structuring detection across all IMTO agents (rolling 24h beneficiary window).
- Enforce inbound-only validation on Nigerian IMTO settlement accounts; block outbound transfers.
- Stand up 24-hour cross-border STR webhook to receive overseas-flag events from partner IMTOs.
- Deploy phantom payroll detection on corporate sender accounts (uniform-amount, multi-bank fan-out).
- Complete settlement account segregation per the May 2026 CBN Circular; tag designated accounts with approved correspondents.`
    : "";

  return `CBN AML IMPLEMENTATION ROADMAP
Prepared for: ${d.institutionName}
Institution type: ${d.institutionType}
Compliance Officer: ${d.contactName}, ${d.title}
Initial CBN submission deadline: 10 June 2026
Full compliance deadline: ${d.deadline}

EXECUTIVE SUMMARY
${d.institutionName} will implement a comprehensive AML/CFT control framework aligned to CBN Circular BSD/DIR/PUB/LAB/019/002 and the NFIU goAML reporting standard. The programme spans 24 months from initial submission and is sized for monthly transaction volume of ${d.volume}. Current state: ${d.amlSetup}. The roadmap closes all 10 mandated CBN capability areas and produces an examiner-ready evidence pack.

REGULATORY CONTEXT
The May 2026 CBN AML Circular requires every regulated institution to file an implementation roadmap by 10 June 2026 and to reach full compliance by ${d.deadline}. Failure to file is a regulatory infraction. ${d.institutionName} is regulated as a ${d.institutionType} and is therefore subject to the licence-specific obligations summarised below, in addition to the universal CDD/EDD, sanctions screening, transaction monitoring, STR/CTR, audit-trail, AI/ML governance, fraud monitoring, and entity-profiling controls.

PHASE 1 — FOUNDATION (Months 1-3)
- Month 1: Board-approved AML/CFT policy refresh; appointment letter for ${d.contactName}.
- Month 1: Enterprise-wide ML/TF risk assessment.
- Month 2: Tiered KYC matrix (BVN/NIN linkage) deployed across customer onboarding.
- Month 2: Sanctions screening live for UN/OFAC/EU/NFIU-domestic lists.
- Month 3: Initial gap-analysis report submitted to CBN Compliance Department.

PHASE 2 — CORE IMPLEMENTATION (Months 4-9)
- Month 4: Transaction monitoring engine cut over with Nigerian typology rule library.
- Month 5: Case management workflow with 4-eyes review and immutable audit trail.
- Month 6: STR drafting and NFIU goAML XML export pipeline operational.
- Month 7: CTR aggregation and daily reporting automation.
- Month 9: First independent internal-audit cycle against the new control set.${imtoBlock}

PHASE 3 — ADVANCED COMPLIANCE (Months 10-18)
- Month 10: AI/ML governance charter; model-risk register and explainability evidence.
- Month 12: Customer 360 entity-network profiling with PEP and adverse-media surveillance.
- Month 14: Fraud-monitoring integration with AML case routing.
- Month 16: Enhanced Due Diligence workspace operational for high-risk segments.
- Month 18: Tabletop examiner walkthrough with mock CBN/NFIU inspection.

PHASE 4 — FULL COMPLIANCE CERTIFICATION (Months 18-24)
- Month 19: External audit attestation against CBN Circular BSD/DIR/PUB/LAB/019/002.
- Month 21: Full coverage demonstrated across all 10 CBN capability areas.
- Month 22: 5-year record-retention archive validated and examiner-ready.
- Month 24: Board sign-off and submission of full compliance certification to CBN before ${d.deadline}.

KEY RISKS AND MITIGATIONS
- Data quality on legacy customer records — mitigated by a Phase 1 BVN/NIN remediation sprint.
- Rule-tuning false-positive load — mitigated by sandbox back-testing before promotion.
- Staff capacity — mitigated by quarterly AML training and a dedicated FIU liaison.
- Vendor lock-in — mitigated by storing all rules and evidence in portable formats.

ATTESTATION
This roadmap has been prepared for ${d.institutionName} and is to be filed with the CBN Compliance Department in accordance with Circular BSD/DIR/PUB/LAB/019/002.

Compliance Officer: ${d.contactName} (${d.title})    Signature: ____________________    Date: __________

Chief Risk Officer:                                   Signature: ____________________    Date: __________

Managing Director:                                    Signature: ____________________    Date: __________
`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  let body: Body;
  try {
    const json = await req.json();
    const parsed = BodySchema.safeParse(json);
    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: "Invalid input", details: parsed.error.flatten().fieldErrors }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    body = parsed.data;
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

  // Always-on fallback so the UI never sees an error.
  const fallback = fallbackRoadmap(body);

  if (!LOVABLE_API_KEY) {
    console.warn("LOVABLE_API_KEY missing — returning fallback roadmap");
    await persistRoadmap(body.leadId, fallback);
    return new Response(JSON.stringify({ roadmap: fallback, source: "fallback" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        max_tokens: 1500,
        messages: [
          {
            role: "system",
            content:
              "You are a senior Nigerian compliance consultant. Output plain text only — never markdown.",
          },
          { role: "user", content: buildPrompt(body) },
        ],
      }),
    });

    if (!aiResp.ok) {
      const errText = await aiResp.text();
      console.error("AI gateway error", aiResp.status, errText);
      await persistRoadmap(body.leadId, fallback);
      return new Response(JSON.stringify({ roadmap: fallback, source: "fallback" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await aiResp.json();
    const content: string | undefined = data?.choices?.[0]?.message?.content;
    if (!content || content.trim().length < 200) {
      await persistRoadmap(body.leadId, fallback);
      return new Response(JSON.stringify({ roadmap: fallback, source: "fallback" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const finalText = content.trim();
    await persistRoadmap(body.leadId, finalText);
    return new Response(JSON.stringify({ roadmap: finalText, source: "ai" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-roadmap unexpected error", e);
    await persistRoadmap(body.leadId, fallback);
    return new Response(JSON.stringify({ roadmap: fallback, source: "fallback" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
