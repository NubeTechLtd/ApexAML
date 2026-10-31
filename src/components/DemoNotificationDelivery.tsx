import { useEffect } from 'react';
import { emitDailyBriefing, readDemoEmails, subscribeDemoEmails, updateDemoEmail } from '@/data-layer/demoNotifications';
import { getDemoNotificationCredentials } from '@/data-layer/demoStore';
import { canEmailDemoNotifications, refreshDemoConfirmationStatus } from '@/data-layer/demoEmailConfirmation';

/** The only operational demo network request: fixed, session-addressed sample emails. */
export function DemoNotificationDelivery() {
  useEffect(() => {
    let stopped = false;
    const inFlight = new Set<string>();
    const deliver = () => {
      const credentials = getDemoNotificationCredentials();
      for (const email of readDemoEmails().filter(e => e.status === 'pending')) {
        if (inFlight.has(email.id)) continue;
        // Until the address is confirmed, notifications stay in the Demo Inbox only.
        if (!credentials) { updateDemoEmail(email.id, { status: 'inbox_only' }); continue; }
        if (!canEmailDemoNotifications()) { updateDemoEmail(email.id, { status: 'not_confirmed' }); continue; }
        inFlight.add(email.id);
        void fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-demo-notification`, {
          method: 'POST', headers: { 'Content-Type': 'application/json', apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY, 'x-demo-token': credentials.token },
          body: JSON.stringify({ sessionId: credentials.id, eventId: email.id, type: email.type }),
        }).then(async response => {
          const data = await response.json();
          if (!stopped) updateDemoEmail(email.id, { status: data.status ?? data.reason ?? 'failed', html: data.html, from: data.from });
        }).catch(() => { if (!stopped) updateDemoEmail(email.id, { status: 'failed' }); });
      }
    };
    const unsubscribe = subscribeDemoEmails(deliver);
    void refreshDemoConfirmationStatus();
    emitDailyBriefing(); deliver();
    const timer = window.setInterval(emitDailyBriefing, 60_000);
    return () => { stopped = true; unsubscribe(); window.clearInterval(timer); };
  }, []);
  return null;
}
