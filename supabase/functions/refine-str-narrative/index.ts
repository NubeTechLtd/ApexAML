import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { z } from 'npm:zod@3';

const BodySchema = z.object({
  alert_id: z.string().uuid(),
  current_draft: z.string().min(1).max(20000),
  message: z.string().min(1).max(2000),
});

const SYSTEM_PROMPT = `You are an AI co-pilot assisting a Nigerian AML compliance analyst refining a Suspicious Transaction Report (STR) narrative for filing with the NFIU under the Money Laundering (Prevention and Prohibition) Act and CBN AML/CFT Regulations.

You receive the current narrative draft and the analyst's instruction. You must return a JSON object with exactly two fields:
- "narrative": the FULL revised narrative (complete replacement text, not a diff), in the same regulatory register: single dense paragraph, third person, naira figures with ₦, exact WAT timing windows, channels, counterparties and Lagos/Nigerian locations where present in the data. Apply the analyst's instruction faithfully. If the instruction is a question rather than an edit request, keep the narrative unchanged.
- "confirmation": a short (1-2 sentence) plain-English confirmation to the analyst describing what changed, starting with a ✅. If the instruction was a question, answer it here instead.

Return only the JSON object.`;

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
        model: 'openai/gpt-6-astra',
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
    const reader = aiRes.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let fullText = '';
    let streamError: string | null = null;

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
          } else if (obj.type === 'response.completed' && !fullText) {
            fullText = obj?.response?.output_text ?? '';
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

    const { count } = await supabase
      .from('str_drafts')
      .select('id', { count: 'exact', head: true })
      .eq('alert_id', alert.id);

    const { data: draft, error: insertError } = await supabase
      .from('str_drafts')
      .insert({
        alert_id: alert.id,
        version: (count ?? 0) + 1,
        narrative,
        generated_by: 'claude_api',
        created_by: user.id,
      })
      .select('id, alert_id, version, narrative, generated_by, created_at')
      .single();

    if (insertError) return json({ error: insertError.message }, 400);

    return json({ draft, narrative, confirmation });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : 'Unexpected error' }, 500);
  }
});
