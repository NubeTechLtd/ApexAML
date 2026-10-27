import type { KycDocument } from '@/data-layer/types';

export type { KycDocument } from '@/data-layer/types';
export const KYC_BUCKET = 'kyc-documents';
export const MAX_FILE_BYTES = 5 * 1024 * 1024;
export const ACCEPTED_MIME = ['application/pdf', 'image/jpeg', 'image/png'];
export const ACCEPT_ATTR = '.pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png';

export type KycDocumentType =
  | 'BVN_SLIP'
  | 'NIN_SLIP'
  | 'UTILITY_BILL'
  | 'EMPLOYMENT_LETTER'
  | 'PASSPORT'
  | 'CAC_CERT'
  | 'TIN_CERT'
  | 'SOURCE_OF_FUNDS'
  | 'MEMART'
  | 'ANNUAL_RETURN'
  | 'AUDITED_ACCOUNTS'
  | 'PROPRIETOR_ID'
  | 'BOARD_RESOLUTION'
  | 'TRUST_DEED'
  | 'OTHER';

export const DOCUMENT_LABELS: Record<KycDocumentType, string> = {
  BVN_SLIP: 'BVN slip',
  NIN_SLIP: 'NIN slip',
  UTILITY_BILL: 'Utility bill (not older than 3 months)',
  EMPLOYMENT_LETTER: 'Employment letter',
  PASSPORT: 'Government ID (passport / driver’s licence)',
  CAC_CERT: 'CAC certificate of incorporation',
  TIN_CERT: 'TIN certificate',
  SOURCE_OF_FUNDS: 'Source of funds declaration',
  MEMART: 'MEMART (memorandum & articles of association)',
  ANNUAL_RETURN: 'Latest CAC annual return',
  AUDITED_ACCOUNTS: 'Recent audited accounts',
  PROPRIETOR_ID: 'Government ID of the proprietor',
  BOARD_RESOLUTION: 'Board resolution to open the account',
  TRUST_DEED: 'Trust deed / constitution',
  OTHER: 'Other supporting document',
};



/** Required document set per CBN KYC tier (cumulative). */
export function requiredDocsForTier(tier: string | undefined | null): KycDocumentType[] {
  const t = (tier || 'Tier 1').replace(/\s/g, '').toLowerCase();
  const tier1: KycDocumentType[] = ['BVN_SLIP', 'NIN_SLIP'];
  const tier2: KycDocumentType[] = [...tier1, 'UTILITY_BILL', 'PASSPORT'];
  const tier3: KycDocumentType[] = [...tier2, 'EMPLOYMENT_LETTER', 'SOURCE_OF_FUNDS'];
  if (t.includes('3')) return tier3;
  if (t.includes('2')) return tier2;
  return tier1;
}

export function normaliseTier(tier: string | undefined | null): string {
  const t = (tier || '').replace(/\s/g, '').toLowerCase();
  if (t.includes('3')) return 'Tier 3';
  if (t.includes('2')) return 'Tier 2';
  return 'Tier 1';
}

export function formatBytes(bytes: number | null | undefined) {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function isImagePath(path: string) {
  return /\.(png|jpe?g)$/i.test(path);
}

export function validateFile(file: File): string | null {
  if (file.size > MAX_FILE_BYTES) return 'File is larger than 5MB.';
  const okExt = /\.(pdf|jpe?g|png)$/i.test(file.name);
  if (!ACCEPTED_MIME.includes(file.type) && !okExt) return 'Only PDF, JPG or PNG files are accepted.';
  return null;
}

/** Opens a document in a new tab using a short-lived link from the current zone's provider. */
export function openDocumentUrl(url: string, doc: KycDocument) {
  const a = document.createElement('a');
  a.href = url;
  a.download = doc.document_name;
  a.target = '_blank';
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
}
