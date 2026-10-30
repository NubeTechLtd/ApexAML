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
    expect(await demoAiGenerate(alert)).toEqual({ ok: false, limited: 'session' });
  });

  it('reports the per-IP daily cap as a limit', async () => {
    respond(429, { reason: 'ip_daily_limit' });
    expect(await demoAiGenerate(alert)).toEqual({ ok: false, limited: 'session' });
  });

  it('reports the global daily cap of the demo as capacity', async () => {
    respond(429, { reason: 'global_daily_limit' });
    expect(await demoAiGenerate(alert)).toEqual({ ok: false, limited: 'capacity' });
  });

  it('reports the kill switch as capacity', async () => {
    respond(429, { reason: 'demo_ai_disabled' });
    expect(await demoAiGenerate(alert)).toEqual({ ok: false, limited: 'capacity' });
  });

  it('falls back when the server discards off-format output', async () => {
    respond(502, { reason: 'invalid_output' });
    expect(await demoAiGenerate(alert)).toEqual({ ok: false, limited: false });
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

  it('sends only the case id, never case content', async () => {
    const spy = respond(200, { narrative: 'Live text' });
    await demoAiGenerate(alert);
    const body = JSON.parse(String(spy.mock.calls[0][1]?.body));
    expect(body).toEqual({ sessionId: 'session-1', mode: 'generate', caseId: 'C-1' });
  });

  it('falls back when the server refuses a case outside the demo seed', async () => {
    respond(404, { reason: 'unknown_case' });
    expect(await demoAiGenerate(alert)).toEqual({ ok: false, limited: false });
  });
});
