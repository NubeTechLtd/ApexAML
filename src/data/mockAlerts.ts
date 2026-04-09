export type AlertType =
  | "Structuring"
  | "PEP Match"
  | "Velocity Spike"
  | "Sanctions Hit"
  | "Round-Tripping"
  | "Threshold Breach";
export type RiskLevel = "Critical" | "High" | "Medium" | "Low";
export type AlertStatus = "Open" | "Under Review" | "Escalated" | "Dismissed";

export interface TransactionEvent {
  id: string;
  date: string;
  type: string;
  amount: number;
  currency: string;
  counterparty: string;
  channel: string;
  flagReason?: string;
}

export interface AlertData {
  id: string;
  riskScore: number;
  customerName: string;
  customerId: string;
  bvn: string;
  alertType: AlertType;
  timestamp: string;
  status: AlertStatus;
  kycTier: string;
  riskLevel: RiskLevel;
  accountNumber: string;
  totalFlagged: number;
  transactionTimeline: TransactionEvent[];
  summary: string;
}

export const mockAlerts: AlertData[] = [
  {
    id: "ALT-2025-0041",
    riskScore: 92,
    customerName: "Adebayo Ogundimu",
    customerId: "CUS-88291",
    bvn: "22198xxxxxx",
    alertType: "Structuring",
    timestamp: "2025-04-09T08:32:00Z",
    status: "Open",
    kycTier: "Tier 3",
    riskLevel: "Critical",
    accountNumber: "00123xxxx91",
    totalFlagged: 14500000,
    summary:
      "Multiple deposits just below the ₦5M reporting threshold detected over 3 consecutive days across two accounts.",
    transactionTimeline: [
      {
        id: "tx1",
        date: "2025-04-06T09:12:00Z",
        type: "Credit",
        amount: 4900000,
        currency: "NGN",
        counterparty: "Self - Branch Deposit",
        channel: "Branch",
        flagReason: "Below threshold",
      },
      {
        id: "tx2",
        date: "2025-04-06T14:45:00Z",
        type: "Credit",
        amount: 4800000,
        currency: "NGN",
        counterparty: "Self - ATM",
        channel: "ATM",
        flagReason: "Below threshold",
      },
      {
        id: "tx3",
        date: "2025-04-07T10:05:00Z",
        type: "Transfer",
        amount: 9500000,
        currency: "NGN",
        counterparty: "Olu Holdings Ltd",
        channel: "Mobile",
        flagReason: "Aggregated amount",
      },
      {
        id: "tx4",
        date: "2025-04-08T08:30:00Z",
        type: "Credit",
        amount: 4850000,
        currency: "NGN",
        counterparty: "Self - Branch Deposit",
        channel: "Branch",
        flagReason: "Repeated pattern",
      },
    ],
  },
  {
    id: "ALT-2025-0040",
    riskScore: 85,
    customerName: "Chinedu Eze",
    customerId: "CUS-77104",
    bvn: "22187xxxxxx",
    alertType: "PEP Match",
    timestamp: "2025-04-09T07:15:00Z",
    status: "Under Review",
    kycTier: "Tier 3",
    riskLevel: "High",
    accountNumber: "00456xxxx23",
    totalFlagged: 28000000,
    summary: "Customer matched against updated PEP list. Recent high-value international wire transfers flagged.",
    transactionTimeline: [
      {
        id: "tx5",
        date: "2025-04-03T11:00:00Z",
        type: "Wire Out",
        amount: 15000000,
        currency: "NGN",
        counterparty: "Cayman Intl Corp",
        channel: "SWIFT",
        flagReason: "High-risk jurisdiction",
      },
      {
        id: "tx6",
        date: "2025-04-05T09:30:00Z",
        type: "Wire Out",
        amount: 13000000,
        currency: "NGN",
        counterparty: "Cayman Intl Corp",
        channel: "SWIFT",
        flagReason: "Repeat beneficiary",
      },
    ],
  },
  {
    id: "ALT-2025-0039",
    riskScore: 74,
    customerName: "Fatima Abdullahi",
    customerId: "CUS-65520",
    bvn: "22145xxxxxx",
    alertType: "Velocity Spike",
    timestamp: "2025-04-08T22:10:00Z",
    status: "Open",
    kycTier: "Tier 3",
    riskLevel: "High",
    accountNumber: "00789xxxx56",
    totalFlagged: 8200000,
    summary: "Transaction frequency spiked 400% above the customer's 90-day baseline within a 24-hour window.",
    transactionTimeline: [
      {
        id: "tx7",
        date: "2025-04-08T06:00:00Z",
        type: "Transfer",
        amount: 1200000,
        currency: "NGN",
        counterparty: "Various Individuals",
        channel: "Mobile",
      },
      {
        id: "tx8",
        date: "2025-04-08T08:15:00Z",
        type: "Transfer",
        amount: 1500000,
        currency: "NGN",
        counterparty: "Various Individuals",
        channel: "Mobile",
      },
      {
        id: "tx9",
        date: "2025-04-08T12:30:00Z",
        type: "Transfer",
        amount: 2000000,
        currency: "NGN",
        counterparty: "Market Traders Assoc",
        channel: "USSD",
      },
      {
        id: "tx10",
        date: "2025-04-08T16:45:00Z",
        type: "POS",
        amount: 1800000,
        currency: "NGN",
        counterparty: "Vendor POS Terminal",
        channel: "POS",
        flagReason: "Unusual channel",
      },
      {
        id: "tx11",
        date: "2025-04-08T20:00:00Z",
        type: "Transfer",
        amount: 1700000,
        currency: "NGN",
        counterparty: "Unknown Individual",
        channel: "Mobile",
        flagReason: "New beneficiary",
      },
    ],
  },
  {
    id: "ALT-2025-0038",
    riskScore: 61,
    customerName: "Emeka Nwosu",
    customerId: "CUS-54301",
    bvn: "22134xxxxxx",
    alertType: "Round-Tripping",
    timestamp: "2025-04-08T16:42:00Z",
    status: "Open",
    kycTier: "Tier 3",
    riskLevel: "Medium",
    accountNumber: "00234xxxx78",
    totalFlagged: 6000000,
    summary: "Funds sent to a third-party account returned within hours, suggesting layering activity.",
    transactionTimeline: [
      {
        id: "tx12",
        date: "2025-04-08T10:00:00Z",
        type: "Transfer",
        amount: 3000000,
        currency: "NGN",
        counterparty: "Bright Futures Ltd",
        channel: "Internet Banking",
        flagReason: "Layering suspect",
      },
      {
        id: "tx13",
        date: "2025-04-08T13:30:00Z",
        type: "Credit",
        amount: 2950000,
        currency: "NGN",
        counterparty: "Bright Futures Ltd",
        channel: "Internet Banking",
        flagReason: "Return transfer",
      },
    ],
  },
  {
    id: "ALT-2025-0037",
    riskScore: 45,
    customerName: "Ngozi Okafor",
    customerId: "CUS-43112",
    bvn: "22156xxxxxx",
    alertType: "Threshold Breach",
    timestamp: "2025-04-08T11:20:00Z",
    status: "Open",
    kycTier: "Tier 3",
    riskLevel: "Medium",
    accountNumber: "00567xxxx90",
    totalFlagged: 12000000,
    summary: "Single transaction exceeded the ₦10M daily limit for this account tier.",
    transactionTimeline: [
      {
        id: "tx14",
        date: "2025-04-08T11:15:00Z",
        type: "Wire Out",
        amount: 12000000,
        currency: "NGN",
        counterparty: "Okafor Enterprises",
        channel: "SWIFT",
        flagReason: "Over daily limit",
      },
    ],
  },
  {
    id: "ALT-2025-0036",
    riskScore: 33,
    customerName: "Ibrahim Musa",
    customerId: "CUS-31998",
    bvn: "22178xxxxxx",
    alertType: "Sanctions Hit",
    timestamp: "2025-04-07T15:55:00Z",
    status: "Escalated",
    kycTier: "Tier 3",
    riskLevel: "Low",
    accountNumber: "00890xxxx12",
    totalFlagged: 500000,
    summary: "Beneficiary name partially matched against OFAC SDN list. Manual review cleared as false positive.",
    transactionTimeline: [
      {
        id: "tx15",
        date: "2025-04-07T15:50:00Z",
        type: "Transfer",
        amount: 500000,
        currency: "NGN",
        counterparty: "Mohammed Al-Rashid",
        channel: "Mobile",
        flagReason: "Name match - OFAC",
      },
    ],
  },
];
export interface Transaction {
  id: string;
  date: string;
  type: "Credit" | "Debit";
  amountNGN: number;
  counterparty: string;
  balanceAfter: number;
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
  status: "Open" | "Under Review" | "Escalated" | "Dismissed";
  riskLevel: "Critical" | "High" | "Medium" | "Low";
  ruleTriggered: string;
  timestamp: string;
  timeElapsed: string;
  customerProfile: CustomerProfile;
  description: string;
  transactions: Transaction[];
  behavioralRedFlags: string[];
  aiDraftedNarrative: string;
}

export const mockWorkspaceAlerts: Alert[] = [
  {
    id: "ALT-2026-0891",
    caseId: "CAS-2026-0891-NG",
    status: "Open",
    riskLevel: "Critical",
    ruleTriggered: "High-Velocity Inflow/Outflow (Structuring)",
    timestamp: "2026-04-09T14:30:00Z",
    timeElapsed: "2h ago",
    description:
      "Subject exceeded Tier 1 limits via structured inflows from distinct POS terminals, followed by immediate liquidation to known Virtual Asset Service Provider (VASP).",
    customerProfile: {
      fullName: "Emeka Chidi Nwosu",
      bvn: "22459810344",
      nin: "81900234112",
      nuban: "0123456789",
      kycTier: "Tier 1 (Limit: ₦50,000/day)",
      occupation: "Student",
      registeredAddress: "42 Bode Thomas Street, Surulere, Lagos",
      riskScore: 88,
    },
    transactions: [
      {
        id: "tx-01",
        date: "2026-04-08T09:15:00Z",
        type: "Credit",
        amountNGN: 45000,
        counterparty: "POS/Moniepoint/Ikeja",
        balanceAfter: 45500,
      },
      {
        id: "tx-02",
        date: "2026-04-08T11:45:00Z",
        type: "Credit",
        amountNGN: 48000,
        counterparty: "POS/Opay/Oshodi",
        balanceAfter: 93500,
      },
      {
        id: "tx-03",
        date: "2026-04-08T14:20:00Z",
        type: "Credit",
        amountNGN: 49000,
        counterparty: "POS/Palmpay/Mainland",
        balanceAfter: 142500,
      },
      {
        id: "tx-04",
        date: "2026-04-08T14:35:00Z",
        type: "Debit",
        amountNGN: 140000,
        counterparty: "BaraqTech BDC (Suspected P2P)",
        balanceAfter: 2500,
      },
    ],
    behavioralRedFlags: [
      "IP Address mismatch: Login from 197.210.X.X (Abuja) but POS transactions localized in Lagos.",
      "Account velocity: Funds remain in account for an average of 18 minutes before outflow.",
      "Limit breach: Tier 1 daily cumulative limit of ₦50,000 bypassed via API fragmentation.",
    ],
    aiDraftedNarrative:
      "The subject, Emeka Chidi Nwosu, a Tier 1 account holder, systematically evaded the ₦50,000 daily transaction limit by utilizing geographically dispersed POS terminals (Moniepoint, Opay, Palmpay) across Lagos. Within a 5-hour window, the subject received three structured deposits totaling ₦142,000. These funds were subsequently aggregated and transferred out within 15 minutes to BaraqTech BDC, a suspected Virtual Asset Service Provider. The rapid velocity of funds and IP geolocation mismatches strongly indicate pass-through account behavior for crypto-arbitrage or layering operations. Account restriction has been applied pending NFIU guidance.",
  },
  {
    id: "ALT-2026-0892",
    caseId: "CAS-2026-0892-NG",
    status: "Under Review",
    riskLevel: "High",
    ruleTriggered: "Unusual Midnight e-Channel Spikes",
    timestamp: "2026-04-09T03:15:00Z",
    timeElapsed: "12h ago",
    description:
      "Multiple rapid intra-bank transfers executed between 2:00 AM and 3:00 AM, deviating from the customer's historical transaction profile.",
    customerProfile: {
      fullName: "Fatima Bello",
      bvn: "22345678904",
      nin: "81234567890",
      nuban: "0987654321",
      kycTier: "Tier 3 (No Limits)",
      occupation: "Retail Merchant",
      registeredAddress: "15 Aminu Kano Crescent, Wuse II, Abuja",
      riskScore: 75,
    },
    transactions: [
      {
        id: "tx-05",
        date: "2026-04-09T02:10:00Z",
        type: "Debit",
        amountNGN: 500000,
        counterparty: "Bet9ja Wallet Topup",
        balanceAfter: 1200500,
      },
      {
        id: "tx-06",
        date: "2026-04-09T02:25:00Z",
        type: "Debit",
        amountNGN: 500000,
        counterparty: "Bet9ja Wallet Topup",
        balanceAfter: 700500,
      },
      {
        id: "tx-07",
        date: "2026-04-09T02:40:00Z",
        type: "Debit",
        amountNGN: 500000,
        counterparty: "SportyBet Wallet Topup",
        balanceAfter: 200500,
      },
    ],
    behavioralRedFlags: [
      "Time-of-day anomaly: 100% of transaction volume occurred outside regular banking hours.",
      "New device login: Transactions initiated from an unrecognized Android device.",
      "Gaming platform funneling: Sudden escalation of funds directed to high-risk merchant categories (Betting/Gambling).",
    ],
    aiDraftedNarrative:
      "The subject, Fatima Bello, experienced anomalous account activity deviating entirely from historical patterns. Between 02:10 AM and 02:40 AM WAT, three consecutive ₦500,000 debits were executed, draining the account balance by ₦1,500,000. These funds were directed to online betting wallets (Bet9ja and SportyBet). Coupled with an unverified new device login, this typology is highly indicative of Account Takeover (ATO) fraud converging with money laundering via gambling platforms. The subject's e-channels have been temporarily frozen pending verbal verification.",
  },
];
