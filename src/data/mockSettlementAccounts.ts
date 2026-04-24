/**
 * IMTO Designated Settlement Accounts — partner-bank held accounts that
 * receive remittance settlement from approved overseas correspondent
 * banks ONLY. Commingling with operating funds is a May 2026 CBN
 * Circular violation (joint partner-bank liability).
 */

export interface CreditEvent {
  id: string;
  date: string; // ISO
  sourceEntity: string;
  amountNGN: number;
  approved: boolean;
}

export interface IMTOSettlementAccount {
  /** Internal id */
  id: string;
  /** NUBAN — Nigerian account number */
  nuban: string;
  /** Holding partner bank */
  partnerBank: string;
  /** Tagged as IMTO settlement? */
  isIMTOSettlement: boolean;
  /** IMTO operator (the licensee whose remittances settle here) */
  imtoName: string;
  /** CBN-issued IMTO licence number */
  cbnLicenceNumber: string;
  /** Approved overseas correspondent banks allowed to credit this account */
  approvedCorrespondents: string[];
  /** Activation date as IMTO settlement */
  activationDate: string;
  /** Last 30 days of credits (used for commingling score + dashboard) */
  recentCredits: CreditEvent[];
}

/** A non-IMTO control account (corporate operating). */
export interface OperatingAccount {
  id: string;
  nuban: string;
  partnerBank: string;
  isIMTOSettlement: false;
  accountName: string;
  accountType: 'Corporate Operating' | 'Trust' | 'Escrow';
}

export type ManagedAccount = IMTOSettlementAccount | OperatingAccount;

const today = new Date('2026-04-09T00:00:00Z');
const daysAgo = (n: number, hour = 10) => {
  const d = new Date(today);
  d.setUTCDate(d.getUTCDate() - n);
  d.setUTCHours(hour, 15, 0, 0);
  return d.toISOString();
};

/** Build a 30-day credit history. `unapprovedCount` injects commingling events. */
function buildCredits(opts: {
  approvedSources: string[];
  unapprovedCount: number;
  unapprovedSources: string[];
  approvedCount: number;
}): CreditEvent[] {
  const out: CreditEvent[] = [];
  for (let i = 0; i < opts.approvedCount; i++) {
    out.push({
      id: `c-a-${i}`,
      date: daysAgo(i % 30, 9 + (i % 8)),
      sourceEntity: opts.approvedSources[i % opts.approvedSources.length],
      amountNGN: 800_000 + ((i * 137) % 50) * 50_000,
      approved: true,
    });
  }
  for (let i = 0; i < opts.unapprovedCount; i++) {
    out.push({
      id: `c-u-${i}`,
      date: daysAgo((i * 3) % 28, 14 + (i % 4)),
      sourceEntity: opts.unapprovedSources[i % opts.unapprovedSources.length],
      amountNGN: 1_500_000 + ((i * 53) % 30) * 100_000,
      approved: false,
    });
  }
  return out.sort((a, b) => (a.date < b.date ? 1 : -1));
}

export const mockSettlementAccounts: ManagedAccount[] = [
  {
    id: 'acc-1',
    nuban: '0044129087',
    partnerBank: 'GTBank',
    isIMTOSettlement: true,
    imtoName: 'WorldRemit',
    cbnLicenceNumber: 'CBN/IMTO/2019/00112',
    approvedCorrespondents: [
      'WorldRemit Ltd (UK)',
      'WorldRemit Corp (US)',
      'WorldRemit Canada Inc',
    ],
    activationDate: '2024-03-12',
    recentCredits: buildCredits({
      approvedSources: ['WorldRemit Ltd (UK)', 'WorldRemit Corp (US)', 'WorldRemit Canada Inc'],
      approvedCount: 142,
      unapprovedCount: 0,
      unapprovedSources: [],
    }),
  },
  {
    id: 'acc-2',
    nuban: '5566778899',
    partnerBank: 'Access Bank',
    isIMTOSettlement: true,
    imtoName: 'LemFi',
    cbnLicenceNumber: 'CBN/IMTO/2022/00318',
    approvedCorrespondents: [
      'LemFi UK Ltd',
      'LemFi Inc (US)',
      'LemFi Canada Ltd',
      'LemFi EU OÜ',
    ],
    activationDate: '2023-11-04',
    recentCredits: buildCredits({
      approvedSources: ['LemFi UK Ltd', 'LemFi Inc (US)', 'LemFi Canada Ltd', 'LemFi EU OÜ'],
      approvedCount: 188,
      unapprovedCount: 4,
      unapprovedSources: [
        'Sunrise Trading Nigeria Ltd',
        'OakField Logistics Ltd',
        'Atlas Energy Services Ltd',
        'Greenline FX Bureau',
      ],
    }),
  },
  {
    id: 'acc-3',
    nuban: '7710443322',
    partnerBank: 'Zenith Bank',
    isIMTOSettlement: true,
    imtoName: 'Sendwave',
    cbnLicenceNumber: 'CBN/IMTO/2021/00204',
    approvedCorrespondents: [
      'Sendwave (Sunrise Communications LLC, US)',
      'Sendwave UK Ltd',
    ],
    activationDate: '2024-07-22',
    recentCredits: buildCredits({
      approvedSources: ['Sendwave (Sunrise Communications LLC, US)', 'Sendwave UK Ltd'],
      approvedCount: 96,
      unapprovedCount: 1,
      unapprovedSources: ['Crown BDC Ltd'],
    }),
  },
  {
    id: 'acc-4',
    nuban: '8800219944',
    partnerBank: 'First Bank',
    isIMTOSettlement: true,
    imtoName: 'Ria Money Transfer',
    cbnLicenceNumber: 'CBN/IMTO/2018/00077',
    approvedCorrespondents: [
      'Ria Financial Services UK Ltd',
      'Ria Financial Services LLC (US)',
      'Euronet Worldwide EU',
    ],
    activationDate: '2022-08-15',
    recentCredits: buildCredits({
      approvedSources: ['Ria Financial Services UK Ltd', 'Ria Financial Services LLC (US)', 'Euronet Worldwide EU'],
      approvedCount: 210,
      unapprovedCount: 0,
      unapprovedSources: [],
    }),
  },
  {
    id: 'acc-5',
    nuban: '9911223344',
    partnerBank: 'GTBank',
    isIMTOSettlement: false,
    accountName: 'Lagos Logistics Ltd — Operating',
    accountType: 'Corporate Operating',
  },
  {
    id: 'acc-6',
    nuban: '4433221100',
    partnerBank: 'Access Bank',
    isIMTOSettlement: false,
    accountName: 'Bourdillon Capital — Trust',
    accountType: 'Trust',
  },
];

/* ── Derived analytics ─────────────────────────────────────────────── */

/**
 * Commingling score (0–100). 0 is perfect (zero unapproved credits),
 * 100 is fully commingled. Weighted by both count AND value share.
 */
export function commingleScore(acc: IMTOSettlementAccount): number {
  if (acc.recentCredits.length === 0) return 0;
  const unapproved = acc.recentCredits.filter(c => !c.approved);
  if (unapproved.length === 0) return 0;
  const totalValue = acc.recentCredits.reduce((s, c) => s + c.amountNGN, 0);
  const unapprovedValue = unapproved.reduce((s, c) => s + c.amountNGN, 0);
  const countShare = unapproved.length / acc.recentCredits.length;
  const valueShare = unapprovedValue / Math.max(1, totalValue);
  // 60% value-weighted, 40% count-weighted, capped at 100
  return Math.min(100, Math.round((valueShare * 60 + countShare * 40) * 100));
}

export function approvedVsUnapproved(acc: IMTOSettlementAccount) {
  const approved = acc.recentCredits.filter(c => c.approved);
  const unapproved = acc.recentCredits.filter(c => !c.approved);
  return {
    approvedCount: approved.length,
    unapprovedCount: unapproved.length,
    approvedValue: approved.reduce((s, c) => s + c.amountNGN, 0),
    unapprovedValue: unapproved.reduce((s, c) => s + c.amountNGN, 0),
  };
}

export const isIMTOSettlement = (a: ManagedAccount): a is IMTOSettlementAccount =>
  a.isIMTOSettlement === true;
