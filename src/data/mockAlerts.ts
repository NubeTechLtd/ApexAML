export type AlertType = 'Structuring' | 'PEP Match' | 'Velocity Spike' | 'Sanctions Hit' | 'Round-Tripping' | 'Threshold Breach';
export type RiskLevel = 'Critical' | 'High' | 'Medium' | 'Low';
export type AlertStatus = 'Open' | 'Under Review' | 'Escalated' | 'Dismissed';

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
    id: 'ALT-2025-0041',
    riskScore: 92,
    customerName: 'Adebayo Ogundimu',
    customerId: 'CUS-88291',
    bvn: '22198xxxxxx',
    alertType: 'Structuring',
    timestamp: '2025-04-09T08:32:00Z',
    status: 'Open',
    kycTier: 'Tier 3',
    riskLevel: 'Critical',
    accountNumber: '00123xxxx91',
    totalFlagged: 14500000,
    summary: 'Multiple deposits just below the ₦5M reporting threshold detected over 3 consecutive days across two accounts.',
    transactionTimeline: [
      { id: 'tx1', date: '2025-04-06T09:12:00Z', type: 'Credit', amount: 4900000, currency: 'NGN', counterparty: 'Self - Branch Deposit', channel: 'Branch', flagReason: 'Below threshold' },
      { id: 'tx2', date: '2025-04-06T14:45:00Z', type: 'Credit', amount: 4800000, currency: 'NGN', counterparty: 'Self - ATM', channel: 'ATM', flagReason: 'Below threshold' },
      { id: 'tx3', date: '2025-04-07T10:05:00Z', type: 'Transfer', amount: 9500000, currency: 'NGN', counterparty: 'Olu Holdings Ltd', channel: 'Mobile', flagReason: 'Aggregated amount' },
      { id: 'tx4', date: '2025-04-08T08:30:00Z', type: 'Credit', amount: 4850000, currency: 'NGN', counterparty: 'Self - Branch Deposit', channel: 'Branch', flagReason: 'Repeated pattern' },
    ],
  },
  {
    id: 'ALT-2025-0040',
    riskScore: 85,
    customerName: 'Chinedu Eze',
    customerId: 'CUS-77104',
    bvn: '22187xxxxxx',
    alertType: 'PEP Match',
    timestamp: '2025-04-09T07:15:00Z',
    status: 'Under Review',
    kycTier: 'Tier 3',
    riskLevel: 'High',
    accountNumber: '00456xxxx23',
    totalFlagged: 28000000,
    summary: 'Customer matched against updated PEP list. Recent high-value international wire transfers flagged.',
    transactionTimeline: [
      { id: 'tx5', date: '2025-04-03T11:00:00Z', type: 'Wire Out', amount: 15000000, currency: 'NGN', counterparty: 'Cayman Intl Corp', channel: 'SWIFT', flagReason: 'High-risk jurisdiction' },
      { id: 'tx6', date: '2025-04-05T09:30:00Z', type: 'Wire Out', amount: 13000000, currency: 'NGN', counterparty: 'Cayman Intl Corp', channel: 'SWIFT', flagReason: 'Repeat beneficiary' },
    ],
  },
  {
    id: 'ALT-2025-0039',
    riskScore: 74,
    customerName: 'Fatima Abdullahi',
    customerId: 'CUS-65520',
    bvn: '22145xxxxxx',
    alertType: 'Velocity Spike',
    timestamp: '2025-04-08T22:10:00Z',
    status: 'Open',
    kycTier: 'Tier 3',
    riskLevel: 'High',
    accountNumber: '00789xxxx56',
    totalFlagged: 8200000,
    summary: 'Transaction frequency spiked 400% above the customer\'s 90-day baseline within a 24-hour window.',
    transactionTimeline: [
      { id: 'tx7', date: '2025-04-08T06:00:00Z', type: 'Transfer', amount: 1200000, currency: 'NGN', counterparty: 'Various Individuals', channel: 'Mobile' },
      { id: 'tx8', date: '2025-04-08T08:15:00Z', type: 'Transfer', amount: 1500000, currency: 'NGN', counterparty: 'Various Individuals', channel: 'Mobile' },
      { id: 'tx9', date: '2025-04-08T12:30:00Z', type: 'Transfer', amount: 2000000, currency: 'NGN', counterparty: 'Market Traders Assoc', channel: 'USSD' },
      { id: 'tx10', date: '2025-04-08T16:45:00Z', type: 'POS', amount: 1800000, currency: 'NGN', counterparty: 'Vendor POS Terminal', channel: 'POS', flagReason: 'Unusual channel' },
      { id: 'tx11', date: '2025-04-08T20:00:00Z', type: 'Transfer', amount: 1700000, currency: 'NGN', counterparty: 'Unknown Individual', channel: 'Mobile', flagReason: 'New beneficiary' },
    ],
  },
  {
    id: 'ALT-2025-0038',
    riskScore: 61,
    customerName: 'Emeka Nwosu',
    customerId: 'CUS-54301',
    bvn: '22134xxxxxx',
    alertType: 'Round-Tripping',
    timestamp: '2025-04-08T16:42:00Z',
    status: 'Open',
    kycTier: 'Tier 3',
    riskLevel: 'Medium',
    accountNumber: '00234xxxx78',
    totalFlagged: 6000000,
    summary: 'Funds sent to a third-party account returned within hours, suggesting layering activity.',
    transactionTimeline: [
      { id: 'tx12', date: '2025-04-08T10:00:00Z', type: 'Transfer', amount: 3000000, currency: 'NGN', counterparty: 'Bright Futures Ltd', channel: 'Internet Banking', flagReason: 'Layering suspect' },
      { id: 'tx13', date: '2025-04-08T13:30:00Z', type: 'Credit', amount: 2950000, currency: 'NGN', counterparty: 'Bright Futures Ltd', channel: 'Internet Banking', flagReason: 'Return transfer' },
    ],
  },
  {
    id: 'ALT-2025-0037',
    riskScore: 45,
    customerName: 'Ngozi Okafor',
    customerId: 'CUS-43112',
    bvn: '22156xxxxxx',
    alertType: 'Threshold Breach',
    timestamp: '2025-04-08T11:20:00Z',
    status: 'Open',
    kycTier: 'Tier 3',
    riskLevel: 'Medium',
    accountNumber: '00567xxxx90',
    totalFlagged: 12000000,
    summary: 'Single transaction exceeded the ₦10M daily limit for this account tier.',
    transactionTimeline: [
      { id: 'tx14', date: '2025-04-08T11:15:00Z', type: 'Wire Out', amount: 12000000, currency: 'NGN', counterparty: 'Okafor Enterprises', channel: 'SWIFT', flagReason: 'Over daily limit' },
    ],
  },
  {
    id: 'ALT-2025-0036',
    riskScore: 33,
    customerName: 'Ibrahim Musa',
    customerId: 'CUS-31998',
    bvn: '22178xxxxxx',
    alertType: 'Sanctions Hit',
    timestamp: '2025-04-07T15:55:00Z',
    status: 'Escalated',
    kycTier: 'Tier 3',
    riskLevel: 'Low',
    accountNumber: '00890xxxx12',
    totalFlagged: 500000,
    summary: 'Beneficiary name partially matched against OFAC SDN list. Manual review cleared as false positive.',
    transactionTimeline: [
      { id: 'tx15', date: '2025-04-07T15:50:00Z', type: 'Transfer', amount: 500000, currency: 'NGN', counterparty: 'Mohammed Al-Rashid', channel: 'Mobile', flagReason: 'Name match - OFAC' },
    ],
  },
];
