import { describe, expect, it, beforeEach } from 'vitest';
import {
  SEED_ALERTS, SEED_CUSTOMERS, SEED_TRANSACTIONS, SEED_KYB, SEED_CTRS, SEED_AUDIT,
} from './dataset';
import { auditKeysFor } from './views';
import { demoProvider } from '../providers/demo';
import { resetDemoStore } from '../demoStore';

describe('demo seed dataset', () => {
  it('has the requested volumes', () => {
    expect(SEED_CUSTOMERS).toHaveLength(40);
    expect(SEED_TRANSACTIONS.length).toBeGreaterThanOrEqual(600);
    expect(SEED_ALERTS).toHaveLength(25);
    expect(SEED_KYB).toHaveLength(6);
    expect(SEED_CTRS.filter((c) => c.status === 'pending_review')).toHaveLength(4);
  });

  it('uses impossible BVN/NIN values (real ones never start 000)', () => {
    for (const c of SEED_CUSTOMERS) {
      expect(c.bvn).toMatch(/^000\d{8}$/);
      expect(c.nin).toMatch(/^000\d{8}$/);
    }
  });

  it('links every alert to a real customer and that customer\u2019s own transactions', () => {
    const nums = new Set(SEED_CUSTOMERS.map((c) => c.num));
    for (const a of SEED_ALERTS) {
      expect(nums.has(a.customerNum)).toBe(true);
      const caseTx = SEED_TRANSACTIONS.filter((t) => t.alertId === a.id);
      expect(caseTx.length).toBeGreaterThan(0);
      expect(caseTx.every((t) => t.customerNum === a.customerNum)).toBe(true);
    }
  });

  it('ties every seeded audit entry back to a known record', () => {
    const keys = new Set(SEED_CUSTOMERS.flatMap((c) => [...auditKeysFor(c.num)]));
    const orphans = SEED_AUDIT.filter((e) => !keys.has(e.caseId) && !/^(CTR|STR|RULE|R-|SCREENING|demo-)/.test(e.caseId));
    expect(orphans).toEqual([]);
  });
});

describe('demo actions write to the audit trail', () => {
  beforeEach(() => resetDemoStore());

  it('an appended action appears first in the audit log, and reset removes it', async () => {
    await demoProvider.audit.append({ action: 'ACCOUNT_FREEZE', analyst: '', caseId: SEED_ALERTS[0].caseId, justification: 'Test freeze justification text' });
    const after = await demoProvider.audit.load();
    expect(after.entries[0].action).toBe('ACCOUNT_FREEZE');
    expect(after.entries).toHaveLength(SEED_AUDIT.length + 1);
    resetDemoStore();
    expect((await demoProvider.audit.load()).entries).toHaveLength(SEED_AUDIT.length);
  });

  it('alert status changes persist in the session', async () => {
    const id = SEED_ALERTS[0].id;
    await demoProvider.alerts.setStatus(id, 'Escalated');
    const list = await demoProvider.alerts.list();
    expect(list.find((a) => a.id === id)?.status).toBe('Escalated');
  });
});
