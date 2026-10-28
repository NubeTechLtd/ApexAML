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
