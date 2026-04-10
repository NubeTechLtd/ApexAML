export type KYCStatus = 'Pending' | 'In Review' | 'Escalated' | 'Verified';

export interface KYCCustomer {
  id: string;
  name: string;
  bvn: string;
  nin: string;
  bvnMatch: 'match' | 'mismatch' | 'pending';
  ninMatch: 'match' | 'mismatch' | 'pending';
  livenessCheck: 'pass' | 'fail' | 'pending';
  livenessConfidence: number;
  riskTier: 'low' | 'medium' | 'high';
  kycTier: string;
  status: KYCStatus;
  submittedAt: string;
  bvnVerifiedAt?: string;
  ninVerifiedAt?: string;
  bvnFailReason?: string;
  ninFailReason?: string;
  email: string;
  phone: string;
  address: string;
  smileIdentityScore: number;
  nibssVerified: boolean;
  governmentPhotoUrl: string;
  selfieUrl: string;
  documents: { name: string; type: string; uploadedAt: string }[];
}

export const mockKYCCustomers: KYCCustomer[] = [
  {
    id: 'kyc-001',
    name: 'Chidinma Okafor',
    bvn: '22345678901',
    nin: '12345678901',
    bvnMatch: 'match',
    ninMatch: 'match',
    livenessCheck: 'pass',
    livenessConfidence: 96,
    riskTier: 'low',
    kycTier: 'Tier 3',
    status: 'Verified',
    submittedAt: '2026-04-09T08:12:00Z',
    bvnVerifiedAt: '2026-04-09T08:14:22Z',
    ninVerifiedAt: '2026-04-09T08:14:25Z',
    email: 'chidinma.okafor@email.com',
    phone: '+234 801 234 5678',
    address: '14 Admiralty Way, Lekki Phase 1, Lagos',
    smileIdentityScore: 96,
    nibssVerified: true,
    governmentPhotoUrl: '',
    selfieUrl: '',
    documents: [
      { name: 'Utility_Bill_Mar2026.pdf', type: 'Proof of Address', uploadedAt: '2026-04-08' },
    ],
  },
  {
    id: 'kyc-002',
    name: 'Emeka Nwosu',
    bvn: '33456789012',
    nin: '23456789012',
    bvnMatch: 'match',
    ninMatch: 'mismatch',
    livenessCheck: 'fail',
    livenessConfidence: 42,
    riskTier: 'high',
    kycTier: 'Tier 1',
    status: 'Escalated',
    submittedAt: '2026-04-09T07:45:00Z',
    bvnVerifiedAt: '2026-04-09T07:47:10Z',
    ninFailReason: 'Name mismatch — NIN record shows "Emeka C. Nwosuh"',
    email: 'emeka.nwosu@email.com',
    phone: '+234 802 345 6789',
    address: '7 Trans Amadi Road, Port Harcourt',
    smileIdentityScore: 42,
    nibssVerified: false,
    governmentPhotoUrl: '',
    selfieUrl: '',
    documents: [],
  },
  {
    id: 'kyc-003',
    name: 'Fatima Abdullahi',
    bvn: '44567890123',
    nin: '34567890123',
    bvnMatch: 'match',
    ninMatch: 'match',
    livenessCheck: 'pending',
    livenessConfidence: 0,
    riskTier: 'medium',
    kycTier: 'Tier 2',
    status: 'In Review',
    submittedAt: '2026-04-09T09:30:00Z',
    bvnVerifiedAt: '2026-04-09T09:32:05Z',
    ninVerifiedAt: '2026-04-09T09:32:08Z',
    email: 'fatima.abdullahi@email.com',
    phone: '+234 803 456 7890',
    address: '22 Sultan Road, Kaduna',
    smileIdentityScore: 78,
    nibssVerified: true,
    governmentPhotoUrl: '',
    selfieUrl: '',
    documents: [
      { name: 'CAC_Certificate.pdf', type: 'Corporate Registry', uploadedAt: '2026-04-07' },
    ],
  },
  {
    id: 'kyc-004',
    name: 'Oluwaseun Adeyemi',
    bvn: '55678901234',
    nin: '45678901234',
    bvnMatch: 'mismatch',
    ninMatch: 'match',
    livenessCheck: 'pass',
    livenessConfidence: 61,
    riskTier: 'high',
    kycTier: 'Tier 2',
    status: 'In Review',
    submittedAt: '2026-04-08T16:20:00Z',
    bvnFailReason: 'DOB mismatch — BVN shows 1992, application shows 1990',
    ninVerifiedAt: '2026-04-08T16:22:30Z',
    email: 'seun.adeyemi@email.com',
    phone: '+234 805 678 9012',
    address: '3 Awolowo Road, Ikoyi, Lagos',
    smileIdentityScore: 61,
    nibssVerified: true,
    governmentPhotoUrl: '',
    selfieUrl: '',
    documents: [
      { name: 'Bank_Statement_Q1.pdf', type: 'Financial Document', uploadedAt: '2026-04-06' },
      { name: 'Passport_Scan.pdf', type: 'Identity Document', uploadedAt: '2026-04-06' },
    ],
  },
  {
    id: 'kyc-005',
    name: 'Amina Bello',
    bvn: '66789012345',
    nin: '56789012345',
    bvnMatch: 'pending',
    ninMatch: 'pending',
    livenessCheck: 'pending',
    livenessConfidence: 0,
    riskTier: 'medium',
    kycTier: 'Tier 1',
    status: 'Pending',
    submittedAt: '2026-04-09T10:05:00Z',
    email: 'amina.bello@email.com',
    phone: '+234 806 789 0123',
    address: '15 Independence Avenue, Abuja',
    smileIdentityScore: 0,
    nibssVerified: false,
    governmentPhotoUrl: '',
    selfieUrl: '',
    documents: [],
  },
  {
    id: 'kyc-006',
    name: 'Ikechukwu Eze',
    bvn: '77890123456',
    nin: '67890123456',
    bvnMatch: 'match',
    ninMatch: 'match',
    livenessCheck: 'pass',
    livenessConfidence: 94,
    riskTier: 'low',
    kycTier: 'Tier 3',
    status: 'Verified',
    submittedAt: '2026-04-08T14:50:00Z',
    bvnVerifiedAt: '2026-04-08T14:52:15Z',
    ninVerifiedAt: '2026-04-08T14:52:18Z',
    email: 'ike.eze@email.com',
    phone: '+234 807 890 1234',
    address: '9 New Market Road, Onitsha',
    smileIdentityScore: 94,
    nibssVerified: true,
    governmentPhotoUrl: '',
    selfieUrl: '',
    documents: [
      { name: 'PHCN_Bill_Feb2026.pdf', type: 'Proof of Address', uploadedAt: '2026-04-05' },
    ],
  },
];
