import type { Alert } from '@/data/models/alerts';
import { getDemoNotificationCredentials } from './demoStore';

// Demo-only bridge to the demo-str-narrative function. Sends only the case id
// (the server loads the fictional case from its own copy of the demo seed),
// plus the current draft and instruction when refining, and the session token.
// Returns a non-ok result on any failure so callers can fall back to the
// pre-written sample.

/** Abort the request after this long so the demo falls back instead of stalling. */
export const DEMO_AI_TIMEOUT_MS = 25_000;

/** Reservation reasons: per-session/per-IP caps vs. the global daily cap or kill switch. */
const SESSION_LIMIT_REASONS = new Set(['session_limit', 'ip_daily_limit']);
const CAPACITY_REASONS = new Set(['global_daily_limit', 'demo_ai_disabled']);

export type DemoAiLimit = false | 'session' | 'capacity';

export type DemoAiResult =
  | { ok: true; narrative: string; confirmation?: string }
  | { ok: false; limited: DemoAiLimit };

async function call(body: Record<string, unknown>): Promise<DemoAiResult> {
  const credentials = getDemoNotificationCredentials();
  if (!credentials) return { ok: false, limited: false };
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), DEMO_AI_TIMEOUT_MS);
  try {
    const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/demo-str-narrative`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY, 'x-demo-token': credentials.token },
      body: JSON.stringify({ sessionId: credentials.id, ...body }),
      signal: controller.signal,
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      if (res.status !== 429) return { ok: false, limited: false };
      return { ok: false, limited: SESSION_LIMIT_REASONS.has(data?.reason) ? 'session' : CAPACITY_REASONS.has(data?.reason) ? 'capacity' : false };
    }
    return typeof data?.narrative === 'string' && data.narrative.trim()
      ? { ok: true, narrative: data.narrative, confirmation: data.confirmation }
      : { ok: false, limited: false };
  } catch {
    return { ok: false, limited: false };
  } finally {
    clearTimeout(timer);
  }
}

export const demoAiGenerate = (alert: Alert) => call({ mode: 'generate', caseId: alert.caseId });
export const demoAiRefine = (alert: Alert, currentDraft: string, message: string) =>
  call({ mode: 'refine', caseId: alert.caseId, currentDraft: currentDraft.slice(0, 20000), message: message.slice(0, 2000) });
