export type RiskLevel = 'Critical' | 'High' | 'Medium' | 'Low';

export type TxChannel = 'POS' | 'Mobile Transfer' | 'USSD' | 'ATM Withdrawal' | 'Online Banking' | 'Card Payment' | 'Cash Deposit' | 'IMTO Cash Payout';

export type AlertType =
  | 'STANDARD'
  | 'IMTO_CASH_SMURFING'
  | 'IMTO_OUTBOUND_VIOLATION'
  | 'IMTO_FX_SETTLEMENT_VIOLATION'
  | 'IMTO_ROUNDTRIP_SUSPECTED'
  | 'B2P_PHANTOM_PAYROLL_PATTERN'
  | 'CROSS_BORDER_FLAG'
  | 'IMTO_ACCOUNT_COMMINGLING';

export type OriginatingCountry = 'UK' | 'US' | 'CA' | 'EU';

export type OverseasFlagReason =
  | 'Stolen card'
  | 'Fraud pattern'
  | 'Sanctions match'
  | 'Terrorism financing';

/** Extra metadata when an alert is raised by an overseas IMTO compliance team. */
export interface CrossBorderContext {
  originatingCountry: OriginatingCountry;
  overseasReferenceId: string;
  /** ISO timestamp — this is when the 24-hour NFIU filing clock started. */
  overseasFlaggedAt: string;
  overseasFlagReason: OverseasFlagReason;
  overseasFlaggedBy: string;
}

export type TransferDirection = 'INBOUND' | 'OUTBOUND';
export type SettlementCurrency = 'NGN' | 'USD' | 'GBP' | 'EUR';

export interface Transaction {
  id: string;
  date: string;
  type: 'Credit' | 'Debit';
  amountNGN: number;
  counterparty: string;
  balanceAfter: number;
  channel: TxChannel;
  /** Agent city (IMTO only) */
  agentLocation?: string;
  /** IMTO operator name (e.g. Western Union, MoneyGram) */
  imtoOperator?: string;
  /** Direction of IMTO flow. INBOUND is the only legal direction for Nigerian IMTO licences. */
  transferDirection?: TransferDirection;
  /** Currency the payout/settlement was executed in. Must be NGN under CBN Circular BSD/DIR/PUB/LAB/019/002 (10 March 2026). */
  settlementCurrency?: SettlementCurrency;
  /** True if the debit is routed to a Bureau de Change (used for round-trip detection). */
  isBDCPayout?: boolean;
}

export interface CustomerProfile {
  fullName: string;
  bvn: string;
  nin: string;
  nuban: string;
  kycTier: string;
  occupation: string;
  registeredAddress: string;
  riskScore: number;
}

export interface IMTOContext {
  senderCountry: 'UK' | 'US' | 'CA';
  beneficiaryName: string;
  beneficiaryPhone: string;
  beneficiaryNIN?: string;
  cashPickupCount: number;
  totalCashNGN: number;
  /** Calculated at CBN daily rate */
  usdEquivalent: number;
  agentLocations: string[];
  triggerThreshold: string;
}

/** Details of a suspected BDC round-trip (licence-terminating). */
export interface BDCRoundTripContext {
  bdcEntityName: string;
  remittanceTxId: string;
  bdcTxId: string;
  remittanceAmountNGN: number;
  /** Minutes between the inbound remittance credit and the BDC debit. */
  timeGapMinutes: number;
}

/** Phantom payroll spoke — one recipient on the hub-and-spoke diagram. */
export interface PhantomPayrollRecipient {
  id: string;
  name: string;
  bank: string;
  amountNGN: number;
  kycTier: 'Tier 1' | 'Tier 2' | 'Tier 3';
  hasPriorHistory: boolean;
}

/** Aggregated context for a B2P phantom-payroll detection. */
export interface PhantomPayrollContext {
  senderEntityName: string;
  senderCountry: string;
  senderCRN: string;
  windowHours: number;
  totalRemittances: number;
  uniformAmountNGN: number;
  amountVariancePct: number;
  pctTier1Recipients: number;
  pctNoPriorHistory: number;
  uniqueBanks: number;
  recipients: PhantomPayrollRecipient[];
}

export interface Alert {
  id: string;
  caseId: string;
  status: 'Open' | 'Under Review' | 'Escalated' | 'Dismissed';
  riskLevel: RiskLevel;
  ruleTriggered: string;
  timestamp: string;
  timeElapsed: string;
  description: string;
  aiDraftedNarrative: string;
  customerProfile: CustomerProfile;
  transactions: Transaction[];
  behavioralRedFlags: string[];
  alertType?: AlertType;
  imto?: IMTOContext;
  bdcRoundTrip?: BDCRoundTripContext;
  phantomPayroll?: PhantomPayrollContext;
  /** If true, dismissal requires justification + supervisor approval. */
  requiresSupervisorApproval?: boolean;
  /** Cross-border IMTO flag metadata — present when alertType === 'CROSS_BORDER_FLAG'. */
  crossBorder?: CrossBorderContext;
  /** Commingling context — present when alertType === 'IMTO_ACCOUNT_COMMINGLING'. */
  commingling?: CommingleContext;
  /** Live only: flagged amount supplied with the case (for example from a CSV import). */
  flaggedAmountNGN?: number;
}

/**
 * Commingling detection context — fired when a tagged IMTO Settlement
 * Account receives a credit from an entity NOT in its approved
 * correspondent banks list. May 2026 CBN Circular violation.
 */
export interface CommingleContext {
  settlementAccountNuban: string;
  imtoName: string;
  cbnLicenceNumber: string;
  partnerBank: string;
  partnerBankCO: string;
  sourceEntity: string;
  amountNGN: number;
  creditedAt: string;
}

/**
 * Country flag emoji for an originating jurisdiction.
 */
export function countryFlagEmoji(country: OriginatingCountry): string {
  switch (country) {
    case 'UK': return '🇬🇧';
    case 'US': return '🇺🇸';
    case 'CA': return '🇨🇦';
    case 'EU': return '🇪🇺';
  }
}
