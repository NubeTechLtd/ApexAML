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
