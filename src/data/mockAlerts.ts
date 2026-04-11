export type RiskLevel = 'Critical' | 'High' | 'Medium' | 'Low';

export type TxChannel = 'POS' | 'Mobile Transfer' | 'USSD' | 'ATM Withdrawal' | 'Online Banking' | 'Card Payment' | 'Cash Deposit';

export interface Transaction {
  id: string;
  date: string;
  type: 'Credit' | 'Debit';
  amountNGN: number;
  counterparty: string;
  balanceAfter: number;
  channel: TxChannel;
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
];
