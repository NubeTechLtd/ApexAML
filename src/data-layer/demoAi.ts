import type { Alert } from '@/data/models/alerts';
import { getDemoNotificationCredentials } from './demoStore';

/**
 * Demo-only bridge to the demo-str-narrative function. Sends the fictional
 * case and the session token; returns null on any failure so callers can fall
 * back to the pre-written sample.
 */
function casePayload(a: Alert) {
  const p = a.customerProfile;
  return {
    caseId: a.caseId, ruleTriggered: a.ruleTriggered, alertType: a.alertType, riskLevel: a.riskLevel, openedAt: a.timestamp,
    description: a.description.slice(0, 2000), redFlags: a.behavioralRedFlags.slice(0, 20).map((f) => f.slice(0, 300)),
    customer: { fullName: p.fullName, bvn: p.bvn, nin: p.nin, nuban: p.nuban, kycTier: p.kycTier, occupation: p.occupation, riskScore: p.riskScore },
    transactions: a.transactions.slice(0, 60).map((t) => ({
      date: t.date, type: t.type, amountNGN: t.amountNGN, channel: t.channel, counterparty: t.counterparty.slice(0, 200),
      balanceAfter: t.balanceAfter, ...(t.agentLocation ? { agentLocation: t.agentLocation } : {}),
    })),
  };
}

async function call(body: Record<string, unknown>): Promise<{ narrative: string; confirmation?: string } | null> {
  const credentials = getDemoNotificationCredentials();
  if (!credentials) return null;
  try {
    const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/demo-str-narrative`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY, 'x-demo-token': credentials.token },
      body: JSON.stringify({ sessionId: credentials.id, ...body }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return typeof data?.narrative === 'string' && data.narrative.trim() ? data : null;
  } catch {
    return null;
  }
}

export const demoAiGenerate = (alert: Alert) => call({ mode: 'generate', case: casePayload(alert) });
export const demoAiRefine = (alert: Alert, currentDraft: string, message: string) =>
  call({ mode: 'refine', case: casePayload(alert), currentDraft: currentDraft.slice(0, 20000), message: message.slice(0, 2000) });
