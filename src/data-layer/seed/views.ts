/**
 * Read models for each demo screen, all derived from the one seed dataset
 * plus the visitor's session overlays (status changes, freezes, toggles).
 */
import type { Alert } from '@/data/models/alerts';
import type { AlertData, AlertStatus } from '@/data/models/legacyAlerts';
import type { Customer360Data, ConnectedEntity } from '@/data/models/customer360';
import type { SanctionsMatch } from '@/data/models/sanctions';
import type { STRRecord } from '@/data/models/str';
import type { Rule } from '@/components/RulesTable';
import {
  SEED_ALERTS, SEED_CUSTOMERS, SEED_TRANSACTIONS, SEED_RULES, SEED_SANCTIONS, SEED_STRS, SEED_DOCUMENTS,
  customerByNum, documentLabel, ngn, type SeedAlert, type SeedCustomer, type SeedTx,
} from './dataset';

export type DemoAccountStatus = 'Active' | 'Under Review' | 'Frozen' | 'Restricted';

export interface DemoOverlays {
  alertStatus: Record<string, Alert['status']>;
  accountStatus: Record<number, DemoAccountStatus>;
  ruleEnabled: Record<string, boolean>;
  sanctionsStatus: Record<string, SanctionsMatch['status']>;
  strStatus: Record<string, STRRecord['status']>;
  /** STRs created during the session (from goAML exports). */
  sessionStrs: STRRecord[];
}

export const emptyOverlays = (): DemoOverlays => ({
  alertStatus: {}, accountStatus: {}, ruleEnabled: {}, sanctionsStatus: {}, strStatus: {}, sessionStrs: [],
});

const txByCustomer = new Map<number, SeedTx[]>();
for (const t of SEED_TRANSACTIONS) {
  const list = txByCustomer.get(t.customerNum) ?? [];
  list.push(t);
  txByCustomer.set(t.customerNum, list);
}
export const transactionsFor = (num: number) => txByCustomer.get(num) ?? [];

export const alertStatusOf = (a: SeedAlert, o: DemoOverlays) => o.alertStatus[a.id] ?? a.status;
export const accountStatusOf = (c: SeedCustomer, o: DemoOverlays): DemoAccountStatus => o.accountStatus[c.num] ?? c.accountStatus;

export function workspaceAlerts(o: DemoOverlays): Alert[] {
  return SEED_ALERTS.map((a) => ({ ...a, status: alertStatusOf(a, o) }));
}

const LEGACY_CHANNEL: Record<string, string> = {
  POS: 'POS', 'Mobile Transfer': 'Mobile', USSD: 'USSD', 'ATM Withdrawal': 'ATM', 'Online Banking': 'Internet Banking',
  'Card Payment': 'POS', 'Cash Deposit': 'Branch', 'IMTO Cash Payout': 'IMTO',
};
export const channelLabel = (channel: string) => LEGACY_CHANNEL[channel] ?? channel;

export function legacyAlerts(o: DemoOverlays): AlertData[] {
  return SEED_ALERTS.map((a) => {
    const c = customerByNum(a.customerNum);
    const caseTx = SEED_TRANSACTIONS.filter((t) => t.alertId === a.id).sort((x, y) => x.date.localeCompare(y.date));
    return {
      id: a.id, riskScore: c.riskScore, customerName: c.fullName, customerId: c.ref, customer360Id: c.num, bvn: c.bvn,
      alertType: a.legacyType, timestamp: a.timestamp, status: alertStatusOf(a, o) as AlertStatus, kycTier: c.kycTier,
      riskLevel: a.riskLevel, accountNumber: c.nuban, totalFlagged: caseTx.reduce((s, t) => s + t.amountNGN, 0),
      summary: a.description,
      transactionTimeline: caseTx.map((t) => ({ id: t.id, date: t.date, type: t.type, amount: t.amountNGN, currency: 'NGN', counterparty: t.counterparty, channel: channelLabel(t.channel), flagReason: t.flagReason })),
    };
  });
}

function connectedEntities(c: SeedCustomer): ConnectedEntity[] {
  const out: ConnectedEntity[] = [];
  const linked = new Map<number, { total: number; count: number }>();
  for (const t of SEED_TRANSACTIONS) {
    const other = t.customerNum === c.num ? t.linkedNum : t.linkedNum === c.num ? t.customerNum : undefined;
    if (!other || other === c.num) continue;
    const entry = linked.get(other) ?? { total: 0, count: 0 };
    entry.total += t.amountNGN;
    entry.count += 1;
    linked.set(other, entry);
  }
  [...linked.entries()].sort((a, b) => b[1].total - a[1].total).slice(0, 4).forEach(([num, v]) => {
    const o = customerByNum(num);
    out.push({ id: `ce-${c.num}-${num}`, label: o.fullName, type: 'Frequent Transfer Target', detail: `${ngn(v.total)} across ${v.count} transfer${v.count > 1 ? 's' : ''} · ${o.ref}` });
  });
  if (c.num === 1 || c.num === 15) {
    const other = customerByNum(c.num === 1 ? 15 : 1);
    out.push({ id: `ce-dev-${c.num}`, label: 'Device #DEMO-A3F9', type: 'Shared Device ID', detail: `Shared with ${other.fullName} (${other.ref})` });
  }
  if (c.num === 2 || c.num === 19) {
    const other = customerByNum(c.num === 2 ? 19 : 2);
    out.push({ id: `ce-ip-${c.num}`, label: '192.0.2.x (documentation range)', type: 'Common IP Address', detail: `Matches ${other.fullName} (${other.ref})` });
  }
  if (c.num === 39) out.push({ id: 'ce-bdc-39', label: 'Crownpoint BDC Ltd (fictional)', type: 'Bureau de Change (BDC)', detail: 'Debited 1h 37m after an IMTO remittance credit (round-trip pattern)' });
  return out;
}

function radar(c: SeedCustomer) {
  const s = c.riskScore;
  const jitter = (k: number) => ((c.num * 37 + k * 53) % 30) - 15;
  const clamp = (v: number) => Math.max(5, Math.min(98, Math.round(v)));
  const cross = c.entityType === 'IMTO Agent' || c.entityType === 'Foreign Business' ? 30 : 0;
  return [
    { axis: 'PEP Exposure', value: clamp((c.occupation.includes('PEP') ? 80 : 20) + jitter(1)) },
    { axis: 'Cross-Border Vol.', value: clamp(s * 0.5 + cross + jitter(2)) },
    { axis: 'Cash Intensity', value: clamp(s * 0.7 + jitter(3)) },
    { axis: 'BVN/NIN Integrity', value: clamp((c.bvnVerified ? 12 : 70) + jitter(4) / 2) },
    { axis: 'Peer Deviation', value: clamp(s * 0.9 + jitter(5)) },
    { axis: 'Channel Conc.', value: clamp(s * 0.6 + jitter(6)) },
  ];
}

export function customer360(o: DemoOverlays): Record<number, Customer360Data> {
  const out: Record<number, Customer360Data> = {};
  for (const c of SEED_CUSTOMERS) {
    const status = accountStatusOf(c, o);
    out[c.num] = {
      id: c.num, name: c.fullName, bvn: c.bvn, nin: c.nin, dob: c.dob, riskLevel: c.riskLevel, riskScore: c.riskScore,
      kycTier: c.kycTier, bvnVerified: c.bvnVerified, livenessCheck: c.liveness,
      accountStatus: status === 'Under Review' ? 'Restricted' : status,
      alerts: SEED_ALERTS.filter((a) => a.customerNum === c.num).length,
      email: c.email, phone: c.phone, address: c.address, entityType: c.entityType, cacNumber: c.cacNumber, foreignKYB: c.foreignKYB,
      radarScores: radar(c), connectedEntities: connectedEntities(c),
      eddDocuments: SEED_DOCUMENTS.filter((d) => d.customer_id === String(c.num)).map((d) => ({ name: d.document_name, type: documentLabel(d.document_type), uploadedAt: d.uploaded_at.slice(0, 10) })),
    };
  }
  return out;
}

export interface CustomerRow { id: number; name: string; bvn: string; riskLevel: string; kycTier: string; alerts: number; status: DemoAccountStatus }
export function customerRows(o: DemoOverlays): CustomerRow[] {
  return SEED_CUSTOMERS.map((c) => ({
    id: c.num, name: c.fullName, bvn: c.bvn, riskLevel: c.riskLevel, kycTier: c.kycTier,
    alerts: SEED_ALERTS.filter((a) => a.customerNum === c.num).length, status: accountStatusOf(c, o),
  }));
}

export const rules = (o: DemoOverlays): Rule[] => SEED_RULES.map((r) => ({ ...r, enabled: o.ruleEnabled[r.id] ?? r.enabled }));
export const sanctionsMatches = (o: DemoOverlays): SanctionsMatch[] => SEED_SANCTIONS.map((m) => ({ ...m, status: o.sanctionsStatus[m.id] ?? m.status }));
export const strRecords = (o: DemoOverlays): STRRecord[] =>
  [...o.sessionStrs, ...SEED_STRS].map((s) => ({ ...s, status: o.strStatus[s.id] ?? s.status }));

/** Every identifier an audit entry may use for this customer. */
export function auditKeysFor(num: number): Set<string> {
  const c = customerByNum(num);
  const keys = new Set([c.ref, c.bvn, String(num), c.nuban]);
  for (const a of SEED_ALERTS.filter((x) => x.customerNum === num)) { keys.add(a.caseId); keys.add(a.id); }
  for (const m of SEED_SANCTIONS.filter((x) => x.internal.bvn === c.bvn)) keys.add(m.id);
  return keys;
}
