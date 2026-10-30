/**
 * Server-side copy of the fictional demo cases. demo-str-narrative loads cases
 * from here by case id and never trusts case content sent by the browser.
 * The data file is generated from the browser seed by
 * scripts/generate-demo-seed-cases.ts; a test checks the two stay identical.
 */
import { resolveRecipe, seedNow, type DateRecipe } from './demo-seed-time.ts';
import { DEMO_SEED_DATA } from './demo-seed-cases.data.ts';

/** [seq, customerNum, recipe, 'C'|'D', amount, caseId|'', channel, counterparty, agentLocation|''] */
export type SeedCaseTx = [number, number, DateRecipe, 'C' | 'D', number, string, string, string, string];

export interface SeedCaseRecord {
  caseId: string;
  opened: DateRecipe;
  ruleTriggered: string;
  alertType: string;
  riskLevel: string;
  description: string;
  redFlags: string[];
  customer: { fullName: string; bvn: string; nin: string; nuban: string; kycTier: string; occupation?: string; riskScore: number };
}

export interface DemoSeedData {
  /** Opening balance per customer that owns case transactions. */
  bases: Record<string, number>;
  /** Every transaction of those customers, in seed push order. */
  txs: SeedCaseTx[];
  cases: SeedCaseRecord[];
}

export interface DemoCase {
  caseId: string; ruleTriggered: string; alertType: string; riskLevel: string; openedAt: string;
  description: string; redFlags: string[];
  customer: SeedCaseRecord['customer'];
  transactions: { date: string; type: 'Credit' | 'Debit'; amountNGN: number; channel: string; counterparty: string; balanceAfter: number; agentLocation?: string }[];
}

export const DEMO_CASE_IDS: ReadonlySet<string> = new Set(DEMO_SEED_DATA.cases.map((c) => c.caseId));

/** Rebuilds a demo case as the browser shows it at `nowMs`; null for any id outside the allowlist. */
export function loadDemoCase(caseId: string, nowMs = Date.now(), data: DemoSeedData = DEMO_SEED_DATA): DemoCase | null {
  if (!DEMO_CASE_IDS.has(caseId)) return null;
  const rec = data.cases.find((c) => c.caseId === caseId);
  if (!rec) return null;
  const now = seedNow(nowMs);
  const rows = data.txs.map((t) => ({ t, date: resolveRecipe(now, t[2]), balance: 0 }));
  // Running balances per customer, in the same order the seed uses.
  const byCustomer = new Map<number, typeof rows>();
  for (const r of rows) byCustomer.set(r.t[1], [...(byCustomer.get(r.t[1]) ?? []), r]);
  for (const [num, list] of byCustomer) {
    const asc = [...list].sort((a, b) => a.date.localeCompare(b.date) || a.t[0] - b.t[0]);
    let running = 0; let lowest = 0;
    for (const r of asc) { running += r.t[3] === 'C' ? r.t[4] : -r.t[4]; lowest = Math.min(lowest, running); }
    let balance = (data.bases[String(num)] ?? 0) - lowest;
    for (const r of asc) { balance += r.t[3] === 'C' ? r.t[4] : -r.t[4]; r.balance = balance; }
  }
  const transactions = rows
    .filter((r) => r.t[5] === caseId)
    .sort((a, b) => b.date.localeCompare(a.date) || a.t[0] - b.t[0])
    .map((r) => ({
      date: r.date, type: r.t[3] === 'C' ? 'Credit' as const : 'Debit' as const, amountNGN: r.t[4], channel: r.t[6],
      counterparty: r.t[7], balanceAfter: r.balance, ...(r.t[8] ? { agentLocation: r.t[8] } : {}),
    }));
  return {
    caseId: rec.caseId, ruleTriggered: rec.ruleTriggered, alertType: rec.alertType, riskLevel: rec.riskLevel,
    openedAt: resolveRecipe(now, rec.opened), description: rec.description, redFlags: rec.redFlags,
    customer: rec.customer, transactions,
  };
}
