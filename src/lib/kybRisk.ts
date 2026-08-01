import {
  HIGH_RISK_SECTORS,
  type BusinessType,
  type CorporateEntity,
} from '@/data/mockKYB';
import type { KycDocumentType } from '@/lib/kycDocuments';

export interface KybRiskFactor {
  label: string;
  points: number;
  detail: string;
}

export interface KybRiskResult {
  score: number;
  band: 'Low' | 'Medium' | 'High' | 'Critical';
  factors: KybRiskFactor[];
  noMajorityUbo: boolean;
}

export function requiredKybDocs(type: BusinessType): KycDocumentType[] {
  switch (type) {
    case 'Business Name':
      return ['CAC_CERT', 'PROPRIETOR_ID', 'UTILITY_BILL'];
    case 'Incorporated Trustee':
      return ['CAC_CERT', 'TRUST_DEED', 'BOARD_RESOLUTION', 'UTILITY_BILL', 'ANNUAL_RETURN'];
    case 'Public Limited':
    case 'Private Limited':
    default:
      return ['CAC_CERT', 'MEMART', 'ANNUAL_RETURN', 'UTILITY_BILL', 'AUDITED_ACCOUNTS'];
  }
}

/** Additive KYB risk model, capped 0–100. */
export function calculateKybRisk(entity: CorporateEntity, documentsOnFile: number, documentsRequired: number): KybRiskResult {
  const factors: KybRiskFactor[] = [];
  let score = 10;
  factors.push({ label: 'Base corporate exposure', points: 10, detail: 'Every corporate relationship carries a baseline risk.' });

  if (HIGH_RISK_SECTORS.has(entity.industry)) {
    score += 25;
    factors.push({ label: 'Higher-risk industry', points: 25, detail: `${entity.industry} is a CBN/FATF designated higher-risk sector.` });
  } else {
    factors.push({ label: 'Industry risk', points: 0, detail: `${entity.industry} is not on the CBN higher-risk list.` });
  }

  const naturalOwners = entity.owners.filter(o => o.role !== 'Director' || o.bvn !== '—');
  const maxNaturalStake = Math.max(
    0,
    ...entity.owners.filter(o => /^\d{11}$/.test(o.bvn)).map(o => o.ownershipPct),
  );
  const noMajorityUbo = maxNaturalStake < 25;
  if (noMajorityUbo) {
    score += 20;
    factors.push({
      label: 'No 25%+ natural-person owner',
      points: 20,
      detail: 'CBN AML/CFT Regulations require identification of every natural person holding 25% or more. None identified — complex ownership structure.',
    });
  }

  if (entity.owners.length > 3) {
    score += 8;
    factors.push({ label: 'Ownership complexity', points: 8, detail: `${entity.owners.length} owners/controllers recorded.` });
  }

  const unverified = naturalOwners.filter(o => !o.bvnVerified).length;
  if (unverified > 0) {
    const pts = Math.min(15, unverified * 6);
    score += pts;
    factors.push({ label: 'Unverified owners/directors', points: pts, detail: `${unverified} owner(s) still awaiting BVN verification.` });
  }

  if (entity.sanctionsHit) {
    score += 30;
    factors.push({ label: 'Sanctions match on a director', points: 30, detail: 'A director matched a screened sanctions list — escalate before onboarding.' });
  }

  const pepHits = entity.owners.filter(o => o.pepHit).length;
  if (pepHits > 0) {
    score += 15;
    factors.push({ label: 'PEP exposure', points: 15, detail: `${pepHits} director(s) flagged as politically exposed.` });
  }

  const missingDocs = Math.max(0, documentsRequired - documentsOnFile);
  if (missingDocs > 0) {
    const pts = Math.min(12, missingDocs * 3);
    score += pts;
    factors.push({ label: 'Incomplete documentation', points: pts, detail: `${missingDocs} of ${documentsRequired} required documents not yet on file.` });
  } else if (documentsRequired > 0) {
    score -= 5;
    factors.push({ label: 'Full documentation on file', points: -5, detail: 'All required CAC documents received.' });
  }

  if (!entity.cacVerified) {
    score += 10;
    factors.push({ label: 'CAC registration unverified', points: 10, detail: 'Registration number has not been confirmed against CAC records.' });
  }

  score = Math.max(0, Math.min(100, score));
  const band = score >= 75 ? 'Critical' : score >= 50 ? 'High' : score >= 30 ? 'Medium' : 'Low';
  return { score, band, factors, noMajorityUbo };
}
