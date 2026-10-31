import { useSyncExternalStore } from 'react';
import { getDemoNotificationCredentials } from './demoStore';

/**
 * Demo email confirmation state. The server is the authority (send-demo-notification
 * refuses unconfirmed sessions); this local copy only decides whether to try emailing
 * and what to show. Kept outside the demo prefix so "Reset demo" keeps it.
 */
export type ConfirmationSendStatus = 'sent' | 'address_limit' | 'ip_limit' | 'suppressed' | 'already_confirmed' | 'failed';
export interface DemoEmailConfirmationState {
  sessionId: string;
  email: string;
  confirmed: boolean;
  lastSend?: { status: ConfirmationSendStatus; at: string; retryAfterSeconds?: number };
}

const KEY = 'apexaml-demo-email-confirmation';
const listeners = new Set<() => void>();
let cached: { raw: string | null; value: DemoEmailConfirmationState | null } = { raw: null, value: null };

function storage(): Storage | null {
  try { return typeof window !== 'undefined' ? window.localStorage : null; } catch { return null; }
}

export function getDemoEmailConfirmation(): DemoEmailConfirmationState | null {
  const raw = storage()?.getItem(KEY) ?? null;
  if (raw !== cached.raw) {
    let value: DemoEmailConfirmationState | null = null;
    try { value = raw ? JSON.parse(raw) : null; } catch { value = null; }
    cached = { raw, value };
  }
  const credentials = getDemoNotificationCredentials();
  return cached.value && credentials && cached.value.sessionId === credentials.id ? cached.value : null;
}

export function saveDemoEmailConfirmation(state: DemoEmailConfirmationState) {
  try { storage()?.setItem(KEY, JSON.stringify(state)); } catch { /* storage blocked */ }
  listeners.forEach((fn) => fn());
}

function patch(update: Partial<DemoEmailConfirmationState>) {
  const current = getDemoEmailConfirmation();
  const credentials = getDemoNotificationCredentials();
  if (!credentials) return;
  saveDemoEmailConfirmation({ sessionId: credentials.id, email: current?.email ?? '', confirmed: false, ...current, ...update });
}

/** Demo notifications are emailed only once this session's address is confirmed. */
export const canEmailDemoNotifications = () => Boolean(getDemoNotificationCredentials() && getDemoEmailConfirmation()?.confirmed);

export const subscribeDemoEmailConfirmation = (fn: () => void) => { listeners.add(fn); return () => { listeners.delete(fn); }; };
export function useDemoEmailConfirmation() {
  return useSyncExternalStore(subscribeDemoEmailConfirmation, getDemoEmailConfirmation, getDemoEmailConfirmation);
}

async function call(body: Record<string, unknown>) {
  const credentials = getDemoNotificationCredentials();
  if (!credentials) return null;
  try {
    const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/confirm-demo-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY, 'x-demo-token': credentials.token },
      body: JSON.stringify({ sessionId: credentials.id, ...body }),
    });
    return await res.json().catch(() => null);
  } catch {
    return null;
  }
}

export interface VerifyResult { confirmed: boolean; reason?: 'invalid_code' | 'expired' | 'too_many_attempts' | 'failed'; attemptsLeft?: number }

export async function verifyDemoEmailCode(code: string): Promise<VerifyResult> {
  if (!/^\d{6}$/.test(code)) return { confirmed: false, reason: 'invalid_code' };
  const data = await call({ action: 'verify', code });
  if (data?.confirmed === true) { patch({ confirmed: true }); return { confirmed: true }; }
  const reason = ['invalid_code', 'expired', 'too_many_attempts'].includes(data?.reason) ? data.reason : 'failed';
  return { confirmed: false, reason, attemptsLeft: data?.attempts_left };
}

export async function resendDemoConfirmation(): Promise<ConfirmationSendStatus> {
  const data = await call({ action: 'resend' });
  if (data?.confirmed === true) { patch({ confirmed: true }); return 'already_confirmed'; }
  const status: ConfirmationSendStatus = data?.status ?? 'failed';
  patch({ lastSend: { status, at: new Date().toISOString(), retryAfterSeconds: data?.retryAfterSeconds } });
  return status;
}

/** Syncs with the server (e.g. confirmed in another tab). */
export async function refreshDemoConfirmationStatus() {
  const data = await call({ action: 'status' });
  if (typeof data?.confirmed === 'boolean' && data.confirmed !== Boolean(getDemoEmailConfirmation()?.confirmed)) patch({ confirmed: data.confirmed });
}
