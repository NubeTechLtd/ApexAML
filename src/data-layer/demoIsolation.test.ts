import { describe, expect, it, vi, beforeEach } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

// Any backend touch from the demo provider fails the test.
vi.mock('@/integrations/supabase/client', () => {
  const boom = () => { throw new Error('backend called from demo'); };
  return { supabase: new Proxy({}, { get: boom }) };
});

import { demoProvider, refineDemoDraft } from './providers/demo';
import { providerForZone } from './index';
import { resetDemoStore } from './demoStore';

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? files(p) : /\.tsx?$/.test(p) ? [p] : [];
  });
}

// Lead capture, demo booking and admin/live-only screens may use the backend directly.
const ALLOWED = [
  'src/components/landing/', 'src/pages/Admin', 'src/pages/Login', 'src/pages/Contact', 'src/pages/DemoEntry', 'src/pages/LandingPage',
  'src/pages/RoadmapGenerator', 'src/pages/Settings', 'src/components/ProtectedRoute', 'src/components/SupportAccessPanel',
  'src/components/PlatformRoleChanges',
];

describe('demo zone isolation', () => {
  beforeEach(() => resetDemoStore());

  it('demo and marketing zones use the demo provider; app and internal use live', () => {
    expect(providerForZone('demo').kind).toBe('demo');
    expect(providerForZone('marketing').kind).toBe('demo');
    expect(providerForZone('app').kind).toBe('live');
    expect(providerForZone('internal').kind).toBe('live');
  });

  it('demo provider source never imports the backend client', () => {
    const src = readFileSync('src/data-layer/providers/demo.ts', 'utf8');
    expect(src).not.toMatch(/integrations\/supabase\/client|functions\.invoke/);
  });

  it('operational pages and components do not import the backend client', () => {
    const offenders = [...files('src/pages'), ...files('src/components')]
      .filter((f) => !ALLOWED.some((a) => f.startsWith(a)))
      .filter((f) => /integrations\/supabase\/client|functions\.invoke\(/.test(readFileSync(f, 'utf8')));
    expect(offenders).toEqual([]);
  });

  it('files a sample CTR without the backend', async () => {
    const pending = (await demoProvider.ctr.list()).find((r) => r.status === 'pending_review')!;
    await demoProvider.ctr.file(pending, { reference: 'CTR-T-1', xml: '<x/>' });
    const after = (await demoProvider.ctr.list()).find((r) => r.id === pending.id)!;
    expect(after.status).toBe('filed');
    expect(after.ctr_reference).toBe('CTR-T-1');
  });

  it('records audit entries and risk recalculations locally', async () => {
    await demoProvider.audit.append({ action: 'STR_EXPORT', analyst: '', caseId: 'C1', justification: 'test export' });
    expect((await demoProvider.audit.load()).entries[0].caseId).toBe('C1');
    await demoProvider.riskScores.recalculate({ customerId: 'X', triggerType: 'STR_FILED', fallbackScore: 50 });
    const [row] = await demoProvider.riskScores.history('X', new Date(0));
    expect(row.newScore).toBe(60);
  });

  it('sample co-pilot never claims an edit it did not make', () => {
    const r = refineDemoDraft('One. Two.', 'translate to hausa', []);
    expect(r.changed).toBe(false);
    expect(r.narrative).toBe('One. Two.');
    expect(r.confirmation).toMatch(/unchanged/);
  });
});
