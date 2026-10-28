export interface ConnectedEntity {
  id: string;
  label: string;
  type:
    | 'Shared Device ID'
    | 'Frequent Transfer Target'
    | 'Shared Address'
    | 'Common Beneficiary'
    | 'Common IP Address'
    | 'Bureau de Change (BDC)';
  detail: string;
}

export type EntityType =
  | 'Individual'
  | 'Sole Trader'
  | 'Nigerian Business'
  | 'Foreign Business'
  | 'IMTO Agent';

export type RemittancePurpose =
  | 'Payroll'
  | 'Trade Payment'
  | 'Family Support'
  | 'Business Expense';

export interface BeneficialOwner {
  id: string;
  name: string;
  ownershipPct: number;
  pepStatus: 'Clear' | 'Match' | 'Pending';
}

export interface ForeignBusinessKYB {
  countryOfRegistration: string;
  companyRegistrationNumber: string;
  beneficialOwners: BeneficialOwner[];
  declaredRemittancePurpose: RemittancePurpose;
  averageMonthlyTransferVolumeNGN: number;
}

export interface Customer360Data {
  id: number;
  name: string;
  bvn: string;
  nin: string;
  dob: string;
  riskLevel: 'High' | 'Medium' | 'Low';
  riskScore: number;
  kycTier: string;
  bvnVerified: boolean;
  livenessCheck: 'Pass' | 'Fail' | 'Pending';
  accountStatus: 'Active' | 'Frozen' | 'Restricted';
  alerts: number;
  email: string;
  phone: string;
  address: string;
  /** Entity classification — drives KYB requirements. Defaults to Individual when unset. */
  entityType?: EntityType;
  /** CAC registration number (Nigerian Business only). */
  cacNumber?: string;
  /** Extended KYB block — required when entityType === 'Foreign Business'. */
  foreignKYB?: ForeignBusinessKYB;
  radarScores: { axis: string; value: number }[];
  connectedEntities: ConnectedEntity[];
  eddDocuments: { name: string; type: string; uploadedAt: string }[];
}
