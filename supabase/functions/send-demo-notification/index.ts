import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { z } from 'npm:zod@3.25.76'
import * as React from 'npm:react@18.3.1'
import { renderAsync } from 'npm:@react-email/components@0.0.22'
import { sendTemplateEmail } from '../_shared/transactional-email-templates/send-email.ts'
import { TEMPLATES } from '../_shared/transactional-email-templates/registry.ts'
import { DEMO_NOTIFICATIONS, demoSubject, type DemoNotificationType } from '../_shared/demo-notification-content.ts'
const Schema = z.object({ sessionId: z.string().uuid(), eventId: z.string().uuid(), type: z.enum(Object.keys(DEMO_NOTIFICATIONS) as [DemoNotificationType, ...DemoNotificationType[]]) }).strict()
const demoCors = { ...corsHeaders, 'Access-Control-Allow-Headers': `${corsHeaders['Access-Control-Allow-Headers']}, x-demo-token` }
const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers: { ...demoCors, 'Content-Type': 'application/json' } })
Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: demoCors });
  if (req.method !== 'POST') return json({ reason: 'method_not_allowed' }, 405);
  const parsed = Schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return json({ reason: 'invalid_payload' }, 400);
  const token = req.headers.get('x-demo-token');
  if (!token || token.length > 100) return json({ reason: 'invalid_session' }, 403);
  const url = Deno.env.get('SUPABASE_URL'); const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !key) return json({ reason: 'configuration_error' }, 500);
  const admin = createClient(url, key, { auth: { persistSession: false } });
  const { sessionId, eventId, type } = parsed.data;
  const { data: session, error } = await admin.from('demo_sessions').select('email,notification_token_hash,email_confirmed_at').eq('id', sessionId).maybeSingle();
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token));
  const hash = Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2,'0')).join('');
  if (error || !session || session.notification_token_hash !== hash) return json({ reason: 'invalid_session' }, 403);
  // Unconfirmed addresses get the inbox copy only; reserve_demo_notification enforces this too.
  const unconfirmed = !session.email_confirmed_at;
  const templateName = `demo-${type.replaceAll('_','-')}`;
  const template = TEMPLATES[templateName];
  const html = await renderAsync(React.createElement(template.component, {}));
  const content = { html, subject: demoSubject(type), from: 'ApexAML <noreply@apexaml.com>' };
  if (unconfirmed) return json({ ...content, status: 'not_confirmed' });
  const reserved = await admin.rpc('reserve_demo_notification', { _session_id: sessionId, _event_id: eventId, _type: type });
  if (reserved.error) return json({ ...content, status: 'failed' }, 500);
  if (!reserved.data.allowed) return json({ ...content, status: reserved.data.status ?? reserved.data.reason }, 200);
  try {
    const result = await sendTemplateEmail(templateName, session.email, { idempotencyKey: `demo-notification-${eventId}` });
    const status = result.sent ? 'sent' : 'recipient_suppressed';
    await admin.from('demo_notification_events').update({ status }).eq('id', eventId);
    if (result.sent) {
      const { count } = await admin.from('demo_notification_events').select('id',{ count:'exact', head:true }).eq('session_id',sessionId).eq('status','sent');
      await admin.from('demo_sessions').update({ emails_sent: count ?? 0 }).eq('id',sessionId);
    }
    return json({ ...content, status });
  } catch {
    await admin.from('demo_notification_events').update({ status: 'failed' }).eq('id',eventId);
    return json({ ...content, status: 'failed' }, 200);
  }
})
