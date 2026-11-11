import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { z } from 'npm:zod@3';
import { authorizeCustomer } from '../_shared/tenant-access.ts';
import { STR_GENERATE_SYSTEM_PROMPT } from '../_shared/str-prompts.ts';
import { DRAFT_SELECT, inputHash, promptVersion, providerOf } from '../_shared/str-provenance.ts';

const MODEL = 'google/gemini-3.8-flash';

const BodySchema = z.object({ alert_id: z.string().uuid() });

const SYSTEM_PROMPT = STR_GENERATE_SYSTEM_PROMPT;

function fmt(n: number) {
  return `₦${new Intl.NumberFormat('en-NG', { maximumFractionDigits: 0 }).format(n)}`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return json({ error: 'Unauthorized' }, 401);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) return json({ error: 'Unauthorized' }, 401);
    const user = userData.user;

    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return json({ error: parsed.error.flatten().fieldErrors }, 400);
    }

    // RLS scopes this to the caller's institution.
    const { data: alert, error: alertError } = await supabase
      .from('alerts')
      .select(`id, case_id, rule_triggered, alert_type, risk_level, status, description,
               behavioral_red_flags, opened_at, institution_id, customer_id,
               customers ( full_name, bvn, nin, nuban, kyc_tier, risk_level, risk_score, entity_type, account_status )`)
      .eq('id', parsed.data.alert_id)
      .maybeSingle();

    if (alertError) return json({ error: alertError.message }, 400);
    if (!alert) return json({ error: 'Alert not found' }, 404);

    if (!await authorizeCustomer(req, alert.customer_id, ['analyst', 'compliance_officer', 'institution_admin'])) {
      return json({ error: 'Institution role required to draft reports' }, 403);
    }

    const { data: txs } = await supabase
      .from('transactions')
      .select('tx_type, channel, amount_ngn, balance_after, counterparty, agent_location, occurred_at')
      .eq('customer_id', alert.customer_id)
      .order('occurred_at', { ascending: true });

    const c = alert.customers as Record<string, unknown> | null;
    const txLines = (txs ?? [])
      .map(
        (t) =>
          `- ${new Date(t.occurred_at as string).toISOString()} | ${t.tx_type} ${fmt(Number(t.amount_ngn ?? 0))} | ${t.channel} | counterparty: ${t.counterparty ?? 'unknown'}${t.agent_location ? ` | location: ${t.agent_location}` : ''} | balance after: ${fmt(Number(t.balance_after ?? 0))}`,
      )
      .join('\n');

    const prompt = `ALERT
Case reference: ${alert.case_id}
Rule triggered: ${alert.rule_triggered}
Alert type: ${alert.alert_type ?? 'STANDARD'}
Risk level: ${alert.risk_level}
Opened: ${alert.opened_at}
Description: ${alert.description ?? 'n/a'}
Behavioural red flags: ${((alert.behavioral_red_flags as string[] | null) ?? []).join('; ') || 'none recorded'}

CUSTOMER
Name: ${c?.full_name ?? 'Unknown'}
BVN: ${c?.bvn ?? 'n/a'} | NIN: ${c?.nin ?? 'n/a'} | NUBAN: ${c?.nuban ?? 'n/a'}
KYC tier: ${c?.kyc_tier ?? 'Tier 1'} | Entity type: ${c?.entity_type ?? 'Individual'}
Risk score: ${c?.risk_score ?? 0} | Account status: ${c?.account_status ?? 'Active'}

TRANSACTIONS
${txLines || 'No transactions recorded.'}

Draft the STR narrative.`;

    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableApiKey) return json({ error: 'AI is not configured' }, 500);

    const aiRes = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Lovable-API-Key': lovableApiKey,
        'X-Lovable-AIG-SDK': 'fetch',
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: prompt },
        ],
      }),
    });

    if (!aiRes.ok) {
      const detail = await aiRes.text();
      const status = aiRes.status === 429 || aiRes.status === 402 || aiRes.status === 403 ? aiRes.status : 502;
      return json({ error: 'AI narrative generation failed', status: aiRes.status, detail }, status);
    }

    const aiJson = await aiRes.json();
    const narrative: string = aiJson?.choices?.[0]?.message?.content?.trim() ?? '';
    if (!narrative) return json({ error: 'AI returned an empty narrative' }, 502);

    // The model id the gateway reports is the one that actually answered.
    const servedModel = typeof aiJson?.model === 'string' && aiJson.model ? aiJson.model : MODEL;
    const modelId = servedModel.includes('/') ? servedModel : `${providerOf(MODEL)}/${servedModel}`;

    const { count } = await supabase
      .from('str_drafts')
      .select('id', { count: 'exact', head: true })
      .eq('alert_id', alert.id);

    // AI rows are written with the server credential only, so browsers cannot
    // label their own text as AI output or forge model details.
    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const { data: draft, error: insertError } = await admin
      .from('str_drafts')
      .insert({
        alert_id: alert.id,
        version: (count ?? 0) + 1,
        narrative,
        generated_by: 'ai',
        provider: providerOf(modelId),
        model: modelId,
        prompt_version: await promptVersion('str-generate', SYSTEM_PROMPT),
        input_hash: await inputHash(SYSTEM_PROMPT, prompt),
        created_by: user.id,
      })
      .select(DRAFT_SELECT)
      .single();

    if (insertError) return json({ error: insertError.message }, 400);

    return json({ draft, narrative });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : 'Unexpected error' }, 500);
  }
});
