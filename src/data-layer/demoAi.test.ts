import { describe, it, expect, vi, afterEach } from 'vitest';

vi.mock('./demoStore', () => ({ getDemoNotificationCredentials: () => ({ id: 'session-1', token: 'tok' }) }));

import { demoAiGenerate } from './demoAi';
import type { Alert } from '@/data/models/alerts';

const alert = {
  caseId: 'C-1', ruleTriggered: 'R', alertType: 'T', riskLevel: 'High', timestamp: '2026-01-01',
  description: 'd', behavioralRedFlags: [], transactions: [],
  customerProfile: { fullName: 'A', bvn: '0', nin: '0', nuban: '0', kycTier: 'Tier 1', occupation: 'x', riskScore: 50 },
} as unknown as Alert;

const respond = (status: number, body: unknown) =>
  vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify(body), { status }));

afterEach(() => vi.restoreAllMocks());

describe('demo AI limits and fallback', () => {
  it('reports the per-session cap as a limit', async () => {
    respond(429, { reason: 'session_limit' });
    expect(await demoAiGenerate(alert)).toEqual({ ok: false, limited: true });
  });

  it('reports the per-IP daily cap as a limit', async () => {
    respond(429, { reason: 'ip_daily_limit' });
    expect(await demoAiGenerate(alert)).toEqual({ ok: false, limited: true });
  });

  it('treats an AI provider rate limit as a plain failure, not the demo cap', async () => {
    respond(429, { reason: 'ai_failed' });
    expect(await demoAiGenerate(alert)).toEqual({ ok: false, limited: false });
  });

  it('falls back on a network error or timeout', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new DOMException('aborted', 'AbortError'));
    expect(await demoAiGenerate(alert)).toEqual({ ok: false, limited: false });
  });

  it('returns the generated narrative on success', async () => {
    respond(200, { narrative: 'Live text' });
    expect(await demoAiGenerate(alert)).toMatchObject({ ok: true, narrative: 'Live text' });
  });
});
