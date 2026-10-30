/**
 * The single seed dataset for the demo zone: one fictional microfinance bank,
 * 40 customers, 600 transactions and every case built on top of them. Every
 * view (alert inbox, workspace, Customer 360, KYC, KYB, sanctions, CTRs, STRs,
 * settlement accounts, risk history, documents, audit) derives from here, so
 * ids line up everywhere. Nothing in this file is real.
 */
import type {
  Alert, AlertType, PhantomPayrollContext, PhantomPayrollRecipient, RiskLevel, Transaction, TxChannel,
} from '@/data/models/alerts';
import type { AlertType as LegacyAlertType } from '@/data/models/legacyAlerts';
import type { Rule } from '@/components/RulesTable';
import type { CorporateEntity } from '@/data/models/kyb';
import type { KYCCustomer, KYCStatus } from '@/data/models/kyc';
import type { SanctionsMatch } from '@/data/models/sanctions';
import type { STRRecord, NFIUSubmission } from '@/data/models/str';
import type { ManagedAccount } from '@/data/models/settlement';
import type { AdverseMediaScreening, AuditEntry, CtrRecord, KycDocument, QueuedTransaction, RiskScoreEntry, RiskTriggerType } from '../types';
import { requiredDocsForTier, DOCUMENT_LABELS, type KycDocumentType } from '@/lib/kycDocuments';
import { SEED_CUSTOMERS, customerByNum, IMTO_OPERATORS, type SeedCustomer } from './customers';
import { createRandom, pad } from './random';
import { DAY, HOUR, seedAt, seedHoursAgo, seedNow, type DateRecipe } from '../../../supabase/functions/_shared/demo-seed-time.ts';

export { SEED_CUSTOMERS, customerByNum, type SeedCustomer } from './customers';

export const DEMO_INSTITUTION = {
  id: 'demo-institution',
  name: 'Harmattan Ridge Microfinance Bank',
  shortName: 'Harmattan Ridge MFB',
  licence: 'CBN/MFB/DEMO/0000',
};

export const DEMO_ANALYSTS = ['Amaka Sampleyi (MLRO)', 'Bello Testimehin', 'Ronke Placeholdu', 'Uche Demoyinka'] as const;

/** Anchor rounded to the hour so a page load and its reload share one timeline. */
export const SEED_NOW = seedNow(Date.now());

/**
 * How each generated timestamp was built, so the demo AI function can rebuild
 * the same case dates server-side (see scripts/generate-demo-seed-cases.ts).
 */
export const SEED_DATE_RECIPES = new Map<string, DateRecipe | 'conflict'>();
const remember = (iso: string, r: DateRecipe) => {
  const prev = SEED_DATE_RECIPES.get(iso);
  SEED_DATE_RECIPES.set(iso, prev && JSON.stringify(prev) !== JSON.stringify(r) ? 'conflict' : r);
  return iso;
};
const hoursAgo = (h: number, minute = 0) => remember(seedHoursAgo(SEED_NOW, h, minute), ['h', h, minute]);
/** Day offset at a WAT clock hour (WAT = UTC+1); never in the future. */
const at = (daysAgo: number, hourWAT = 10, minute = 0) => remember(seedAt(SEED_NOW, daysAgo, hourWAT, minute), ['d', daysAgo, hourWAT, minute]);
const dateOnly = (iso: string) => iso.slice(0, 10);
export const ngn = (n: number) => '₦' + Math.round(n).toLocaleString('en-NG');

const rand = createRandom(20261028);

/* ── Rules ───────────────────────────────────────────── */

type RuleSpec = [id: string, name: string, typology: string, threshold: number, fp: number, status: Rule['validationStatus'], validatedDaysAgo: number, enabled?: boolean];
const RULE_SPECS: RuleSpec[] = [
  ['R-001', 'POS Round-Trip Detection', 'POS Round-Trip', 500_000, 12, 'Validated', 40],
  ['R-002', 'POS Structuring Below Tier Limits', 'Tier Limit Structuring', 50_000, 21, 'Validated', 55],
  ['R-003', 'USSD Layering & Fan-in Monitor', 'USSD Layering', 2_000_000, 18, 'Validated', 30],
  ['R-004', 'Dormant Account Activation', 'Dormant Activation', 1_000_000, 34, 'Pending', 160],
  ['R-005', 'Crypto P2P Velocity', 'Crypto P2P', 3_000_000, 22, 'Validated', 75],
  ['R-006', 'Salary Mule Detection', 'Salary Mule', 1_500_000, 35, 'Overdue', 400],
  ['R-007', 'Real Estate Front Flows', 'Real Estate Front', 50_000_000, 8, 'Pending', 220, false],
  ['R-008', 'PEP Spending Spike', 'PEP Spending Spike', 5_000_000, 15, 'Validated', 20],
  ['R-009', 'Cash Limit Smurfing Detector — $200 CBN Threshold', 'IMTO Cash Smurfing', 316_000, 9, 'Validated', 12],
  ['R-010', 'IMTO Outbound Transfer Violation', 'IMTO Direction Check', 1, 0, 'Validated', 10],
  ['R-011', 'IMTO Non-Naira Settlement Violation', 'IMTO FX Settlement', 1, 0, 'Validated', 10],
  ['R-012', 'IMTO → BDC Round-Trip Detector (48h)', 'BDC Round-Tripping', 1_000_000, 11, 'Validated', 14],
  ['R-013', 'B2P Phantom Payroll Pattern (Foreign Business Burst)', 'Phantom Payroll', 50, 7, 'Validated', 8],
  ['R-014', 'IMTO Settlement Account Commingling (May 2026 Circular)', 'IMTO Account Commingling', 1, 4, 'Validated', 7],
  ['R-015', 'Unusual Midnight e-Channel Spikes', 'Time-of-day Anomaly', 1_000_000, 26, 'Validated', 60],
  ['R-016', 'Cross-Border Wire to High-Risk Jurisdiction', 'High-Risk Jurisdiction', 10_000_000, 19, 'Validated', 90],
  ['R-017', 'Cash Deposits Just Below CTR Threshold', 'Cash Structuring', 4_500_000, 14, 'Validated', 25],
  ['R-018', 'Account Velocity Spike', 'Velocity Spike', 1_000_000, 31, 'Overdue', 380],
  ['R-019', 'Sanctions Watchlist Payment Match', 'Sanctions Hit', 1, 6, 'Validated', 5],
  ['R-020', 'Cross-Border Flag — Overseas IMTO Referral', 'Overseas Referral', 1, 0, 'Validated', 9],
  ['R-021', 'POS Agent Float Cycling', 'Agent Float Cycling', 1_000_000, 24, 'Pending', 140],
  ['R-022', 'Round-Tripping Between Related Accounts', 'Round-Tripping', 5_000_000, 17, 'Validated', 45],
  ['R-023', 'Adverse Media + Large Inflow', 'Adverse Media', 10_000_000, 10, 'Validated', 33],
];

/* ── Transactions ────────────────────────────────────── */

export interface SeedTx extends Transaction {
  customerNum: number;
  alertId?: string;
  flagReason?: string;
  /** Another seed customer on the other side of the transfer. */
  linkedNum?: number;
}

const txns: SeedTx[] = [];
let txSeq = 0;
function addTx(customerNum: number, date: string, type: 'Credit' | 'Debit', amountNGN: number, counterparty: string, channel: TxChannel, extra: Partial<SeedTx> = {}): SeedTx {
  const t: SeedTx = { id: `TXN-${pad(++txSeq, 5)}`, customerNum, date, type, amountNGN: Math.round(amountNGN), counterparty, balanceAfter: 0, channel, ...extra };
  txns.push(t);
  return t;
}
const toName = (num: number) => `${customerByNum(num).fullName} (${customerByNum(num).ref})`;

/* ── Alerts ──────────────────────────────────────────── */

export interface SeedAlert extends Alert {
  customerNum: number;
  ruleId: string;
  legacyType: LegacyAlertType;
}

const alerts: SeedAlert[] = [];
let alertSeq = 1000;

const tierLabel = (c: SeedCustomer) => {
  if (c.entityType === 'IMTO Agent') return 'Corporate · IMTO Designated';
  if (c.entityType === 'Foreign Business') return 'Foreign Business — Tier 3 KYB';
  if (c.entityType === 'Nigerian Business') return 'Corporate — Tier 3 KYB';
  if (c.occupation.startsWith('Unverified')) return 'IMTO Walk-In (Tier 1 Equivalent)';
  return c.kycTier === 'Tier 1' ? 'Tier 1 (Limit: ₦50,000/day)' : c.kycTier === 'Tier 2' ? 'Tier 2 (Limit: ₦200,000/day)' : 'Tier 3 (No Limits)';
};

function timeElapsed(iso: string) {
  const mins = Math.max(1, Math.round((SEED_NOW - new Date(iso).getTime()) / 60_000));
  if (mins < 60) return `${mins}m ago`;
  const h = Math.round(mins / 60);
  return h < 24 ? `${h}h ago` : `${Math.round(h / 24)}d ago`;
}

interface AlertSpec {
  num: number;
  ruleId: string;
  status: Alert['status'];
  risk: RiskLevel;
  hours: number;
  legacyType: LegacyAlertType;
  alertType?: AlertType;
  /** Adds the case's transactions and returns them. */
  txs: (alertId: string, c: SeedCustomer) => SeedTx[];
  description: (c: SeedCustomer, t: SeedTx[]) => string;
  flags: (c: SeedCustomer, t: SeedTx[]) => string[];
  narrative: (c: SeedCustomer, t: SeedTx[]) => string;
  extra?: (c: SeedCustomer, t: SeedTx[]) => Partial<Alert>;
}

function addAlert(spec: AlertSpec) {
  const id = `ALT-2026-${++alertSeq}`;
  const c = customerByNum(spec.num);
  const t = spec.txs(id, c).map((x) => Object.assign(x, { alertId: id }));
  const rule = RULE_SPECS.find((r) => r[0] === spec.ruleId)!;
  const timestamp = hoursAgo(spec.hours);
  alerts.push({
    id,
    caseId: `CAS-2026-${alertSeq}-NG`,
    status: spec.status,
    riskLevel: spec.risk,
    ruleTriggered: rule[1],
    timestamp,
    timeElapsed: timeElapsed(timestamp),
    description: spec.description(c, t),
    aiDraftedNarrative: spec.narrative(c, t),
    customerProfile: {
      fullName: c.fullName, bvn: c.bvn, nin: c.nin, nuban: c.nuban, kycTier: tierLabel(c),
      occupation: c.occupation, registeredAddress: c.address, riskScore: c.riskScore,
    },
    transactions: [],
    behavioralRedFlags: spec.flags(c, t),
    alertType: spec.alertType ?? 'STANDARD',
    customerNum: spec.num,
    ruleId: spec.ruleId,
    legacyType: spec.legacyType,
    ...spec.extra?.(c, t),
  });
}

const sum = (t: SeedTx[], type?: 'Credit' | 'Debit') => t.filter((x) => !type || x.type === type).reduce((s, x) => s + x.amountNGN, 0);
const AREAS = ['Oshodi', 'Yaba', 'Surulere', 'Ikeja', 'Lekki', 'Apapa'];
const AGENT_BRANDS = ['AgentPoint', 'CashNest'];

// 1 — Guided case: POS round-trip structuring.
addAlert({
  num: 1, ruleId: 'R-001', status: 'Open', risk: 'Critical', hours: 8, legacyType: 'Round-Tripping',
  txs: (_id, c) => {
    const out: SeedTx[] = [];
    for (let i = 0; i < 30; i++) {
      const area = AREAS[i % 6];
      const terminal = `${AGENT_BRANDS[Math.floor(i / 6) % 2]} Agent ${pad((i % 12) + 1, 2)} / ${area}`;
      out.push(addTx(c.num, hoursAgo(80 - i * 2.4), 'Debit', 475_000 + ((i * 7919) % 24_000), terminal, 'POS', { agentLocation: area, flagReason: 'Below ₦500,000 threshold' }));
      if (i % 5 === 4) out.push(addTx(c.num, hoursAgo(80 - i * 2.4 - 1.5), 'Credit', 470_000, `Cash re-deposit / ${AREAS[(i + 2) % 6]} agent`, 'Cash Deposit', { agentLocation: AREAS[(i + 2) % 6], flagReason: 'Round-trip re-deposit' }));
    }
    return out;
  },
  description: (_c, t) => `${t.filter((x) => x.channel === 'POS').length} POS withdrawals across 12 agent terminals in 72 hours — ${ngn(sum(t, 'Debit'))} total, every transaction sized just below the ₦500,000 reporting threshold.`,
  flags: () => [
    'Threshold avoidance: every withdrawal sized between ₦475,000 and ₦499,000 — deliberately under the ₦500,000 trigger.',
    'Agent dispersion: 12 distinct POS terminals across 6 Lagos areas in 72 hours — agent-shopping pattern.',
    'No commercial substance: declared "Phone Accessories Trader", but cash velocity far exceeds the SME peer group.',
    'Round-trip indicator: cash re-deposited to the same account within hours via a different agent.',
  ],
  narrative: (c, t) => `The subject, ${c.fullName} (BVN ${c.bvn}), executed ${t.filter((x) => x.channel === 'POS').length} Point-of-Sale withdrawals totalling ${ngn(sum(t, 'Debit'))} across 12 agent terminals in Lagos within 72 hours. Each withdrawal was structured between ₦475,000 and ₦499,000, below the ₦500,000 single-transaction reporting threshold. Withdrawals were dispersed across ${AREAS.join(', ')}, and ${t.filter((x) => x.type === 'Credit').length} cycles were closed by cash re-deposits to the same account via unrelated agents. The declared occupation cannot account for cash velocity of this magnitude. The account has been placed under restriction pending NFIU submission.`,
});

// 2 — Tier 1 structuring then VASP outflow.
addAlert({
  num: 2, ruleId: 'R-002', status: 'Open', risk: 'Critical', hours: 2, legacyType: 'Structuring',
  txs: (_id, c) => [
    addTx(c.num, hoursAgo(9), 'Credit', 45_000, 'POS / AgentPoint / Ikeja', 'POS', { flagReason: 'Tier 1 limit' }),
    addTx(c.num, hoursAgo(7), 'Credit', 48_000, 'POS / CashNest / Oshodi', 'POS', { flagReason: 'Tier 1 limit' }),
    addTx(c.num, hoursAgo(4.5), 'Credit', 49_000, 'POS / AgentPoint / Yaba', 'POS', { flagReason: 'Tier 1 limit' }),
    addTx(c.num, hoursAgo(4.2), 'Debit', 140_000, 'Fictional P2P Desk — suspected VASP', 'Mobile Transfer', { flagReason: 'Rapid outflow' }),
  ],
  description: () => 'Tier 1 limits exceeded via structured inflows from distinct POS terminals, followed by immediate transfer to a suspected virtual asset service provider.',
  flags: () => [
    'Account velocity: funds stayed in the account for about 18 minutes before outflow.',
    'Limit breach: the Tier 1 daily cumulative limit of ₦50,000 was bypassed via fragmented credits.',
    'IP mismatch: logins from Abuja while POS credits were localised in Lagos.',
  ],
  narrative: (c, t) => `The subject, ${c.fullName}, a Tier 1 account holder, evaded the ₦50,000 daily limit using geographically dispersed POS terminals in Lagos. Within five hours the account received three structured credits totalling ${ngn(sum(t, 'Credit'))}, which were transferred out within minutes to a suspected virtual asset service provider. The velocity and IP mismatch indicate pass-through account behaviour.`,
});

// 3 — Midnight e-channel spike into betting wallets.
addAlert({
  num: 3, ruleId: 'R-015', status: 'Under Review', risk: 'High', hours: 12, legacyType: 'Velocity Spike',
  txs: (_id, c) => [0, 15, 30].map((m, i) => addTx(c.num, at(0, 2, 10 + m), 'Debit', 500_000, i === 2 ? 'LuckySample Wallet Top-up' : 'SampleBet Wallet Top-up', i === 2 ? 'Mobile Transfer' : 'Online Banking', { flagReason: 'Off-hours spike' })),
  description: () => "Rapid transfers between 2:00 AM and 3:00 AM, deviating from the customer's historical profile.",
  flags: () => [
    'Time-of-day anomaly: all volume occurred outside regular banking hours.',
    'New device login: transactions initiated from an unrecognised Android device.',
    'Gaming platform funnelling: funds directed to betting wallets.',
  ],
  narrative: (c, t) => `Between 02:10 and 02:40 WAT, three consecutive ₦500,000 debits totalling ${ngn(sum(t))} were executed from ${c.fullName}'s account to online betting wallets. Coupled with a new-device login, the pattern indicates possible account takeover converging with laundering through gaming platforms. E-channels were temporarily restricted pending verbal verification.`,
});

// 4 — Dormant account reactivation with fan-out to other customers.
addAlert({
  num: 4, ruleId: 'R-004', status: 'Open', risk: 'High', hours: 26, legacyType: 'Velocity Spike',
  txs: (_id, c) => [
    addTx(c.num, hoursAgo(27), 'Credit', 2_800_000, 'NIP / Savannah Commercial Bank (fictional) / Abuja', 'Online Banking', { flagReason: 'Dormant reactivation' }),
    addTx(c.num, hoursAgo(26.7), 'Debit', 950_000, `Transfer to ${toName(20)}`, 'Mobile Transfer', { linkedNum: 20, flagReason: 'Fan-out' }),
    addTx(c.num, hoursAgo(26.6), 'Debit', 900_000, `Transfer to ${toName(26)}`, 'Mobile Transfer', { linkedNum: 26, flagReason: 'Fan-out' }),
    addTx(c.num, hoursAgo(26.5), 'Debit', 900_000, `Transfer to ${toName(30)}`, 'USSD', { linkedNum: 30, flagReason: 'Fan-out' }),
  ],
  description: () => 'Dormant account (18 months inactive) received ₦2.8M followed by immediate transfers to three other customers.',
  flags: () => [
    'Account dormancy: no activity for 18 months before this credit.',
    `Fan-out: the credit was split to ${customerByNum(20).fullName}, ${customerByNum(26).fullName} and ${customerByNum(30).fullName} within 30 minutes.`,
    'KYC tier breach: the Tier 2 daily limit of ₦200,000 was significantly exceeded.',
  ],
  narrative: (c, t) => `${c.fullName}, a Tier 2 account holder, reactivated a dormant account after 18 months. A single credit of ${ngn(sum(t, 'Credit'))} was received and, within 30 minutes, disbursed to three other customers of the bank (${[20, 26, 30].map((n) => customerByNum(n).ref).join(', ')}), leaving a residual balance. This fan-out pattern combined with the tier breach suggests pass-through use of the account.`,
});

// 5 — Cross-border wire to a high-risk jurisdiction.
addAlert({
  num: 5, ruleId: 'R-016', status: 'Open', risk: 'Medium', hours: 50, legacyType: 'Threshold Breach',
  txs: (_id, c) => [
    addTx(c.num, at(5, 11), 'Credit', 10_000_000, 'NIP / Various / Onitsha', 'Online Banking', { flagReason: 'Aggregation' }),
    addTx(c.num, at(4, 14), 'Credit', 8_000_000, 'NIP / Various / Victoria Island', 'Online Banking', { flagReason: 'Aggregation' }),
    addTx(c.num, hoursAgo(51), 'Debit', 15_000_000, 'SWIFT / Mock Trading FZE / UAE', 'Online Banking', { flagReason: 'High-risk jurisdiction' }),
  ],
  description: () => 'Outbound SWIFT transfer to a UAE-based trading entity flagged under high-risk jurisdiction monitoring.',
  flags: () => [
    'Aggregation before wire: multiple domestic credits gathered before a single international outflow.',
    'Trade-based ML indicator: import/export occupation with an opaque beneficiary description.',
  ],
  narrative: (c, t) => `${c.fullName}, an import/export trader, sent ${ngn(sum(t, 'Debit'))} by SWIFT to Mock Trading FZE (UAE) after receiving ${ngn(sum(t, 'Credit'))} in domestic credits over three days. The aggregation-before-outflow pattern and opaque beneficiary warrant enhanced due diligence.`,
});

// 6 — IMTO cash smurfing.
addAlert({
  num: 6, ruleId: 'R-009', status: 'Open', risk: 'Critical', hours: 4, legacyType: 'Structuring', alertType: 'IMTO_CASH_SMURFING',
  txs: (_id, c) => [
    ['Lagos — Ikeja', 0], ['Lagos — Surulere', 1], ['Abuja — Wuse', 2], ['Port Harcourt — GRA', 3], ['Lagos — Ikeja', 0], ['Lagos — Surulere', 1],
  ].map(([loc, op], i) => addTx(c.num, hoursAgo(23 - i * 3.6), 'Credit', 284_400, `${IMTO_OPERATORS[op as number]} / Sender: J. Dummolade (UK)`, 'IMTO Cash Payout', {
    agentLocation: loc as string, imtoOperator: IMTO_OPERATORS[op as number], transferDirection: 'INBOUND', settlementCurrency: 'NGN', flagReason: 'Below $200 per pickup',
  })),
  description: () => 'Beneficiary received 6 cash payouts across 4 IMTO operators in 3 cities within 19 hours, cumulatively breaching the $200 CBN cash payout threshold.',
  flags: (c) => [
    `Identity match across operators: the same NIN (${c.nin}) collected cash at 4 IMTO operators in 19 hours.`,
    'Threshold evasion: each pickup was structured just below $200 (₦284,400 ≈ $180).',
    'Geographic velocity: Lagos → Abuja → Port Harcourt → Lagos in 19 hours is physically implausible.',
  ],
  narrative: (c, t) => `The beneficiary, ${c.fullName} (NIN ${c.nin}), received six IMTO cash payouts within 24 hours across four operators (${IMTO_OPERATORS.join(', ')}) in Lagos, Abuja and Port Harcourt. Each pickup was ₦284,400 (≈ $180), below the $200 per-transaction threshold; the cumulative ${ngn(sum(t))} (≈ $1,080) is a 540% breach of the single-identity cash cap. Recommend blocking further pickups for this identity and NFIU escalation.`,
  extra: (c, t) => ({
    imto: {
      senderCountry: 'UK', beneficiaryName: c.fullName, beneficiaryPhone: c.phone, beneficiaryNIN: c.nin,
      cashPickupCount: t.length, totalCashNGN: sum(t), usdEquivalent: 1080,
      agentLocations: ['Lagos — Ikeja', 'Lagos — Surulere', 'Abuja — Wuse', 'Port Harcourt — GRA'], triggerThreshold: '$200 USD equivalent',
    },
  }),
});

// 7 — IMTO outbound violation on a settlement account.
addAlert({
  num: 38, ruleId: 'R-010', status: 'Open', risk: 'Critical', hours: 1, legacyType: 'Threshold Breach', alertType: 'IMTO_OUTBOUND_VIOLATION',
  txs: (_id, c) => [
    addTx(c.num, hoursAgo(2.2), 'Credit', 4_800_000, 'KinSwift Ltd (UK) / Corridor Settlement', 'IMTO Cash Payout', { imtoOperator: 'KinSwift', agentLocation: 'Lagos — Victoria Island', transferDirection: 'INBOUND', settlementCurrency: 'NGN' }),
    addTx(c.num, hoursAgo(1), 'Debit', 4_200_000, 'KinSwift / Outbound Remit to UK', 'IMTO Cash Payout', { imtoOperator: 'KinSwift', agentLocation: 'Lagos — Victoria Island', transferDirection: 'OUTBOUND', settlementCurrency: 'NGN', flagReason: 'Outbound on IMTO account' }),
  ],
  description: () => 'A transaction on a Nigerian IMTO settlement account was booked OUTBOUND. Nigerian IMTO licences are inbound-only.',
  flags: () => [
    'Direction violation: debit booked as OUTBOUND on an IMTO settlement account.',
    'Rapid turnaround: the outbound was booked 73 minutes after the inbound settlement credit.',
  ],
  narrative: (c, t) => `On the settlement account of ${c.fullName} (NUBAN ${c.nuban}), a debit of ${ngn(sum(t, 'Debit'))} was booked with direction OUTBOUND 73 minutes after an inbound settlement of ${ngn(sum(t, 'Credit'))} through the same operator. Nigerian IMTO licences are restricted to inbound flows. Recommend immediate case freeze and dual sign-off escalation.`,
  extra: (c) => ({
    requiresSupervisorApproval: true,
    imto: { senderCountry: 'UK', beneficiaryName: c.fullName, beneficiaryPhone: c.phone, cashPickupCount: 0, totalCashNGN: 0, usdEquivalent: 0, agentLocations: ['Lagos — Victoria Island'], triggerThreshold: 'Any OUTBOUND direction (CBN IMTO Guidelines §4.2)' },
  }),
});

// 8 — IMTO non-Naira settlement.
addAlert({
  num: 7, ruleId: 'R-011', status: 'Open', risk: 'Critical', hours: 3, legacyType: 'Threshold Breach', alertType: 'IMTO_FX_SETTLEMENT_VIOLATION',
  txs: (_id, c) => [addTx(c.num, hoursAgo(3.2), 'Credit', 3_160_000, 'RemitNova / Sender: T. Seedaku (US)', 'IMTO Cash Payout', { imtoOperator: 'RemitNova', agentLocation: 'Lagos — Lekki Phase 1', transferDirection: 'INBOUND', settlementCurrency: 'USD', flagReason: 'Settled in USD' })],
  description: () => 'IMTO cash payout executed in USD. All IMTO payouts on Nigerian soil must settle in Naira.',
  flags: () => [
    'Currency violation: payout settled in USD ($2,000) on Nigerian soil.',
    'KYC weakness: beneficiary verified only to walk-in Tier 2 equivalent.',
  ],
  narrative: (c) => `${c.fullName} (NIN ${c.nin}) collected an IMTO remittance at a Lekki RemitNova agent recorded with settlement currency USD and a cash disbursement of $2,000. Naira-only settlement is mandatory; recommend suspension of the agent and escalation to the Chief Compliance Officer.`,
  extra: (c) => ({
    requiresSupervisorApproval: true,
    imto: { senderCountry: 'US', beneficiaryName: c.fullName, beneficiaryPhone: c.phone, beneficiaryNIN: c.nin, cashPickupCount: 1, totalCashNGN: 3_160_000, usdEquivalent: 2000, agentLocations: ['Lagos — Lekki Phase 1'], triggerThreshold: 'Settlement currency ≠ NGN (CBN Circular BSD/DIR/PUB/LAB/019/002)' },
  }),
});

// 9 — IMTO → BDC round trip.
addAlert({
  num: 39, ruleId: 'R-012', status: 'Under Review', risk: 'Critical', hours: 17, legacyType: 'Round-Tripping', alertType: 'IMTO_ROUNDTRIP_SUSPECTED',
  txs: (_id, c) => [
    addTx(c.num, hoursAgo(18.6), 'Credit', 6_320_000, 'BridgeSend Ltd (UK) / Corridor Settlement', 'IMTO Cash Payout', { imtoOperator: 'BridgeSend', agentLocation: 'Lagos — Lagos Island', transferDirection: 'INBOUND', settlementCurrency: 'NGN' }),
    addTx(c.num, hoursAgo(17), 'Debit', 6_250_000, 'Crownpoint BDC Ltd (fictional)', 'Mobile Transfer', { transferDirection: 'OUTBOUND', settlementCurrency: 'NGN', isBDCPayout: true, flagReason: 'BDC within 48h' }),
  ],
  description: () => 'IMTO settlement account debited a Bureau de Change within 48 hours of an inbound remittance credit.',
  flags: () => ['Round-trip pattern: 98.9% of the inbound remittance went to a BDC 1h 37m after receipt.', 'Velocity: far below the 48-hour review window.'],
  narrative: (c, t) => `${c.fullName} (NUBAN ${c.nuban}) received ${ngn(sum(t, 'Credit'))} from BridgeSend's UK corridor and, 1 hour 37 minutes later, debited ${ngn(sum(t, 'Debit'))} to Crownpoint BDC Ltd. The rapid near-full-value recycle through a BDC is a textbook FX-arbitrage round trip.`,
  extra: (_c, t) => ({ bdcRoundTrip: { bdcEntityName: 'Crownpoint BDC Ltd (fictional)', remittanceTxId: t[0].id, bdcTxId: t[1].id, remittanceAmountNGN: t[0].amountNGN, timeGapMinutes: 97 } }),
});

// 10 — Cross-border flag from an overseas IMTO compliance team.
addAlert({
  num: 8, ruleId: 'R-020', status: 'Open', risk: 'Critical', hours: 0.5, legacyType: 'Sanctions Hit', alertType: 'CROSS_BORDER_FLAG',
  txs: (_id, c) => [addTx(c.num, hoursAgo(20), 'Credit', 1_185_000, 'Diasporix / Sender: card-funded (UK)', 'IMTO Cash Payout', { imtoOperator: 'Diasporix', agentLocation: 'Lagos — Ikoyi', transferDirection: 'INBOUND', settlementCurrency: 'NGN', flagReason: 'Overseas stolen-card flag' })],
  description: () => 'The overseas IMTO compliance team flagged this remittance as funded by a stolen card before the cash was collected in Nigeria. The 24-hour clock started at the overseas flag.',
  flags: () => ['Overseas flag: source card reported stolen 6h before funding.', 'Speed of pickup: cash collected within 47 minutes of settlement.'],
  narrative: (c) => `[CROSS-BORDER PRE-DRAFT — completed by overseas referral]\n\nDiasporix UK FinCrime Operations issued cross-border flag DX-UK-DEMO-0008 against the remittance collected in Nigeria by ${c.fullName} (NIN ${c.nin}). The funding card was reported stolen about six hours before funding.\n\n[ANALYST TO COMPLETE]\n• Nigerian transaction reference and agent till record\n• CCTV preservation\n• Beneficiary EDD outcome\n• Recommended NFIU disposition\n`,
  extra: () => ({
    requiresSupervisorApproval: true,
    crossBorder: { originatingCountry: 'UK', overseasReferenceId: 'DX-UK-DEMO-0008', overseasFlaggedAt: hoursAgo(21), overseasFlagReason: 'Stolen card', overseasFlaggedBy: 'Sample Officer · Diasporix UK FinCrime Ops (fictional)' },
  }),
});

// 11 — IMTO settlement account commingling (credit from customer 33).
addAlert({
  num: 40, ruleId: 'R-014', status: 'Open', risk: 'Critical', hours: 4, legacyType: 'Threshold Breach', alertType: 'IMTO_ACCOUNT_COMMINGLING',
  txs: (_id, c) => {
    addTx(33, hoursAgo(4.1), 'Debit', 4_250_000, `Transfer to ${toName(40)}`, 'Mobile Transfer', { linkedNum: 40 });
    return [
      addTx(c.num, hoursAgo(4), 'Credit', 4_250_000, `${customerByNum(33).fullName} (UNAPPROVED)`, 'Mobile Transfer', { linkedNum: 33, flagReason: 'Unapproved source' }),
      addTx(c.num, hoursAgo(6.5), 'Credit', 1_280_000, 'Diasporix Ltd (UK)', 'Online Banking'),
      addTx(c.num, hoursAgo(8), 'Credit', 940_000, 'Diasporix Inc (US)', 'Online Banking'),
    ];
  },
  description: (c) => `Tagged IMTO settlement account ${c.nuban} (Diasporix) received a credit from ${customerByNum(33).fullName} — not an approved correspondent. Commingling operating funds with remittance settlement breaches the May 2026 CBN Circular.`,
  flags: () => [`Source entity ${customerByNum(33).fullName} is a domestic retailer, incompatible with an inbound-only settlement licence.`, 'Credit value exceeds typical single-corridor settlement size.'],
  narrative: (c) => `IMTO settlement account NUBAN ${c.nuban} held at ${DEMO_INSTITUTION.shortName} for Diasporix received ₦4,250,000 from ${customerByNum(33).fullName} (${customerByNum(33).ref}), which is not an approved correspondent. Recommend freezing the credit pending source-of-funds documentation and notifying the bank's compliance officer.`,
  extra: (c) => ({
    requiresSupervisorApproval: true,
    commingling: { settlementAccountNuban: c.nuban, imtoName: 'Diasporix', cbnLicenceNumber: 'CBN/IMTO/DEMO/0040', partnerBank: DEMO_INSTITUTION.shortName, partnerBankCO: 'Amaka Sampleyi (MLRO)', sourceEntity: customerByNum(33).fullName, amountNGN: 4_250_000, creditedAt: hoursAgo(4) },
  }),
});

// 12 — Phantom payroll from the foreign business.
const PP_FIRST = ['Adekunle', 'Chioma', 'Emeka', 'Fatima', 'Ibrahim', 'Ngozi', 'Olumide', 'Aisha', 'Tunde', 'Blessing', 'Yemi', 'Obinna', 'Zainab'];
const PP_LAST = ['Payrollson', 'Mockwage', 'Samplepay', 'Fictisalary'];
const PP_BANKS = ['Savannah Commercial Bank', 'Lagoon Trust Bank', 'Niger Delta Sample Bank', 'Sahel Mock Bank', 'Atlantic Demo Bank', 'Plateau Placeholder Bank', 'Delta Fiction Bank', 'Kano Sample Bank'];
const ppRecipients: PhantomPayrollRecipient[] = Array.from({ length: 52 }, (_, i) => ({
  id: `pp-r-${i + 1}`,
  name: `${PP_FIRST[i % PP_FIRST.length]} ${PP_LAST[i % PP_LAST.length]}`,
  bank: PP_BANKS[i % PP_BANKS.length],
  amountNGN: Math.round(395_000 * (1 + Math.sin(i * 9.3) * 0.025)),
  kycTier: 'Tier 1',
  hasPriorHistory: i % 7 === 0,
}));
addAlert({
  num: 36, ruleId: 'R-013', status: 'Open', risk: 'Critical', hours: 1, legacyType: 'Structuring', alertType: 'B2P_PHANTOM_PAYROLL_PATTERN',
  txs: (_id, c) => [
    addTx(c.num, hoursAgo(72), 'Credit', 21_000_000, 'Demovale Energy Services Ltd / UK Corridor', 'Online Banking', { transferDirection: 'INBOUND', settlementCurrency: 'NGN' }),
    ...[0, 16, 33, 51].map((r, i) => addTx(c.num, hoursAgo(70 - i * 22), 'Debit', ppRecipients[r].amountNGN, `Payroll #${pad(r + 1, 3)} / ${ppRecipients[r].name} (${ppRecipients[r].bank})`, 'Mobile Transfer', { transferDirection: 'OUTBOUND', settlementCurrency: 'NGN', flagReason: 'Uniform payroll amount' })),
  ],
  description: (c) => `Foreign business "${c.fullName}" executed 52 near-identical remittances to 52 Tier 1 recipients across 8 banks within 71 hours — phantom-payroll typology.`,
  flags: () => ['Burst velocity: 52 outbound remittances in 71h.', 'Amount uniformity: all within ±5% of ₦395,000.', 'KYC weakness: 100% of recipients are Tier 1.', 'Bank fan-out: disbursements span 8 banks.'],
  narrative: (c) => `${c.fullName} (${c.foreignKYB?.companyRegistrationNumber}), declared purpose "Payroll", executed 52 outbound disbursements from NUBAN ${c.nuban} within 71 hours, each ₦395,000 ± 5%, to Tier 1 recipients across 8 banks, most with no prior relationship. Recommend freezing the settlement account, EDD on the foreign parent, and recipient profiling.`,
  extra: (c) => {
    const ctx: PhantomPayrollContext = {
      senderEntityName: c.fullName, senderCountry: 'United Kingdom', senderCRN: c.foreignKYB!.companyRegistrationNumber, windowHours: 71,
      totalRemittances: 52, uniformAmountNGN: 395_000, amountVariancePct: 5, pctTier1Recipients: 100,
      pctNoPriorHistory: Math.round((ppRecipients.filter((r) => !r.hasPriorHistory).length / 52) * 100), uniqueBanks: 8, recipients: ppRecipients,
    };
    return { requiresSupervisorApproval: true, phantomPayroll: ctx };
  },
});

// 13–25 — Standard rule hits.
addAlert({
  num: 9, ruleId: 'R-003', status: 'Open', risk: 'High', hours: 6, legacyType: 'Structuring',
  txs: (_id, c) => [
    addTx(c.num, hoursAgo(7), 'Credit', 950_000, 'NIP / Unknown sender / Onitsha', 'Online Banking', { flagReason: 'Layering source' }),
    ...[12, 28, 29, 24, 25].map((n, i) => addTx(c.num, hoursAgo(6.8 - i * 0.2), 'Debit', 180_000, `Transfer to ${toName(n)}`, 'USSD', { linkedNum: n, flagReason: 'USSD layering' })),
  ],
  description: () => 'Single inbound credit dispersed through five USSD transfers in one hour.',
  flags: () => ['Channel concentration: 100% of outflows via USSD.', 'Uniform amounts: five transfers of ₦180,000.'],
  narrative: (c, t) => `${c.fullName} received ${ngn(sum(t, 'Credit'))} and dispersed ${ngn(sum(t, 'Debit'))} in five equal USSD transfers within an hour to other customers of the bank. The uniform, channel-concentrated outflow is consistent with layering.`,
});
addAlert({
  num: 10, ruleId: 'R-017', status: 'Escalated', risk: 'High', hours: 72, legacyType: 'Structuring',
  txs: (_id, c) => [4_900_000, 4_800_000, 4_850_000, 4_700_000].map((a, i) => addTx(c.num, at(6 - i, 10 + i), 'Credit', a, 'Self — Branch Cash Deposit', 'Cash Deposit', { flagReason: 'Just below ₦5M' })),
  description: () => 'Four cash deposits in four days, each just below the ₦5,000,000 CTR threshold.',
  flags: () => ['Threshold avoidance: every deposit between ₦4.7M and ₦4.9M.', 'Repetition: same branch, same teller window, consecutive days.'],
  narrative: (c, t) => `${c.fullName} made four branch cash deposits totalling ${ngn(sum(t))} over four consecutive days, each between ₦4,700,000 and ₦4,900,000 — just below the ₦5,000,000 CTR threshold. The account was frozen and an STR filed with the NFIU.`,
});
addAlert({
  num: 11, ruleId: 'R-008', status: 'Under Review', risk: 'High', hours: 30, legacyType: 'PEP Match',
  txs: (_id, c) => [
    addTx(c.num, hoursAgo(40), 'Credit', 12_000_000, 'Sample State Contractors Ltd (fictional)', 'Online Banking', { flagReason: 'PEP inflow' }),
    addTx(c.num, hoursAgo(31), 'Debit', 9_500_000, 'Demo Luxury Motors Ltd', 'Online Banking', { flagReason: 'Luxury spend' }),
  ],
  description: () => 'Politically exposed customer received a large contractor payment followed by luxury spending.',
  flags: () => ['PEP: former local government chair.', 'Source of funds: payment from a state contractor.'],
  narrative: (c, t) => `${c.fullName}, a politically exposed person, received ${ngn(sum(t, 'Credit'))} from a state contractor and spent ${ngn(sum(t, 'Debit'))} on a luxury vehicle within nine hours. Source-of-wealth documentation has been requested.`,
});
addAlert({
  num: 12, ruleId: 'R-018', status: 'Escalated', risk: 'Medium', hours: 96, legacyType: 'Velocity Spike',
  txs: (_id, c) => Array.from({ length: 8 }, (_, i) => addTx(c.num, hoursAgo(98 - i * 0.25), i % 2 ? 'Debit' : 'Credit', 120_000 + i * 18_000, i % 2 ? `Transfer to ${toName(19)}` : 'NIP / Rotating senders', 'Mobile Transfer', { linkedNum: i % 2 ? 19 : undefined, flagReason: 'Velocity' })),
  description: () => 'Eight in-and-out transfers within two hours, eleven times the customer’s usual daily count.',
  flags: () => ['Velocity: 8 transfers in 2 hours.', 'Pass-through: balance returned to baseline after each cycle.'],
  narrative: (c, t) => `${c.fullName}'s account processed ${t.length} transfers totalling ${ngn(sum(t))} in two hours, with each credit leaving within minutes. An STR has been filed.`,
});
addAlert({
  num: 13, ruleId: 'R-019', status: 'Escalated', risk: 'Critical', hours: 48, legacyType: 'Sanctions Hit',
  txs: (_id, c) => [addTx(c.num, hoursAgo(49), 'Debit', 7_500_000, 'Fictional Textile Trading Co. (listed jurisdiction)', 'Online Banking', { flagReason: 'Watchlist counterparty' })],
  description: () => 'Outbound payment to a counterparty on a sanctions watchlist; customer also has a strong name match.',
  flags: () => ['Watchlist: counterparty listed on the sample OFAC list.', 'Name match: customer scored 92% against a listed individual.'],
  narrative: (c, t) => `${c.fullName} paid ${ngn(sum(t))} to a counterparty on the sample OFAC list, and the customer has a 92% name match against a listed individual. The account was frozen and the case escalated to the NFIU.`,
});
addAlert({
  num: 14, ruleId: 'R-004', status: 'Dismissed', risk: 'Low', hours: 150, legacyType: 'Threshold Breach',
  txs: (_id, c) => [addTx(c.num, hoursAgo(152), 'Credit', 1_200_000, 'Demo Pension Fund Administrator', 'Online Banking', { flagReason: 'Dormant reactivation' })],
  description: () => 'Dormant account reactivated by a single large credit.',
  flags: () => ['Dormancy: 14 months without activity.'],
  narrative: (c) => `${c.fullName}'s dormant account received a pension lump sum. Dismissed: the source was verified as a licensed pension administrator.`,
});
addAlert({
  num: 15, ruleId: 'R-021', status: 'Under Review', risk: 'Medium', hours: 20, legacyType: 'Velocity Spike',
  txs: (_id, c) => [
    ...Array.from({ length: 6 }, (_, i) => addTx(c.num, hoursAgo(30 - i), 'Credit', 310_000 + i * 9_000, `POS float / CashNest / ${AREAS[i]}`, 'POS', { flagReason: 'Float cycling' })),
    addTx(c.num, hoursAgo(22), 'Debit', 1_400_000, `Transfer to ${toName(1)}`, 'Mobile Transfer', { linkedNum: 1, flagReason: 'Float to related account' }),
  ],
  description: () => 'POS agent float cycled through six terminals and transferred to a customer under investigation.',
  flags: () => [`Linked account: float sent to ${customerByNum(1).fullName}, subject of an open POS round-trip case.`, 'Shared device with that customer.'],
  narrative: (c, t) => `${c.fullName}, a POS agent operator, received ${ngn(sum(t, 'Credit'))} of float across six terminals and transferred ${ngn(sum(t, 'Debit'))} to ${toName(1)}, who is the subject of an open POS round-trip case.`,
});
addAlert({
  num: 16, ruleId: 'R-006', status: 'Open', risk: 'Medium', hours: 9, legacyType: 'Structuring',
  txs: (_id, c) => [
    addTx(c.num, hoursAgo(14), 'Credit', 420_000, 'Sample Payroll Ltd / Salary', 'Online Banking', { flagReason: 'Multiple employers' }),
    addTx(c.num, hoursAgo(12), 'Credit', 415_000, 'Mockwork Staffing / Salary', 'Online Banking', { flagReason: 'Multiple employers' }),
    addTx(c.num, hoursAgo(10), 'Credit', 418_000, 'Placeholder Logistics / Salary', 'Online Banking', { flagReason: 'Multiple employers' }),
    addTx(c.num, hoursAgo(9.5), 'Debit', 1_200_000, `Transfer to ${toName(17)}`, 'Mobile Transfer', { linkedNum: 17, flagReason: 'Immediate onward transfer' }),
  ],
  description: () => 'Three "salary" credits from different employers in one day, forwarded immediately to another customer.',
  flags: () => ['Multiple employers: three payroll credits from unrelated companies.', `Onward transfer to ${customerByNum(17).fullName} (crypto P2P case).`],
  narrative: (c, t) => `${c.fullName} received three salary-labelled credits totalling ${ngn(sum(t, 'Credit'))} from unrelated employers and forwarded ${ngn(sum(t, 'Debit'))} to ${toName(17)} within 30 minutes — a salary-mule pattern.`,
});
addAlert({
  num: 17, ruleId: 'R-005', status: 'Escalated', risk: 'High', hours: 120, legacyType: 'Velocity Spike',
  txs: (_id, c) => [
    ...Array.from({ length: 6 }, (_, i) => addTx(c.num, hoursAgo(130 - i * 1.5), 'Credit', 480_000 + i * 35_000, `P2P buyer #${pad(i + 1, 2)} (fictional)`, 'Mobile Transfer', { flagReason: 'P2P inflow' })),
    addTx(c.num, hoursAgo(121), 'Debit', 3_100_000, 'Fictional Crypto Exchange Wallet', 'Online Banking', { flagReason: 'Crypto off-ramp' }),
  ],
  description: () => 'Repeated P2P inflows from unrelated individuals followed by a single transfer to a crypto exchange wallet.',
  flags: () => ['Counterparty novelty: six first-time senders.', 'Off-ramp: aggregated funds sent to a crypto exchange.'],
  narrative: (c, t) => `${c.fullName} received ${ngn(sum(t, 'Credit'))} from six unrelated P2P buyers and sent ${ngn(sum(t, 'Debit'))} to a crypto exchange wallet. Escalated to the NFIU.`,
});
addAlert({
  num: 18, ruleId: 'R-022', status: 'Under Review', risk: 'Medium', hours: 44, legacyType: 'Round-Tripping',
  txs: (_id, c) => [
    addTx(c.num, hoursAgo(60), 'Debit', 8_000_000, `Transfer to ${toName(34)}`, 'Online Banking', { linkedNum: 34, flagReason: 'Related party' }),
    addTx(c.num, hoursAgo(45), 'Credit', 7_900_000, `${toName(34)} — "refund"`, 'Online Banking', { linkedNum: 34, flagReason: 'Round trip' }),
  ],
  description: () => 'Funds sent to a related company and returned as a "refund" within 15 hours.',
  flags: () => [`Related party: customer is a shareholder of ${customerByNum(34).fullName}.`, 'Round trip: 98.8% of value returned.'],
  narrative: (c, t) => `${c.fullName} transferred ${ngn(sum(t, 'Debit'))} to ${toName(34)}, a company in which she is a shareholder, and received ${ngn(sum(t, 'Credit'))} back as a refund 15 hours later.`,
});
addAlert({
  num: 19, ruleId: 'R-002', status: 'Dismissed', risk: 'Low', hours: 168, legacyType: 'Threshold Breach',
  txs: (_id, c) => [addTx(c.num, hoursAgo(170), 'Credit', 120_000, 'Family support — Sample Loremade', 'Mobile Transfer', { flagReason: 'Tier 1 limit' })],
  description: () => 'Tier 1 daily limit exceeded by a single family transfer.',
  flags: () => ['Tier 1 limit exceeded once.'],
  narrative: (c) => `${c.fullName} received a one-off family transfer above the Tier 1 limit. Dismissed after confirming the sender relationship; customer advised to upgrade to Tier 2.`,
});
addAlert({
  num: 20, ruleId: 'R-003', status: 'Open', risk: 'Medium', hours: 10, legacyType: 'Structuring',
  txs: (_id, c) => Array.from({ length: 7 }, (_, i) => addTx(c.num, hoursAgo(16 - i * 0.8), 'Credit', 30_000 + i * 2_500, `USSD / Sender ${pad(i + 1, 2)} (fictional)`, 'USSD', { flagReason: 'Fan-in' })),
  description: () => 'Seven USSD credits from different senders within six hours on a Tier 1 account.',
  flags: () => ['Fan-in: seven unrelated senders.', 'Tier 1 cumulative limit exceeded.'],
  narrative: (c, t) => `${c.fullName}'s Tier 1 account received ${t.length} USSD credits totalling ${ngn(sum(t))} from seven unrelated senders within six hours.`,
});
addAlert({
  num: 21, ruleId: 'R-023', status: 'Under Review', risk: 'High', hours: 24, legacyType: 'PEP Match',
  txs: (_id, c) => [addTx(c.num, hoursAgo(26), 'Credit', 25_000_000, `${toName(34)} — commission`, 'Online Banking', { linkedNum: 34, flagReason: 'Adverse media subject' })],
  description: () => 'Large commission inflow to a customer named in adverse media coverage about property fraud.',
  flags: () => ['Adverse media: named in a fictional news report on property fraud.', `Counterparty: ${customerByNum(34).fullName}, under KYB review.`],
  narrative: (c, t) => `${c.fullName}, named in adverse media about property fraud, received ${ngn(sum(t))} labelled as commission from ${toName(34)}, a company currently under KYB review.`,
});

/* ── CTR cash deposits ───────────────────────────────── */

interface CtrSpec { num: number; day: number; amounts: number[]; filed?: string }
const CTR_SPECS: CtrSpec[] = [
  { num: 22, day: 0, amounts: [2_150_000, 1_980_000, 2_400_000] },
  { num: 23, day: 1, amounts: [3_100_000, 2_750_000] },
  { num: 24, day: 3, amounts: [1_900_000, 2_200_000, 1_850_000] },
  { num: 25, day: 4, amounts: [2_600_000, 2_900_000] },
  { num: 23, day: 10, amounts: [2_800_000, 3_050_000], filed: 'CTR-2026-0001' },
  { num: 29, day: 14, amounts: [2_500_000, 2_700_000], filed: 'CTR-2026-0002' },
];
const ctrTx = CTR_SPECS.map((s) => s.amounts.map((a, i) => addTx(
  s.num,
  s.day === 0 ? hoursAgo(6 - i * 1.5) : at(s.day, 9 + i * 2),
  'Credit', a, i === 0 ? 'Branch cash deposit' : 'Branch cash deposit (teller 2)', 'Cash Deposit', { flagReason: 'CTR aggregation' },
)));

/* ── Background activity up to 600 transactions ──────── */

const MERCHANTS = ['Sample Mart', 'Demo Fuel Station', 'Placeholder Pharmacy', 'Mock Telecom Airtime', 'Lorem Electricity Prepaid', 'Ipsum Foods', 'Fiction Supermarket', 'Sample School Fees', 'Demo Transport Card'];
const SENDERS = ['NIP / Family transfer', 'NIP / Customer payment', 'NIP / Invoice settlement', 'Salary credit', 'NIP / Rent refund'];
const TARGET = 600;
const remaining = TARGET - txns.length;
const weights = SEED_CUSTOMERS.map((c) => (c.entityType === 'IMTO Agent' ? 3 : c.entityType === 'Nigerian Business' || c.entityType === 'Foreign Business' ? 2 : 1));
const totalWeight = weights.reduce((a, b) => a + b, 0);
const counts = weights.map((w) => Math.floor((remaining * w) / totalWeight));
let leftover = remaining - counts.reduce((a, b) => a + b, 0);
for (let i = 0; leftover > 0; i = (i + 1) % counts.length, leftover--) counts[i]++;

SEED_CUSTOMERS.forEach((c, idx) => {
  for (let i = 0; i < counts[idx]; i++) {
    const day = rand.int(1, 60);
    const hour = rand.int(7, 21);
    const date = at(day, hour, rand.int(0, 59));
    if (c.entityType === 'IMTO Agent') {
      const op = c.imtoOperator!;
      const correspondent = rand.pick([`${op} Ltd (UK)`, `${op} Inc (US)`, `${op} Canada Inc`]);
      const unapproved = c.num === 40 && i % 9 === 4;
      addTx(c.num, date, 'Credit', rand.int(16, 64) * 50_000, unapproved ? 'Sunset Sample Trading Ltd (UNAPPROVED)' : correspondent, 'Online Banking', { transferDirection: 'INBOUND', settlementCurrency: 'NGN', flagReason: unapproved ? 'Unapproved source' : undefined });
      continue;
    }
    if (c.entityType === 'Nigerian Business' || c.entityType === 'Foreign Business') {
      const payee = rand.int(1, 30);
      const isPayroll = i % 3 === 0;
      if (isPayroll) addTx(c.num, date, 'Debit', rand.int(8, 40) * 25_000, `Transfer to ${toName(payee)}`, 'Online Banking', { linkedNum: payee });
      else addTx(c.num, date, rand.chance(0.55) ? 'Credit' : 'Debit', rand.int(10, 160) * 50_000, rand.pick(['Supplier — Sample Wholesale Ltd', 'Customer — Demo Distributors', 'FIRS (sample) tax remittance', 'Landlord — Lorem Estates']), rand.pick(['Online Banking', 'Mobile Transfer'] as TxChannel[]));
      continue;
    }
    const scale = c.kycTier === 'Tier 1' ? 1_000 : c.kycTier === 'Tier 2' ? 4_000 : c.entityType === 'Sole Trader' ? 25_000 : 12_000;
    const channel = rand.pick(['POS', 'USSD', 'Mobile Transfer', 'ATM Withdrawal', 'Online Banking', 'Card Payment'] as TxChannel[]);
    const peer = rand.chance(0.15) ? rand.int(1, 30) : undefined;
    if (peer && peer !== c.num) {
      addTx(c.num, date, 'Debit', rand.int(2, 30) * scale, `Transfer to ${toName(peer)}`, 'Mobile Transfer', { linkedNum: peer });
    } else if (rand.chance(0.45)) {
      addTx(c.num, date, 'Credit', rand.int(5, 45) * scale, rand.pick(SENDERS), channel === 'POS' || channel === 'Card Payment' ? 'Mobile Transfer' : channel);
    } else {
      addTx(c.num, date, 'Debit', rand.int(1, 20) * scale, channel === 'ATM Withdrawal' ? `ATM / ${c.city}` : rand.pick(MERCHANTS), channel);
    }
  }
});

// Running balances per customer, with an opening balance that never lets the account go negative.
export const openingBase = (c: SeedCustomer) => (c.entityType === 'IMTO Agent' ? 8_000_000 : c.kycTier === 'Tier 1' ? 15_000 : c.kycTier === 'Tier 2' ? 250_000 : 1_500_000);
for (const c of SEED_CUSTOMERS) {
  const mine = txns.filter((t) => t.customerNum === c.num).sort((a, b) => a.date.localeCompare(b.date));
  let running = 0;
  let lowest = 0;
  for (const t of mine) { running += t.type === 'Credit' ? t.amountNGN : -t.amountNGN; lowest = Math.min(lowest, running); }
  let balance = openingBase(c) - lowest;
  for (const t of mine) { balance += t.type === 'Credit' ? t.amountNGN : -t.amountNGN; t.balanceAfter = balance; }
}

txns.sort((a, b) => b.date.localeCompare(a.date));
for (const a of alerts) {
  a.transactions = txns.filter((t) => t.alertId === a.id).map(({ customerNum: _n, alertId: _a, flagReason: _f, linkedNum: _l, ...t }) => t);
}
alerts.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
// The guided tour's case is always first in every list.
const guidedIndex = alerts.findIndex((a) => a.customerNum === 1);
alerts.unshift(...alerts.splice(guidedIndex, 1));

export const SEED_TRANSACTIONS: SeedTx[] = txns;
export const SEED_ALERTS: SeedAlert[] = alerts;
export const GUIDED_CASE = (() => {
  const a = alerts[0];
  const c = customerByNum(1);
  const pos = txns.filter((t) => t.alertId === a.id && t.channel === 'POS');
  return { alertId: a.id, customerNum: 1, name: c.fullName, firstName: c.fullName.split(' ')[0], withdrawals: pos.length, total: pos.reduce((s, t) => s + t.amountNGN, 0), agents: 12 };
})();

export const SEED_RULES: Rule[] = RULE_SPECS.map(([id, name, typology, threshold, fp, validationStatus, validatedDaysAgo, enabled]) => ({
  id, name, typology, threshold, falsePositivePct: fp, validationStatus, lastValidated: dateOnly(at(validatedDaysAgo)),
  enabled: enabled ?? true,
  alertsTriggered7d: alerts.filter((a) => a.ruleId === id && SEED_NOW - new Date(a.timestamp).getTime() <= 7 * DAY).length,
}));

/* ── CTRs and queued transactions ────────────────────── */

export const SEED_QUEUE: QueuedTransaction[] = ctrTx.flat().map((t) => ({
  transaction_id: t.id, amount: t.amountNGN, channel: 'Branch Cash', transaction_datetime: t.date,
  counterparty_account: null, narration: t.counterparty, direction: 'credit',
}));

export const SEED_CTRS: CtrRecord[] = CTR_SPECS.map((s, i) => {
  const c = customerByNum(s.num);
  const t = ctrTx[i];
  const last = t.reduce((m, x) => (x.date > m ? x.date : m), t[0].date);
  const created = s.day === 0 ? hoursAgo(1) : at(s.day, 23, 50);
  return {
    id: `demo-ctr-${i + 1}`, institution_id: DEMO_INSTITUTION.id, customer_id: c.bvn, customer_name: c.fullName,
    report_date: dateOnly(last), total_cash_ngn: t.reduce((x, y) => x + y.amountNGN, 0), transaction_count: t.length,
    transaction_ids: t.map((x) => x.id), status: s.filed ? 'filed' : 'pending_review',
    reviewed_by: null, reviewed_at: s.filed ? at(s.day - 1, 11) : null, ctr_reference: s.filed ?? null,
    filed_at: s.filed ? at(s.day - 1, 11) : null, goaml_xml: null, created_at: created, updated_at: created,
  };
});

/* ── Sanctions matches and adverse media ─────────────── */

type MatchSpec = [num: number, listed: string, list: string, score: number, fields: string[], status: SanctionsMatch['status'], aliases: string[]];
const MATCH_SPECS: MatchSpec[] = [
  [13, 'Aisha Sampleyi-Bakr', 'OFAC SDN', 92, ['name', 'nationality', 'dob'], 'Pending', ['A. S. Bakr', 'Aysha Sampley']],
  [26, 'Garba Dumolade', 'UN Consolidated', 76, ['name', 'nationality'], 'Pending', ['G. Dumolade']],
  [11, 'Halimat Testimehin', 'NFIU Domestic', 66, ['name', 'location'], 'Pending', ['Halima T.']],
  [29, 'Chukwudi Lorem-Ade', 'EU Consolidated', 61, ['name'], 'Pending', ['C. Lorem-Ade']],
  [18, 'Zaynab Placeholder', 'NFIU Domestic', 58, ['name', 'nationality'], 'Pending', []],
  [3, 'Fatimah Samply', 'OFAC SDN', 54, ['name'], 'Dismissed', ['F. Samply']],
];
export const SEED_SANCTIONS: SanctionsMatch[] = MATCH_SPECS.map(([num, listed, list, score, fields, status, aliases], i) => {
  const c = customerByNum(num);
  return {
    id: `SCR-${pad(i + 1, 3)}`, matchScore: score, status, matchingFields: fields,
    slaDeadline: new Date(SEED_NOW + (6 + i * 5) * HOUR).toISOString(),
    internal: { name: c.fullName, dob: c.dob, nationality: 'Nigerian', location: `${c.city}, Nigeria`, bvn: c.bvn, idType: 'NIN', accountNumber: c.nuban, kycTier: c.kycTier },
    sanctions: {
      name: listed, dob: i % 2 ? c.dob : '—', nationality: i === 3 ? 'Ghanaian' : 'Nigerian', location: i === 0 ? 'Fictional listed jurisdiction' : `${c.city} region`,
      list, listId: `DEMO-${list.split(' ')[0].toUpperCase()}-${pad(i + 1, 4)}`,
      reason: 'Fictional listing created for the ApexAML sample workspace.', dateAdded: dateOnly(at(200 + i * 40)), aliases,
    },
  };
});

const article = (slug: string, headline: string, risk: 'High' | 'Medium' | 'Low', days: number, relevance: number) => ({
  source: 'The Sample Herald (fictional outlet)', headline, url: `https://example.com/apexaml-demo/${slug}`,
  published_at: at(days), relevance_score: relevance, risk_level: risk, rationale: 'Fictional article for the sample workspace.',
});
export const SEED_ADVERSE_MEDIA: AdverseMediaScreening[] = [
  [21, 'High', [article('property-fraud', 'Lekki property agent questioned over sample land-allocation fraud', 'High', 12, 88), article('estate-probe', 'Estate buyers petition over unfinished sample housing scheme', 'Medium', 40, 61)]],
  [13, 'High', [article('textile-sanctions', 'Kano textile importer linked to listed trading network', 'High', 20, 91)]],
  [11, 'Medium', [article('council-contracts', 'Former council chair faces questions over contract awards', 'Medium', 60, 72)]],
  [5, 'Low', [article('port-delays', 'Apapa importers react to port clearing delays', 'Low', 15, 34)]],
].map(([num, level, results], i) => {
  const c = customerByNum(num as number);
  return {
    id: `demo-am-${i + 1}`, customer_id: c.bvn, customer_name: c.fullName, search_date: at(3 + i),
    results: results as AdverseMediaScreening['results'], overall_risk_level: level as AdverseMediaScreening['overall_risk_level'],
    screened_by: DEMO_ANALYSTS[i % DEMO_ANALYSTS.length], next_review_date: dateOnly(new Date(SEED_NOW + 85 * DAY).toISOString()),
  };
});

/* ── KYB cases ───────────────────────────────────────── */

const owner = (num: number, pct: number, role: CorporateEntity['owners'][number]['role'], extra: Partial<CorporateEntity['owners'][number]> = {}) => {
  const c = customerByNum(num);
  return { id: `ubo-${num}`, fullName: c.fullName, bvn: c.bvn, nin: c.nin, ownershipPct: pct, role, ...extra };
};
export const SEED_KYB: CorporateEntity[] = [
  { num: 31, risk: 'High', status: 'Pending', days: 11, type: 'Private Limited', turnover: '₦500m – ₦1bn', employees: '11 – 50', cac: false, owners: [owner(29, 18, 'Shareholder'), { id: 'ubo-31-n', fullName: 'Blueridge Sample Holdings (BVI)', bvn: '—', nin: '—', ownershipPct: 62, role: 'Shareholder' as const }, owner(11, 20, 'Director', { pepHit: true, pepScreened: true })] },
  { num: 32, risk: 'Medium', status: 'In Progress', days: 4, type: 'Private Limited', turnover: '₦100m – ₦500m', employees: '51 – 200', cac: true, owners: [owner(5, 55, 'UBO', { bvnVerified: true, pepScreened: true }), owner(9, 45, 'Director')] },
  { num: 33, risk: 'Low', status: 'Pending', days: 2, type: 'Business Name', turnover: 'Below ₦25m', employees: '1 – 10', cac: true, owners: [owner(22, 100, 'UBO', { bvnVerified: true, pepScreened: true })] },
  { num: 34, risk: 'High', status: 'In Progress', days: 7, type: 'Private Limited', turnover: '₦100m – ₦500m', employees: '11 – 50', cac: true, owners: [owner(21, 40, 'UBO'), owner(18, 35, 'Shareholder'), owner(11, 25, 'Director', { pepHit: true, pepScreened: true })] },
  { num: 35, risk: 'Medium', status: 'Pending', days: 5, type: 'Incorporated Trustee', turnover: '₦25m – ₦100m', employees: '11 – 50', cac: true, owners: [owner(27, 50, 'Director'), owner(28, 50, 'Director')] },
  { num: 36, risk: 'High', status: 'In Progress', days: 9, type: 'Private Limited', turnover: 'Above ₦1bn', employees: '51 – 200', cac: false, owners: [owner(18, 55, 'UBO'), owner(11, 25, 'Shareholder', { pepHit: true }), { id: 'ubo-36-n', fullName: 'Demovale Holdings (Nominee)', bvn: '—', nin: '—', ownershipPct: 20, role: 'Shareholder' as const }] },
].map((k) => {
  const c = customerByNum(k.num);
  const industry = { 31: 'Dealers in Precious Metals & Stones', 32: 'Import & Export Trading', 33: 'Retail & FMCG', 34: 'Real Estate & Property Development', 35: 'Non-Governmental Organisation', 36: 'Oil & Gas Trading' }[k.num]!;
  return {
    id: `KYB-${pad(k.num, 3)}`, companyName: c.fullName, rcNumber: c.cacNumber ?? c.foreignKYB?.companyRegistrationNumber ?? '—',
    risk: k.risk as CorporateEntity['risk'], status: k.status as CorporateEntity['status'], daysInQueue: k.days,
    registrationDate: dateOnly(at(400 + k.num * 30)), registeredAddress: c.address, businessType: k.type as CorporateEntity['businessType'],
    industry, turnoverRange: k.turnover, employees: k.employees, cacVerified: k.cac, owners: k.owners, sanctionsHit: false,
    makerSignoff: null, decision: null,
  };
});

/* ── Documents ───────────────────────────────────────── */

const BUSINESS_DOCS: KycDocumentType[] = ['CAC_CERT', 'TIN_CERT', 'MEMART', 'BOARD_RESOLUTION'];
export const SEED_DOCUMENTS: KycDocument[] = SEED_CUSTOMERS.flatMap((c) => {
  const types = c.entityType === 'Nigerian Business' || c.entityType === 'Foreign Business' ? BUSINESS_DOCS
    : c.entityType === 'IMTO Agent' ? (['CAC_CERT', 'TIN_CERT'] as KycDocumentType[]) : requiredDocsForTier(c.kycTier);
  // Every fifth customer is missing their last document so completeness varies.
  const present = c.num % 5 === 0 ? types.slice(0, -1) : types;
  return present.map((type, i) => {
    const uploaded = at(30 + ((c.num * 13 + i * 29) % 360));
    const verified = (c.num + i) % 4 !== 0;
    return {
      id: `doc-${c.num}-${type}`, customer_id: String(c.num), document_type: type,
      document_name: `${type.toLowerCase()}-${c.ref.toLowerCase()}.pdf`,
      storage_path: `${DEMO_INSTITUTION.id}/${c.num}/${type}/sample-${c.ref.toLowerCase()}.pdf`,
      file_size_bytes: 80_000 + ((c.num * 977 + i * 331) % 400_000), uploaded_by: DEMO_ANALYSTS[(c.num + i) % 4],
      uploaded_at: uploaded, kyc_tier_at_upload: c.kycTier, is_current: true, expiry_date: null,
      verified, verified_by: verified ? DEMO_ANALYSTS[(c.num + i + 1) % 4] : null, verified_at: verified ? uploaded : null,
    };
  });
});
export const documentLabel = (type: string) => DOCUMENT_LABELS[type as KycDocumentType] ?? type;

/* ── KYC verification queue ──────────────────────────── */

const KYC_QUEUE: [num: number, status: KYCStatus][] = [
  [2, 'In Review'], [6, 'Escalated'], [7, 'Escalated'], [8, 'Pending'], [9, 'Verified'], [19, 'Pending'],
  [20, 'In Review'], [26, 'Escalated'], [27, 'Verified'], [28, 'Verified'], [30, 'Pending'], [16, 'In Review'],
];
export const SEED_KYC: KYCCustomer[] = KYC_QUEUE.map(([num, status], i) => {
  const c = customerByNum(num);
  const bvnOk = c.bvnVerified;
  const ninOk = num !== 26;
  const submitted = at(i % 6, 8 + i);
  return {
    id: String(num), name: c.fullName, bvn: c.bvn, nin: c.nin,
    bvnMatch: bvnOk ? 'match' : status === 'Pending' ? 'pending' : 'mismatch',
    ninMatch: ninOk ? 'match' : 'mismatch',
    livenessCheck: c.liveness === 'Pass' ? 'pass' : c.liveness === 'Fail' ? 'fail' : 'pending',
    livenessConfidence: c.liveness === 'Pass' ? 90 + (num % 9) : c.liveness === 'Fail' ? 41 : 0,
    riskTier: c.riskLevel.toLowerCase() as KYCCustomer['riskTier'], kycTier: c.kycTier, status, submittedAt: submitted,
    bvnVerifiedAt: bvnOk ? submitted : undefined, ninVerifiedAt: ninOk ? submitted : undefined,
    bvnFailReason: bvnOk ? undefined : 'Name on BVN record does not match the application (sample).',
    ninFailReason: ninOk ? undefined : 'Date of birth mismatch against NIMC record (sample).',
    email: c.email, phone: c.phone, address: c.address,
    smileIdentityScore: c.liveness === 'Pass' ? 88 + (num % 10) : 40, nibssVerified: bvnOk,
    governmentPhotoUrl: '', selfieUrl: '',
    documents: SEED_DOCUMENTS.filter((d) => d.customer_id === String(num)).map((d) => ({ name: d.document_name, type: documentLabel(d.document_type), uploadedAt: dateOnly(d.uploaded_at) })),
  };
});

/* ── STRs ────────────────────────────────────────────── */

const STR_STATUS: Record<string, STRRecord['status']> = {};
alerts.filter((a) => a.status === 'Escalated').forEach((a, i) => { STR_STATUS[a.id] = i < 2 ? 'Submitted to NFIU' : 'Pending Review'; });
alerts.filter((a) => a.status === 'Under Review').slice(0, 2).forEach((a) => { STR_STATUS[a.id] = 'Draft'; });
export const SEED_STRS: STRRecord[] = alerts.filter((a) => STR_STATUS[a.id]).map((a, i) => ({
  id: `str-${pad(i + 1, 3)}`, reference: `STR-2026-${pad(101 + i, 5)}`, customerName: a.customerProfile.fullName, alertId: a.id,
  typology: RULE_SPECS.find((r) => r[0] === a.ruleId)![2], amount: a.transactions.reduce((s, t) => s + t.amountNGN, 0),
  analyst: DEMO_ANALYSTS[i % 4], status: STR_STATUS[a.id], filedDate: dateOnly(a.timestamp),
}));
export const SEED_NFIU_SUBMISSIONS: NFIUSubmission[] = SEED_STRS.filter((s) => s.status === 'Submitted to NFIU').map((s, i) => ({
  id: `nfiu-${i + 1}`, timestamp: at(1 + i, 15), reference: s.reference, acknowledgmentStatus: i === 0 ? 'Accepted' : 'Pending',
}));

/* ── Settlement accounts ─────────────────────────────── */

export const SEED_SETTLEMENT: ManagedAccount[] = [
  ...SEED_CUSTOMERS.filter((c) => c.entityType === 'IMTO Agent').map((c) => {
    const op = c.imtoOperator!;
    const approved = [`${op} Ltd (UK)`, `${op} Inc (US)`, `${op} Canada Inc`];
    return {
      id: `acc-${c.num}`, nuban: c.nuban, partnerBank: DEMO_INSTITUTION.shortName, isIMTOSettlement: true as const, imtoName: op,
      cbnLicenceNumber: `CBN/IMTO/DEMO/${pad(c.num, 4)}`, approvedCorrespondents: approved, activationDate: dateOnly(at(500 + c.num * 10)),
      recentCredits: txns.filter((t) => t.customerNum === c.num && t.type === 'Credit' && SEED_NOW - new Date(t.date).getTime() <= 30 * DAY)
        .map((t) => ({ id: t.id, date: t.date, sourceEntity: t.counterparty, amountNGN: t.amountNGN, approved: approved.some((a) => t.counterparty.startsWith(a)) || t.counterparty.includes('Corridor Settlement') })),
    };
  }),
  ...[31, 36, 35].map((num, i) => ({
    id: `acc-${num}`, nuban: customerByNum(num).nuban, partnerBank: DEMO_INSTITUTION.shortName, isIMTOSettlement: false as const,
    accountName: customerByNum(num).fullName, accountType: (['Corporate Operating', 'Corporate Operating', 'Trust'] as const)[i],
  })),
];

/* ── Risk score history (keyed by BVN, ending at today's score) ── */

type RiskEvent = { at: string; trigger: RiskTriggerType; delta: number; ref: string | null };
export const SEED_RISK_HISTORY: RiskScoreEntry[] = SEED_CUSTOMERS.flatMap((c) => {
  const events: RiskEvent[] = [
    { at: at(330), trigger: 'MANUAL_REVIEW', delta: 0, ref: 'Onboarding assessment' },
    ...(c.kycTier !== 'Tier 1' ? [{ at: at(200 + (c.num % 40)), trigger: 'KYC_UPGRADE' as const, delta: -3, ref: `Upgraded to ${c.kycTier}` }] : []),
    ...[150, 90].map((d) => ({ at: at(d + (c.num % 10)), trigger: 'CLEAN_PERIOD_30D' as const, delta: -2, ref: null })),
  ];
  for (const a of alerts.filter((x) => x.customerNum === c.num)) {
    events.push({ at: a.timestamp, trigger: 'ALERT_FIRED', delta: a.riskLevel === 'Critical' ? 12 : a.riskLevel === 'High' ? 8 : 4, ref: a.caseId });
    if (a.status === 'Escalated') events.push({ at: new Date(new Date(a.timestamp).getTime() + 6 * HOUR).toISOString(), trigger: 'STR_FILED', delta: 6, ref: a.caseId });
    if (a.status === 'Dismissed') events.push({ at: new Date(new Date(a.timestamp).getTime() + 5 * HOUR).toISOString(), trigger: 'ALERT_DISMISSED', delta: -5, ref: a.caseId });
  }
  if (SEED_SANCTIONS.some((m) => m.internal.bvn === c.bvn && m.status === 'Pending')) events.push({ at: at(8), trigger: 'SANCTIONS_MATCH', delta: 5, ref: 'Watchlist screening' });
  events.sort((a, b) => a.at.localeCompare(b.at));
  let score = Math.max(5, Math.min(95, c.riskScore - events.reduce((s, e) => s + e.delta, 0)));
  return events.map((e, i) => {
    const previous = i === 0 ? null : score;
    score = i === 0 ? score : Math.max(0, Math.min(100, score + e.delta));
    return {
      id: `risk-${c.num}-${i}`, customerId: c.bvn, previousScore: previous, newScore: score,
      scoreChange: previous === null ? null : score - previous, triggerType: e.trigger, triggerReference: e.ref,
      calculatedBy: 'SYSTEM', createdAt: e.at,
    };
  });
});

/* ── Audit trail ─────────────────────────────────────── */

let auditSeq = 0;
const auditRows: AuditEntry[] = [];
const audit = (timestamp: string, action: string, caseId: string, justification: string, analyst?: string) =>
  auditRows.push({ id: `seed-audit-${pad(++auditSeq, 3)}`, timestamp, action, analyst: analyst ?? DEMO_ANALYSTS[auditSeq % 4], caseId, justification, status: 'success', institutionId: DEMO_INSTITUTION.id });

for (const a of alerts) {
  const t = new Date(a.timestamp).getTime();
  if (a.status === 'Under Review') audit(new Date(t + 2 * HOUR).toISOString(), 'CASE_UNDER_REVIEW', a.caseId, `Case opened for review: ${a.ruleTriggered}.`);
  if (a.status === 'Escalated') audit(new Date(t + 6 * HOUR).toISOString(), 'NFIU_ESCALATION', a.caseId, `Escalated to NFIU after review of ${a.transactions.length} transactions (${a.customerProfile.fullName}).`);
  if (a.status === 'Dismissed') audit(new Date(t + 5 * HOUR).toISOString(), 'ALERT_DISMISSED', a.caseId, `Closed as false positive — ${a.aiDraftedNarrative.split('Dismissed')[1]?.replace(/^[:\s]+/, '') ?? 'verified as legitimate.'}`);
}
for (const c of SEED_CUSTOMERS.filter((x) => x.accountStatus !== 'Active')) {
  audit(at(2, 16), c.accountStatus === 'Frozen' ? 'ACCOUNT_FREEZE' : 'ACCOUNT_RESTRICT', c.ref, `${c.fullName}: account ${c.accountStatus.toLowerCase()} pending investigation.`);
}
for (const d of SEED_DOCUMENTS.filter((x) => x.verified).slice(0, 12)) {
  audit(d.verified_at!, 'DOCUMENT_VERIFY', customerByNum(Number(d.customer_id)).ref, `${documentLabel(d.document_type)} verified (${d.document_name}).`, d.verified_by!);
}
for (const ctr of SEED_CTRS.filter((x) => x.status === 'filed')) {
  audit(ctr.filed_at!, 'CTR_FILED', ctr.ctr_reference!, `CTR for ${ctr.customer_name} (${ngn(Number(ctr.total_cash_ngn))}): cash report exported as goAML-style XML (draft).`);
}
for (const s of SEED_STRS.filter((x) => x.status === 'Submitted to NFIU')) {
  const a = alerts.find((x) => x.id === s.alertId)!;
  audit(new Date(new Date(a.timestamp).getTime() + 8 * HOUR).toISOString(), 'STR_EXPORT', a.caseId, `STR ${s.reference} exported as goAML-style XML (draft) for analyst review.`, s.analyst);
}
export const SEED_AUDIT: AuditEntry[] = auditRows.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
