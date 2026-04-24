export type RiskLevel = 'Critical' | 'High' | 'Medium' | 'Low';

export type TxChannel = 'POS' | 'Mobile Transfer' | 'USSD' | 'ATM Withdrawal' | 'Online Banking' | 'Card Payment' | 'Cash Deposit' | 'IMTO Cash Payout';

export type AlertType =
  | 'STANDARD'
  | 'IMTO_CASH_SMURFING'
  | 'IMTO_OUTBOUND_VIOLATION'
  | 'IMTO_FX_SETTLEMENT_VIOLATION'
  | 'IMTO_ROUNDTRIP_SUSPECTED'
  | 'CROSS_BORDER_FLAG';

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
  /** Currency the payout/settlement was executed in. Must be NGN under CBN 2025 directives. */
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
  /** If true, dismissal requires justification + supervisor approval. */
  requiresSupervisorApproval?: boolean;
  /** Cross-border IMTO flag metadata — present when alertType === 'CROSS_BORDER_FLAG'. */
  crossBorder?: CrossBorderContext;
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

export const mockAlerts: Alert[] = [
  {
    id: 'ALT-2026-0891',
    caseId: 'CAS-2026-0891-NG',
    status: 'Open',
    riskLevel: 'Critical',
    ruleTriggered: 'High-Velocity Inflow/Outflow (Structuring)',
    timestamp: '2026-04-09T14:30:00Z',
    timeElapsed: '2h ago',
    description:
      'Subject exceeded Tier 1 limits via structured inflows from distinct POS terminals, followed by immediate liquidation to known Virtual Asset Service Provider (VASP).',
    customerProfile: {
      fullName: 'Emeka Chidi Nwosu',
      bvn: '22459810344',
      nin: '81900234112',
      nuban: '0123456789',
      kycTier: 'Tier 1 (Limit: ₦50,000/day)',
      occupation: 'Student',
      registeredAddress: '42 Bode Thomas Street, Surulere, Lagos',
      riskScore: 88,
    },
    transactions: [
      { id: 'tx-01', date: '2026-04-08T09:15:00Z', type: 'Credit', amountNGN: 45000, counterparty: 'POS/Moniepoint/Ikeja', balanceAfter: 45500, channel: 'POS' },
      { id: 'tx-02', date: '2026-04-08T11:45:00Z', type: 'Credit', amountNGN: 48000, counterparty: 'POS/Opay/Oshodi', balanceAfter: 93500, channel: 'POS' },
      { id: 'tx-03', date: '2026-04-08T14:20:00Z', type: 'Credit', amountNGN: 49000, counterparty: 'POS/Palmpay/Mainland', balanceAfter: 142500, channel: 'POS' },
      { id: 'tx-04', date: '2026-04-08T14:35:00Z', type: 'Debit', amountNGN: 140000, counterparty: 'BaraqTech BDC (Suspected P2P)', balanceAfter: 2500, channel: 'Mobile Transfer' },
    ],
    behavioralRedFlags: [
      'IP Address mismatch: Login from 197.210.X.X (Abuja) but POS transactions localized in Lagos.',
      'Account velocity: Funds remain in account for an average of 18 minutes before outflow.',
      'Limit breach: Tier 1 daily cumulative limit of ₦50,000 bypassed via API fragmentation.',
    ],
    aiDraftedNarrative:
      'The subject, Emeka Chidi Nwosu, a Tier 1 account holder, systematically evaded the ₦50,000 daily transaction limit by utilizing geographically dispersed POS terminals (Moniepoint, Opay, Palmpay) across Lagos. Within a 5-hour window, the subject received three structured deposits totaling ₦142,000. These funds were subsequently aggregated and transferred out within 15 minutes to BaraqTech BDC, a suspected Virtual Asset Service Provider. The rapid velocity of funds and IP geolocation mismatches strongly indicate pass-through account behavior for crypto-arbitrage or layering operations. Account restriction has been applied pending NFIU guidance.',
  },
  {
    id: 'ALT-2026-0892',
    caseId: 'CAS-2026-0892-NG',
    status: 'Under Review',
    riskLevel: 'High',
    ruleTriggered: 'Unusual Midnight e-Channel Spikes',
    timestamp: '2026-04-09T03:15:00Z',
    timeElapsed: '12h ago',
    description:
      'Multiple rapid intra-bank transfers executed between 2:00 AM and 3:00 AM, deviating from the customer\'s historical transaction profile.',
    customerProfile: {
      fullName: 'Fatima Bello',
      bvn: '22345678904',
      nin: '81234567890',
      nuban: '0987654321',
      kycTier: 'Tier 3 (No Limits)',
      occupation: 'Retail Merchant',
      registeredAddress: '15 Aminu Kano Crescent, Wuse II, Abuja',
      riskScore: 75,
    },
    transactions: [
      { id: 'tx-05', date: '2026-04-09T02:10:00Z', type: 'Debit', amountNGN: 500000, counterparty: 'Bet9ja Wallet Topup', balanceAfter: 1200500, channel: 'Online Banking' },
      { id: 'tx-06', date: '2026-04-09T02:25:00Z', type: 'Debit', amountNGN: 500000, counterparty: 'Bet9ja Wallet Topup', balanceAfter: 700500, channel: 'Online Banking' },
      { id: 'tx-07', date: '2026-04-09T02:40:00Z', type: 'Debit', amountNGN: 500000, counterparty: 'SportyBet Wallet Topup', balanceAfter: 200500, channel: 'Mobile Transfer' },
    ],
    behavioralRedFlags: [
      'Time-of-day anomaly: 100% of transaction volume occurred outside regular banking hours.',
      'New device login: Transactions initiated from an unrecognized Android device.',
      'Gaming platform funneling: Sudden escalation of funds directed to high-risk merchant categories (Betting/Gambling).',
    ],
    aiDraftedNarrative:
      'The subject, Fatima Bello, experienced anomalous account activity deviating entirely from historical patterns. Between 02:10 AM and 02:40 AM WAT, three consecutive ₦500,000 debits were executed, draining the account balance by ₦1,500,000. These funds were directed to online betting wallets (Bet9ja and SportyBet). Coupled with an unverified new device login, this typology is highly indicative of Account Takeover (ATO) fraud converging with money laundering via gambling platforms. The subject\'s e-channels have been temporarily frozen pending verbal verification.',
  },
  {
    id: 'ALT-2026-0893',
    caseId: 'CAS-2026-0893-NG',
    status: 'Open',
    riskLevel: 'High',
    ruleTriggered: 'Dormant Account Reactivation + Large Outflow',
    timestamp: '2026-04-08T16:45:00Z',
    timeElapsed: '1d ago',
    description:
      'Previously dormant account (18 months inactivity) received ₦2.8M credit followed by immediate outward transfers to multiple beneficiaries.',
    customerProfile: {
      fullName: 'Abubakar Sadiq Yusuf',
      bvn: '22567890123',
      nin: '81456789012',
      nuban: '0112233445',
      kycTier: 'Tier 2 (Limit: ₦200,000/day)',
      occupation: 'Civil Servant',
      registeredAddress: '8 Sultan Road, Sokoto',
      riskScore: 72,
    },
    transactions: [
      { id: 'tx-08', date: '2026-04-08T10:00:00Z', type: 'Credit', amountNGN: 2800000, counterparty: 'NEFT/GTB/Abuja', balanceAfter: 2801200, channel: 'Online Banking' },
      { id: 'tx-09', date: '2026-04-08T10:15:00Z', type: 'Debit', amountNGN: 950000, counterparty: 'Individual/Kano', balanceAfter: 1851200, channel: 'Mobile Transfer' },
      { id: 'tx-10', date: '2026-04-08T10:22:00Z', type: 'Debit', amountNGN: 900000, counterparty: 'Individual/Kaduna', balanceAfter: 951200, channel: 'Mobile Transfer' },
      { id: 'tx-11', date: '2026-04-08T10:30:00Z', type: 'Debit', amountNGN: 900000, counterparty: 'Individual/Lagos', balanceAfter: 51200, channel: 'USSD' },
    ],
    behavioralRedFlags: [
      'Account dormancy: No transactions for 18 months prior to this activity.',
      'Fan-out pattern: Single large credit immediately split to 3 unrelated beneficiaries.',
      'KYC tier breach: Tier 2 daily limit of ₦200,000 significantly exceeded.',
    ],
    aiDraftedNarrative:
      'The subject, Abubakar Sadiq Yusuf, a Tier 2 account holder with a ₦200,000 daily limit, reactivated a dormant account after 18 months of inactivity. A single NEFT credit of ₦2,800,000 from a GTBank Abuja source was received at 10:00 AM. Within 30 minutes, the funds were systematically disbursed to three unrelated individuals across Kano, Kaduna, and Lagos, leaving a residual balance of ₦51,200. This classic fan-out distribution pattern, combined with the dormancy reactivation and tier limit breach, strongly suggests the account is being used as a pass-through for money laundering or terrorism financing purposes.',
  },
  {
    id: 'ALT-2026-0894',
    caseId: 'CAS-2026-0894-NG',
    status: 'Open',
    riskLevel: 'Medium',
    ruleTriggered: 'Cross-Border Wire to High-Risk Jurisdiction',
    timestamp: '2026-04-07T09:30:00Z',
    timeElapsed: '2d ago',
    description:
      'Outbound SWIFT transfer to UAE-based entity flagged under FATF grey-list jurisdiction monitoring.',
    customerProfile: {
      fullName: 'Chioma Obi-Nwankwo',
      bvn: '22678901234',
      nin: '81567890123',
      nuban: '0223344556',
      kycTier: 'Tier 3 (No Limits)',
      occupation: 'Import/Export Trader',
      registeredAddress: '22 Marine Road, Apapa, Lagos',
      riskScore: 58,
    },
    transactions: [
      { id: 'tx-12', date: '2026-04-07T09:00:00Z', type: 'Debit', amountNGN: 15000000, counterparty: 'SWIFT/Dubai Trading FZE/UAE', balanceAfter: 3200000, channel: 'Online Banking' },
      { id: 'tx-13', date: '2026-04-05T14:00:00Z', type: 'Credit', amountNGN: 8000000, counterparty: 'NEFT/Various/Lagos', balanceAfter: 18200000, channel: 'Cash Deposit' },
      { id: 'tx-14', date: '2026-04-04T11:00:00Z', type: 'Credit', amountNGN: 10000000, counterparty: 'NEFT/Various/Onitsha', balanceAfter: 10200000, channel: 'ATM Withdrawal' },
    ],
    behavioralRedFlags: [
      'FATF grey-list: UAE is currently on the FATF list of jurisdictions under increased monitoring.',
      'Aggregation before wire: Multiple domestic credits aggregated before single international outflow.',
      'Trade-based ML indicator: Import/export occupation combined with opaque beneficiary description.',
    ],
    aiDraftedNarrative:
      'The subject, Chioma Obi-Nwankwo, an import/export trader, executed a ₦15,000,000 outbound SWIFT transfer to Dubai Trading FZE in the United Arab Emirates. The UAE is currently on the FATF grey list of jurisdictions under increased monitoring. Prior to the wire transfer, the account received two domestic NEFT credits totaling ₦18,000,000 from various sources in Lagos and Onitsha over a 3-day period. This aggregation-before-outflow pattern, combined with the high-risk jurisdiction and trade-based ML indicators, warrants enhanced due diligence and potential STR filing.',
  },
  {
    id: 'ALT-2026-0895',
    caseId: 'CAS-2026-0895-NG',
    status: 'Open',
    riskLevel: 'Critical',
    ruleTriggered: 'IMTO Cash Limit Smurfing ($200 CBN Threshold)',
    timestamp: '2026-04-09T12:00:00Z',
    timeElapsed: '4h ago',
    description:
      'Beneficiary received 6 cash payouts across 4 IMTO agents in 3 cities within 19 hours, cumulatively breaching the $200 USD CBN cash payout threshold (CBN IMTO Guidelines 2021).',
    alertType: 'IMTO_CASH_SMURFING',
    imto: {
      senderCountry: 'UK',
      beneficiaryName: 'Kelechi Onyekachi Okoro',
      beneficiaryPhone: '+234 803 412 8899',
      beneficiaryNIN: '81923445667',
      cashPickupCount: 6,
      totalCashNGN: 1706400, // ~$1,080 USD at ₦1,580
      usdEquivalent: 1080,
      agentLocations: ['Lagos — Ikeja', 'Lagos — Surulere', 'Abuja — Wuse', 'Port Harcourt — GRA'],
      triggerThreshold: '$200 USD equivalent',
    },
    customerProfile: {
      fullName: 'Kelechi Onyekachi Okoro',
      bvn: '22891234567',
      nin: '81923445667',
      nuban: 'N/A (IMTO Beneficiary)',
      kycTier: 'IMTO Walk-In (Tier 1 Equivalent)',
      occupation: 'Unverified',
      registeredAddress: '27 Allen Avenue, Ikeja, Lagos',
      riskScore: 91,
    },
    transactions: [
      { id: 'tx-15', date: '2026-04-08T17:10:00Z', type: 'Credit', amountNGN: 284400, counterparty: 'Western Union / Sender: J. Okoro (UK)', balanceAfter: 0, channel: 'IMTO Cash Payout', agentLocation: 'Lagos — Ikeja', imtoOperator: 'Western Union', transferDirection: 'INBOUND', settlementCurrency: 'NGN' },
      { id: 'tx-16', date: '2026-04-08T19:45:00Z', type: 'Credit', amountNGN: 284400, counterparty: 'MoneyGram / Sender: J. Okoro (UK)', balanceAfter: 0, channel: 'IMTO Cash Payout', agentLocation: 'Lagos — Surulere', imtoOperator: 'MoneyGram', transferDirection: 'INBOUND', settlementCurrency: 'NGN' },
      { id: 'tx-17', date: '2026-04-08T23:02:00Z', type: 'Credit', amountNGN: 284400, counterparty: 'Ria Money / Sender: A. Bello (UK)', balanceAfter: 0, channel: 'IMTO Cash Payout', agentLocation: 'Abuja — Wuse', imtoOperator: 'Ria Money Transfer', transferDirection: 'INBOUND', settlementCurrency: 'NGN' },
      { id: 'tx-18', date: '2026-04-09T06:25:00Z', type: 'Credit', amountNGN: 284400, counterparty: 'WorldRemit / Sender: J. Okoro (UK)', balanceAfter: 0, channel: 'IMTO Cash Payout', agentLocation: 'Port Harcourt — GRA', imtoOperator: 'WorldRemit', transferDirection: 'INBOUND', settlementCurrency: 'NGN' },
      { id: 'tx-19', date: '2026-04-09T09:15:00Z', type: 'Credit', amountNGN: 284400, counterparty: 'Western Union / Sender: M. Okoro (UK)', balanceAfter: 0, channel: 'IMTO Cash Payout', agentLocation: 'Lagos — Ikeja', imtoOperator: 'Western Union', transferDirection: 'INBOUND', settlementCurrency: 'NGN' },
      { id: 'tx-20', date: '2026-04-09T11:40:00Z', type: 'Credit', amountNGN: 284400, counterparty: 'MoneyGram / Sender: M. Okoro (UK)', balanceAfter: 0, channel: 'IMTO Cash Payout', agentLocation: 'Lagos — Surulere', imtoOperator: 'MoneyGram', transferDirection: 'INBOUND', settlementCurrency: 'NGN' },
    ],
    behavioralRedFlags: [
      'Identity match across operators: Same NIN (81923445667) + phone (+234 803 412 8899) collected cash at 4 different IMTO operators in 19 hours.',
      'Threshold evasion: Each individual pickup was structured just below $200 USD (₦284,400 ≈ $180) to avoid per-transaction scrutiny.',
      'Geographic velocity anomaly: Pickups span Lagos → Abuja → Port Harcourt → Lagos — physically implausible without air travel, suggesting coordinated mule network or identity abuse.',
      'Sender rotation: Multiple UK-based senders with overlapping surname "Okoro" — possible family-network layering or single controller using alias senders.',
    ],
    aiDraftedNarrative:
      'The beneficiary, Kelechi Onyekachi Okoro (NIN 81923445667, +234 803 412 8899), received six (6) IMTO cash payouts within a rolling 24-hour window ending 2026-04-09 11:40 WAT. Payouts were collected across four distinct IMTO operators (Western Union, MoneyGram, Ria Money Transfer, WorldRemit) at agent locations in Lagos (Ikeja, Surulere), Abuja (Wuse), and Port Harcourt (GRA). Individual pickups were structured at ₦284,400 (≈ $180 USD) each — deliberately positioned below the $200 USD per-transaction threshold prescribed under CBN IMTO Guidelines (2021). Cumulative cash disbursed: ₦1,706,400 (≈ $1,080 USD), representing a 540% breach of the single-identity cash cap. Senders trace to multiple UK-based individuals sharing the surname "Okoro", indicating potential family-network layering or coordinated alias use. The physical-geography velocity of pickups (Lagos → Abuja → Port Harcourt → Lagos in 19 hours) is implausible for a single individual, strongly suggesting either (a) identity-document abuse by a mule network, or (b) third-party collection under proxy. Recommend: immediate block on subsequent IMTO cash pickups for this beneficiary identity across all Zuia-connected operators, NFIU escalation, and coordinated review with originating UK corridor.',
  },
  /* ── IMTO_OUTBOUND_VIOLATION ─────────────────────────────────────── */
  {
    id: 'ALT-2026-0896',
    caseId: 'CAS-2026-0896-NG',
    status: 'Open',
    riskLevel: 'Critical',
    ruleTriggered: 'IMTO Outbound Transfer Violation (CBN Licence Breach)',
    timestamp: '2026-04-09T13:22:00Z',
    timeElapsed: '1h ago',
    description:
      'A transaction originating from a Nigerian IMTO settlement account was booked with OUTBOUND direction. Nigerian IMTO licences are strictly inbound-only — outbound transfers are a direct licence-terminating violation.',
    alertType: 'IMTO_OUTBOUND_VIOLATION',
    requiresSupervisorApproval: true,
    imto: {
      senderCountry: 'UK',
      beneficiaryName: 'Afolabi Odutola',
      beneficiaryPhone: '+234 802 115 4461',
      beneficiaryNIN: '81055329918',
      cashPickupCount: 0,
      totalCashNGN: 0,
      usdEquivalent: 0,
      agentLocations: ['Lagos — Victoria Island'],
      triggerThreshold: 'Any OUTBOUND direction (CBN IMTO Guidelines §4.2)',
    },
    customerProfile: {
      fullName: 'Afolabi Odutola',
      bvn: '22776543321',
      nin: '81055329918',
      nuban: '3344556677',
      kycTier: 'Tier 3',
      occupation: 'IMTO Settlement Account Holder',
      registeredAddress: '14 Adeola Odeku, Victoria Island, Lagos',
      riskScore: 97,
    },
    transactions: [
      { id: 'tx-21', date: '2026-04-09T12:02:00Z', type: 'Credit', amountNGN: 4800000, counterparty: 'MoneyGram / UK Corridor Settlement', balanceAfter: 4825000, channel: 'IMTO Cash Payout', imtoOperator: 'MoneyGram', agentLocation: 'Lagos — Victoria Island', transferDirection: 'INBOUND', settlementCurrency: 'NGN' },
      { id: 'tx-22', date: '2026-04-09T13:15:00Z', type: 'Debit', amountNGN: 4200000, counterparty: 'MoneyGram / Outbound Remit to UK', balanceAfter: 625000, channel: 'IMTO Cash Payout', imtoOperator: 'MoneyGram', agentLocation: 'Lagos — Victoria Island', transferDirection: 'OUTBOUND', settlementCurrency: 'NGN' },
    ],
    behavioralRedFlags: [
      'Direction violation: Debit tx-22 booked as OUTBOUND on a Nigerian IMTO settlement account — strictly prohibited under CBN IMTO Guidelines §4.2.',
      'Rapid turnaround: Outbound booked 73 minutes after the inbound settlement credit — classic licence-arbitrage pattern.',
      'Operator mismatch risk: Same operator (MoneyGram) appears on both sides, suggesting internal routing rather than legitimate corridor business.',
    ],
    aiDraftedNarrative:
      'On 2026-04-09 at 13:15 WAT, transaction tx-22 was booked on Afolabi Odutola\'s Nigerian IMTO settlement account (NUBAN 3344556677) with a transferDirection of OUTBOUND and an amount of ₦4,200,000. The Central Bank of Nigeria\'s IMTO Guidelines (§4.2, as reinforced in the 2025 directives) restrict Nigerian IMTO licences to INBOUND flows only; any outbound transfer from an IMTO settlement account is a licence-terminating offence. The outbound was booked 1 hour 13 minutes after an inbound settlement of ₦4,800,000 through the same operator (MoneyGram), which is a strong indicator of unauthorised corridor reverse-routing. Recommend: immediate case freeze, licence-compliance notification, and mandatory dual-sign-off escalation to the Chief Compliance Officer and NFIU.',
  },
  /* ── IMTO_FX_SETTLEMENT_VIOLATION ────────────────────────────────── */
  {
    id: 'ALT-2026-0897',
    caseId: 'CAS-2026-0897-NG',
    status: 'Open',
    riskLevel: 'Critical',
    ruleTriggered: 'IMTO Non-Naira Settlement Violation',
    timestamp: '2026-04-09T10:05:00Z',
    timeElapsed: '3h ago',
    description:
      'IMTO cash payout executed in a non-Naira settlement currency (USD). Under CBN 2025 directives, all IMTO payouts on Nigerian soil must be settled in NGN — foreign-currency settlement is a licence-terminating offence.',
    alertType: 'IMTO_FX_SETTLEMENT_VIOLATION',
    requiresSupervisorApproval: true,
    imto: {
      senderCountry: 'US',
      beneficiaryName: 'Oluwaseun Balogun',
      beneficiaryPhone: '+234 807 998 2210',
      beneficiaryNIN: '81446720019',
      cashPickupCount: 1,
      totalCashNGN: 3160000,
      usdEquivalent: 2000,
      agentLocations: ['Lagos — Lekki Phase 1'],
      triggerThreshold: 'Settlement currency ≠ NGN (CBN 2025 directives)',
    },
    customerProfile: {
      fullName: 'Oluwaseun Balogun',
      bvn: '22994471102',
      nin: '81446720019',
      nuban: 'N/A (IMTO Beneficiary)',
      kycTier: 'IMTO Walk-In (Tier 2 Equivalent)',
      occupation: 'Freelance Consultant',
      registeredAddress: '8 Admiralty Way, Lekki Phase 1, Lagos',
      riskScore: 94,
    },
    transactions: [
      { id: 'tx-23', date: '2026-04-09T09:58:00Z', type: 'Credit', amountNGN: 3160000, counterparty: 'Western Union / Sender: T. Balogun (US)', balanceAfter: 0, channel: 'IMTO Cash Payout', imtoOperator: 'Western Union', agentLocation: 'Lagos — Lekki Phase 1', transferDirection: 'INBOUND', settlementCurrency: 'USD' },
    ],
    behavioralRedFlags: [
      'Currency violation: Payout settled in USD ($2,000) on Nigerian soil — CBN 2025 directives require NGN-only settlement.',
      'Cash-denominated FX risk: Physical USD disbursement at an IMTO agent window indicates parallel-market exposure.',
      'KYC weakness: Beneficiary verified only to walk-in Tier 2 equivalent — insufficient for FX-denominated disbursement under any circumstances.',
    ],
    aiDraftedNarrative:
      'On 2026-04-09 at 09:58 WAT, Oluwaseun Balogun (NIN 81446720019) collected an IMTO remittance at the Lekki Phase 1 Western Union agent for ₦3,160,000-equivalent; the settlementCurrency field was recorded as USD with a cash disbursement of $2,000. This is a direct violation of the CBN 2025 directives mandating Naira-only settlement of all IMTO payouts on Nigerian soil. The breach is categorised as a licence-terminating offence and, under the revised directive, triggers mandatory same-day notification to the CBN Payments System Department and the NFIU. Recommend: immediate suspension of the originating agent, preservation of the agent CCTV and till records, and escalation to the Chief Compliance Officer for licence-impact assessment.',
  },
  /* ── IMTO_ROUNDTRIP_SUSPECTED (BDC Round-Trip) ───────────────────── */
  {
    id: 'ALT-2026-0898',
    caseId: 'CAS-2026-0898-NG',
    status: 'Open',
    riskLevel: 'Critical',
    ruleTriggered: 'IMTO → BDC Round-Trip Suspected',
    timestamp: '2026-04-08T20:45:00Z',
    timeElapsed: '17h ago',
    description:
      'IMTO settlement account debited a registered Bureau de Change within 48 hours of receiving an inbound remittance credit — classic round-trip FX-arbitrage typology.',
    alertType: 'IMTO_ROUNDTRIP_SUSPECTED',
    bdcRoundTrip: {
      bdcEntityName: 'Crown BDC Ltd (Lagos Island)',
      remittanceTxId: 'tx-24',
      bdcTxId: 'tx-25',
      remittanceAmountNGN: 6320000,
      timeGapMinutes: 97,
    },
    customerProfile: {
      fullName: 'Ifeoluwa Adeniran',
      bvn: '22881573044',
      nin: '81772910055',
      nuban: '5566778899',
      kycTier: 'Tier 3',
      occupation: 'IMTO Settlement Account Holder',
      registeredAddress: '41 Broad Street, Lagos Island',
      riskScore: 89,
    },
    transactions: [
      { id: 'tx-24', date: '2026-04-08T19:08:00Z', type: 'Credit', amountNGN: 6320000, counterparty: 'Ria Money / UK Corridor Settlement', balanceAfter: 6380000, channel: 'IMTO Cash Payout', imtoOperator: 'Ria Money Transfer', agentLocation: 'Lagos — Lagos Island', transferDirection: 'INBOUND', settlementCurrency: 'NGN' },
      { id: 'tx-25', date: '2026-04-08T20:45:00Z', type: 'Debit', amountNGN: 6250000, counterparty: 'Crown BDC Ltd (Lagos Island)', balanceAfter: 130000, channel: 'Mobile Transfer', transferDirection: 'OUTBOUND', settlementCurrency: 'NGN', isBDCPayout: true },
    ],
    behavioralRedFlags: [
      'Round-trip pattern: 98.9% of the inbound remittance was debited to a BDC 1h 37m after receipt.',
      'Licensed counterparty: Crown BDC Ltd is a CBN-licensed BDC — outflow is visible but indicates parallel-market FX conversion.',
      'Velocity: Time gap (97 minutes) is far below the 48-hour review window — deliberate rapid-recycling pattern.',
    ],
    aiDraftedNarrative:
      'The subject, Ifeoluwa Adeniran (NUBAN 5566778899), received an inbound IMTO remittance of ₦6,320,000 from Ria Money Transfer\'s UK corridor at 19:08 WAT on 2026-04-08. At 20:45 WAT — 1 hour 37 minutes later — the subject debited ₦6,250,000 (98.9% of the inbound) to Crown BDC Ltd (Lagos Island), a CBN-licensed Bureau de Change. This pattern — inbound IMTO credit immediately recycled through a BDC — is a textbook FX-arbitrage round-trip typology. Whilst the BDC is licensed, the rapid turnaround and near-full-value transfer suggest the IMTO settlement account is being used as a pass-through conduit for parallel-market foreign-exchange conversion, in contravention of the CBN IMTO Guidelines spirit and the 2025 directives prohibiting FX-arbitrage usage of remittance corridors. Recommend: immediate case freeze on the settlement account, BDC counterparty review, and joint NFIU / CBN Payments System Department notification.',
  },
];
