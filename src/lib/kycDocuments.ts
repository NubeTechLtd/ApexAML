import { supabase } from '@/integrations/supabase/client';

/** Single-tenant institution namespace used as the first storage path segment. */
export const INSTITUTION_ID = 'apexaml';
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


export interface KycDocument {
  id: string;
  customer_id: string;
  document_type: string;
  document_name: string;
  storage_path: string;
  file_size_bytes: number | null;
  uploaded_by: string;
  uploaded_at: string;
  kyc_tier_at_upload: string | null;
  is_current: boolean;
  expiry_date: string | null;
  verified: boolean;
  verified_by: string | null;
  verified_at: string | null;
}

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

export async function listCustomerDocuments(customerId: string): Promise<KycDocument[]> {
  const { data, error } = await supabase
    .from('kyc_documents')
    .select('*')
    .eq('customer_id', customerId)
    .order('uploaded_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as KycDocument[];
}

function safeName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_');
}

export async function uploadKycDocument(params: {
  file: File;
  customerId: string;
  documentType: KycDocumentType;
  uploadedBy: string;
  kycTier?: string | null;
  replaceExisting?: boolean;
}): Promise<KycDocument> {
  const { file, customerId, documentType, uploadedBy, kycTier, replaceExisting } = params;
  const path = `${INSTITUTION_ID}/${customerId}/${documentType}/${Date.now()}-${safeName(file.name)}`;

  const { error: uploadError } = await supabase.storage
    .from(KYC_BUCKET)
    .upload(path, file, { contentType: file.type || undefined, upsert: false });
  if (uploadError) throw uploadError;

  if (replaceExisting) {
    await supabase
      .from('kyc_documents')
      .update({ is_current: false })
      .eq('customer_id', customerId)
      .eq('document_type', documentType)
      .eq('is_current', true);
  }

  const { data, error } = await supabase
    .from('kyc_documents')
    .insert({
      customer_id: customerId,
      document_type: documentType,
      document_name: file.name,
      storage_path: path,
      file_size_bytes: file.size,
      uploaded_by: uploadedBy,
      kyc_tier_at_upload: kycTier ?? null,
    })
    .select('*')
    .single();
  if (error) throw error;
  return data as KycDocument;
}

export async function verifyKycDocument(id: string, verifiedBy: string): Promise<KycDocument> {
  const { data, error } = await supabase
    .from('kyc_documents')
    .update({ verified: true, verified_by: verifiedBy, verified_at: new Date().toISOString() })
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return data as KycDocument;
}

export async function getSignedUrl(storagePath: string, expiresIn = 300): Promise<string> {
  const { data, error } = await supabase.storage.from(KYC_BUCKET).createSignedUrl(storagePath, expiresIn);
  if (error) throw error;
  return data.signedUrl;
}

export async function downloadKycDocument(doc: KycDocument) {
  const url = await getSignedUrl(doc.storage_path);
  const a = document.createElement('a');
  a.href = url;
  a.download = doc.document_name;
  a.target = '_blank';
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
}
