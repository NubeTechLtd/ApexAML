/**
 * Builds the server-side copy of the demo cases used by demo-str-narrative
 * (supabase/functions/_shared/demo-seed-cases.data.ts). Dates are stored as
 * recipes so the server can rebuild them for any hour.
 */
import { SEED_ALERTS, SEED_CUSTOMERS, SEED_DATE_RECIPES, SEED_TRANSACTIONS, openingBase } from './dataset';
import type { DemoSeedData, SeedCaseTx } from '../../../supabase/functions/_shared/demo-seed-cases.ts';
import type { DateRecipe } from '../../../supabase/functions/_shared/demo-seed-time.ts';

const recipe = (id: string): DateRecipe => {
  const r = SEED_DATE_RECIPES.get(id);
  if (!r) throw new Error(`No date recipe recorded for ${id}`);
  return r;
};

export function buildDemoSeedData(): DemoSeedData {
  const caseOf = new Map(SEED_ALERTS.map((a) => [a.id, a.caseId]));
  const owners = new Set(SEED_TRANSACTIONS.filter((t) => t.alertId).map((t) => t.customerNum));
  const txs: SeedCaseTx[] = SEED_TRANSACTIONS
    .filter((t) => owners.has(t.customerNum))
    .map((t): SeedCaseTx => [
      Number(t.id.replace('TXN-', '')), t.customerNum, recipe(t.id), t.type === 'Credit' ? 'C' : 'D', t.amountNGN,
      t.alertId ? caseOf.get(t.alertId) ?? '' : '', t.channel, t.counterparty, t.agentLocation ?? '',
    ])
    .sort((a, b) => a[0] - b[0]);
  const bases: Record<string, number> = {};
  for (const c of SEED_CUSTOMERS) if (owners.has(c.num)) bases[String(c.num)] = openingBase(c);
  const cases = SEED_ALERTS.map((a) => ({
    caseId: a.caseId, opened: recipe(a.id), ruleTriggered: a.ruleTriggered, alertType: a.alertType ?? 'STANDARD',
    riskLevel: a.riskLevel, description: a.description, redFlags: a.behavioralRedFlags,
    customer: {
      fullName: a.customerProfile.fullName, bvn: a.customerProfile.bvn, nin: a.customerProfile.nin, nuban: a.customerProfile.nuban,
      kycTier: a.customerProfile.kycTier, occupation: a.customerProfile.occupation, riskScore: a.customerProfile.riskScore,
    },
  }));
  return { bases, txs, cases };
}
