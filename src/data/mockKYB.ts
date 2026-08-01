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

export const mockCorporateEntities: CorporateEntity[] = [
  {
    id: 'KYB-001',
    companyName: 'Greenlight Trading Ltd',
    rcNumber: 'RC-1234567',
    risk: 'High',
    status: 'Pending',
    daysInQueue: 11,
    registrationDate: '2021-03-18',
    registeredAddress: '14B Adeola Odeku Street, Victoria Island, Lagos',
    businessType: 'Private Limited',
    industry: 'Dealers in Precious Metals & Stones',
    turnoverRange: '₦500m – ₦1bn',
    employees: '11 – 50',
    cacVerified: false,
    sanctionsHit: false,
    owners: [
      { id: 'ubo-1', fullName: 'Emeka Nwosu', bvn: '22183940271', nin: '71829304517', ownershipPct: 18, role: 'Shareholder' },
      { id: 'ubo-2', fullName: 'Blueridge Holdings BVI', bvn: '—', nin: '—', ownershipPct: 62, role: 'Shareholder' },
      { id: 'ubo-3', fullName: 'Halima Yakubu', bvn: '22904471820', nin: '38271940556', ownershipPct: 20, role: 'Director' },
    ],
    makerSignoff: null,
    decision: null,
  },
  {
    id: 'KYB-002',
    companyName: 'Okafor & Sons International',
    rcNumber: 'RC-7654321',
    risk: 'Medium',
    status: 'In Progress',
    daysInQueue: 4,
    registrationDate: '2016-09-02',
    registeredAddress: '7 Ogui Road, Enugu, Enugu State',
    businessType: 'Private Limited',
    industry: 'Import & Export Trading',
    turnoverRange: '₦100m – ₦500m',
    employees: '51 – 200',
    cacVerified: true,
    sanctionsHit: false,
    owners: [
      { id: 'ubo-4', fullName: 'Chidi Okafor', bvn: '22118374650', nin: '29184756301', ownershipPct: 55, role: 'UBO', bvnVerified: true, pepScreened: true },
      { id: 'ubo-5', fullName: 'Ngozi Okafor', bvn: '22765412093', nin: '48120397465', ownershipPct: 45, role: 'Director' },
    ],
    makerSignoff: null,
    decision: null,
  },
  {
    id: 'KYB-003',
    companyName: 'Lagos Micro Ventures Ltd',
    rcNumber: 'BN-4521896',
    risk: 'Low',
    status: 'Pending',
    daysInQueue: 2,
    registrationDate: '2023-11-27',
    registeredAddress: '29 Allen Avenue, Ikeja, Lagos',
    businessType: 'Business Name',
    industry: 'Retail & FMCG',
    turnoverRange: 'Below ₦25m',
    employees: '1 – 10',
    cacVerified: true,
    sanctionsHit: false,
    owners: [
      { id: 'ubo-6', fullName: 'Aisha Bello', bvn: '22093847561', nin: '10293847561', ownershipPct: 100, role: 'UBO', bvnVerified: true, pepScreened: true },
    ],
    makerSignoff: null,
    decision: null,
  },
];
