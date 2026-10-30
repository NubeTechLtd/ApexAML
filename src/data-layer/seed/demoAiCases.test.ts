import { describe, expect, it, vi, afterEach } from 'vitest';
import { DEMO_CASE_IDS, loadDemoCase } from '../../../supabase/functions/_shared/demo-seed-cases.ts';
import { DEMO_SEED_DATA } from '../../../supabase/functions/_shared/demo-seed-cases.data.ts';

afterEach(() => { vi.useRealTimers(); vi.resetModules(); });

// What the visitor sees in the demo for a case, in the shape the server builds.
const browserView = (a: Awaited<typeof import('./dataset')>['SEED_ALERTS'][number]) => ({
  caseId: a.caseId, ruleTriggered: a.ruleTriggered, alertType: a.alertType ?? 'STANDARD', riskLevel: a.riskLevel, openedAt: a.timestamp,
  description: a.description, redFlags: a.behavioralRedFlags,
  customer: {
    fullName: a.customerProfile.fullName, bvn: a.customerProfile.bvn, nin: a.customerProfile.nin, nuban: a.customerProfile.nuban,
    kycTier: a.customerProfile.kycTier, occupation: a.customerProfile.occupation, riskScore: a.customerProfile.riskScore,
  },
  transactions: a.transactions.map((t) => ({
    date: t.date, type: t.type, amountNGN: t.amountNGN, channel: t.channel, counterparty: t.counterparty,
    balanceAfter: t.balanceAfter, ...(t.agentLocation ? { agentLocation: t.agentLocation } : {}),
  })),
});

describe('server-side demo case allowlist', () => {
  it('is current with the browser seed', async () => {
    const { buildDemoSeedData } = await import('./demoAiCases');
    expect(DEMO_SEED_DATA).toEqual(JSON.parse(JSON.stringify(buildDemoSeedData())));
  });

  it.each(['2026-10-30T00:30:00Z', '2026-10-30T05:10:00Z', '2026-10-30T13:59:00Z', '2026-10-30T23:40:00Z', '2027-03-01T18:20:00Z'])(
    'rebuilds every case exactly as the visitor sees it at %s', async (iso) => {
      vi.useFakeTimers(); vi.setSystemTime(new Date(iso)); vi.resetModules();
      const { SEED_ALERTS } = await import('./dataset');
      expect(SEED_ALERTS).toHaveLength(25);
      for (const a of SEED_ALERTS) expect(loadDemoCase(a.caseId, Date.now())).toEqual(browserView(a));
    },
  );

  it('allows exactly the 25 demo seed case ids', () => {
    expect(DEMO_CASE_IDS.size).toBe(25);
  });

  it('refuses any other case id', () => {
    expect(loadDemoCase('CAS-2026-9999-NG')).toBeNull();
    expect(loadDemoCase('ALT-2026-1001')).toBeNull();
    expect(loadDemoCase('')).toBeNull();
  });
});
