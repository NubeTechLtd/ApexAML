export type KybStatus = 'Pending' | 'In Progress' | 'Approved' | 'Rejected';
export type KybRisk = 'High' | 'Medium' | 'Low';
export type BusinessType = 'Private Limited' | 'Public Limited' | 'Business Name' | 'Incorporated Trustee';
export type UboRole = 'Director' | 'Shareholder' | 'UBO';

export interface BeneficialOwner {
  id: string;
  fullName: string;
  bvn: string;
  nin: string;
  ownershipPct: number;
  role: UboRole;
  bvnVerified?: boolean;
  pepScreened?: boolean;
  pepHit?: boolean;
}

export interface CorporateEntity {
  id: string;
  companyName: string;
  rcNumber: string;
  risk: KybRisk;
  status: KybStatus;
  daysInQueue: number;
  registrationDate: string;
  registeredAddress: string;
  businessType: BusinessType;
  industry: string;
  turnoverRange: string;
  employees: string;
  cacVerified: boolean;
  owners: BeneficialOwner[];
  sanctionsHit: boolean;
  makerSignoff?: { analyst: string; at: string; decision: 'Approve' | 'Reject'; justification: string } | null;
  decision?: { analyst: string; at: string; decision: 'Approved' | 'Rejected'; justification: string } | null;
}

/** CBN / FATF designated higher-risk sectors for Nigerian institutions. */
export const CBN_HIGH_RISK_INDUSTRIES = [
  'Real Estate & Property Development',
  'Legal Services',
  'Accountancy & Audit',
  'Dealers in Precious Metals & Stones',
  'Bureau de Change / FX Dealing',
  'Casinos & Gaming',
  'Oil & Gas Trading',
  'Cryptocurrency / Virtual Asset Services',
  'Import & Export Trading',
  'Non-Governmental Organisation',
  'Construction & Engineering',
  'Logistics & Haulage',
  'Agriculture',
  'Retail & FMCG',
  'Information Technology',
];

export const HIGH_RISK_SECTORS = new Set([
  'Real Estate & Property Development',
  'Legal Services',
  'Accountancy & Audit',
  'Dealers in Precious Metals & Stones',
  'Bureau de Change / FX Dealing',
  'Casinos & Gaming',
  'Oil & Gas Trading',
  'Cryptocurrency / Virtual Asset Services',
  'Non-Governmental Organisation',
]);

export const BUSINESS_TYPES: BusinessType[] = [
  'Private Limited',
  'Public Limited',
  'Business Name',
  'Incorporated Trustee',
];

export const TURNOVER_RANGES = [
  'Below ₦25m',
  '₦25m – ₦100m',
  '₦100m – ₦500m',
  '₦500m – ₦1bn',
  'Above ₦1bn',
];

export const EMPLOYEE_RANGES = ['1 – 10', '11 – 50', '51 – 200', '201 – 1,000', 'Above 1,000'];
