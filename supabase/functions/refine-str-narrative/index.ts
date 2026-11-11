import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { z } from 'npm:zod@3';
import { authorizeCustomer } from '../_shared/tenant-access.ts';
import { STR_REFINE_SYSTEM_PROMPT } from '../_shared/str-prompts.ts';
import { DRAFT_SELECT, inputHash, promptVersion, providerOf } from '../_shared/str-provenance.ts';

const MODEL = 'openai/gpt-6-astra';

const BodySchema = z.object({
  alert_id: z.string().uuid(),
  current_draft: z.string().min(1).max(20000),
  message: z.string().min(1).max(2000),
});

const SYSTEM_PROMPT = STR_REFINE_SYSTEM_PROMPT;

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
    const { alert_id, current_draft, message } = parsed.data;

    // RLS scopes this to the caller's institution.
    const { data: alert, error: alertError } = await supabase
      .from('alerts')
      .select(`id, case_id, rule_triggered, alert_type, risk_level, status, description,
               behavioral_red_flags, customer_id,
               customers ( full_name, bvn, kyc_tier, risk_level, entity_type )`)
      .eq('id', alert_id)
      .maybeSingle();

    if (alertError) return json({ error: alertError.message }, 400);
    if (!alert) return json({ error: 'Alert not found' }, 404);

    if (!await authorizeCustomer(req, alert.customer_id, ['analyst', 'compliance_officer', 'institution_admin'])) {
      return json({ error: 'Institution role required to edit reports' }, 403);
    }

    const c = alert.customers as Record<string, unknown> | null;
    const context = `CASE CONTEXT
Case reference: ${alert.case_id}
Rule triggered: ${alert.rule_triggered}
Risk level: ${alert.risk_level}
Customer: ${c?.full_name ?? 'Unknown'} (${c?.kyc_tier ?? 'Tier 1'}, ${c?.entity_type ?? 'Individual'})
Behavioural red flags: ${((alert.behavioral_red_flags as string[] | null) ?? []).join('; ') || 'none recorded'}

CURRENT DRAFT
${current_draft}

ANALYST INSTRUCTION
${message}`;

    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableApiKey) return json({ error: 'AI is not configured' }, 500);

    // Responses API with streaming — reasoning runs can take minutes, and a
    // buffered call is severed by the platform before the model finishes.
    const aiRes = await fetch('https://ai.gateway.lovable.dev/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Lovable-API-Key': lovableApiKey,
        'X-Lovable-AIG-SDK': 'fetch',
      },
      body: JSON.stringify({
        model: MODEL,
        instructions: SYSTEM_PROMPT,
        input: context,
        stream: true,
        reasoning: { effort: 'low', summary: 'auto' },
        include: ['reasoning.encrypted_content'],
        text: {
          format: {
            type: 'json_schema',
            name: 'refined_str',
            strict: true,
            schema: {
              type: 'object',
              properties: {
                narrative: { type: 'string' },
                confirmation: { type: 'string' },
              },
              required: ['narrative', 'confirmation'],
              additionalProperties: false,
            },
          },
        },
      }),
    });

    if (!aiRes.ok) {
      const detail = await aiRes.text();
      const status = aiRes.status === 429 || aiRes.status === 402 || aiRes.status === 403 ? aiRes.status : 502;
      return json({ error: 'AI narrative refinement failed', status: aiRes.status, detail }, status);
    }

    // Consume the SSE stream server-side and accumulate the final text.
    if (!aiRes.body) return json({ error: 'AI returned no response body' }, 502);
    const reader = aiRes.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let fullText = '';
    let streamError: string | null = null;
    let servedModel: string | null = null;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const events = buffer.split('\n\n');
      buffer = events.pop() ?? '';
      for (const evt of events) {
        const dataLine = evt.split('\n').find((l) => l.startsWith('data:'));
        if (!dataLine) continue;
        const payload = dataLine.slice(5).trim();
        if (payload === '[DONE]') continue;
        try {
          const obj = JSON.parse(payload);
          if (obj.type === 'response.output_text.delta' && typeof obj.delta === 'string') {
            fullText += obj.delta;
          } else if (obj.type === 'response.completed') {
            if (typeof obj?.response?.model === 'string' && obj.response.model) servedModel = obj.response.model;
            if (!fullText) fullText = obj?.response?.output_text ?? '';
          } else if (obj.type === 'response.failed') {
            streamError = obj?.response?.error?.message ?? 'AI stream failed';
          }
        } catch {
          // Ignore non-JSON keep-alive lines.
        }
      }
    }

    if (streamError) return json({ error: streamError }, 502);

    let refined: { narrative: string; confirmation: string };
    try {
      refined = JSON.parse(fullText);
    } catch {
      return json({ error: 'AI returned malformed output' }, 502);
    }
    const narrative = (refined.narrative ?? '').trim();
    const confirmation = (refined.confirmation ?? '').trim();
    if (!narrative || !confirmation) return json({ error: 'AI returned an incomplete refinement' }, 502);

    const reported = servedModel ?? MODEL;
    const modelId = reported.includes('/') ? reported : `${providerOf(MODEL)}/${reported}`;

    const { count } = await supabase
      .from('str_drafts')
      .select('id', { count: 'exact', head: true })
      .eq('alert_id', alert.id);

    // AI rows are written with the server credential only (see generate-str-narrative).
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
        prompt_version: await promptVersion('str-refine', SYSTEM_PROMPT),
        input_hash: await inputHash(SYSTEM_PROMPT, context),
        created_by: user.id,
      })
      .select(DRAFT_SELECT)
      .single();

    if (insertError) return json({ error: insertError.message }, 400);

    return json({ draft, narrative, confirmation });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : 'Unexpected error' }, 500);
  }
});
