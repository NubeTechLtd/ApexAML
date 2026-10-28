import { useSyncExternalStore } from 'react';
import { DEMO_NOTIFICATIONS, demoSubject, type DemoNotificationType } from '../../supabase/functions/_shared/demo-notification-content';
import { onCollectionChange, readCollection, writeCollection } from './demoStore';
export { DEMO_NOTIFICATIONS };
export type { DemoNotificationType };
export interface DemoEmail { id: string; type: DemoNotificationType; subject: string; body: string; createdAt: string; read: boolean; status: string; html?: string; from?: string }
const KEY = 'demo_notifications';
export const readDemoEmails = () => readCollection<DemoEmail[]>(KEY, () => []);
export const subscribeDemoEmails = (fn: () => void) => onCollectionChange(KEY, fn);
export function useDemoEmails() { return useSyncExternalStore(subscribeDemoEmails, readDemoEmails, readDemoEmails); }
export function updateDemoEmail(id: string, patch: Partial<DemoEmail>) { writeCollection(KEY, readDemoEmails().map(e => e.id === id ? { ...e, ...patch } : e)); }
export function markDemoEmailsRead(id?: string) { writeCollection(KEY, readDemoEmails().map(e => !id || e.id === id ? { ...e, read: true } : e)); }
export function emitDemoNotification(type: DemoNotificationType) {
  const content = DEMO_NOTIFICATIONS[type];
  const email: DemoEmail = { id: crypto.randomUUID(), type, subject: demoSubject(type), body: content.body, createdAt: new Date().toISOString(), read: false, status: 'pending' };
  writeCollection(KEY, [email, ...readDemoEmails()]);
}
export function emitDailyBriefing() {
  const day = new Date().toISOString().slice(0,10);
  if (!readDemoEmails().some(e => e.type === 'daily_briefing' && e.createdAt.startsWith(day))) emitDemoNotification('daily_briefing');
}
export function notifyDemoAudit(action: string, justification: string) {
  const type = action === 'NFIU_ESCALATION' ? (justification.startsWith('Case reassigned to ') ? 'alert_assigned' : 'alert_escalated')
    : ({ STR_FILED: 'str_submitted', STR_EXPORT: 'str_exported', CTR_FILED: 'ctr_filed', ACCOUNT_FREEZE: 'account_frozen' } as const)[action as 'STR_FILED'];
  if (type) emitDemoNotification(type);
}
