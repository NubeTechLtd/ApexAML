import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { useAuditLog } from '@/hooks/useAuditLog';
import {
  downloadKycDocument,
  listCustomerDocuments,
  uploadKycDocument,
  validateFile,
  verifyKycDocument,
  type KycDocument,
  type KycDocumentType,
} from '@/lib/kycDocuments';

export function useKycDocuments(customerId: string | null, kycTier?: string | null) {
  const [documents, setDocuments] = useState<KycDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadingType, setUploadingType] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const { user } = useAuth();
  const { append } = useAuditLog();

  const analyst = user?.email ?? 'Unauthenticated session';

  const refresh = useCallback(async () => {
    if (!customerId) {
      setDocuments([]);
      return;
    }
    setLoading(true);
    try {
      setDocuments(await listCustomerDocuments(customerId));
    } catch {
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const upload = useCallback(
    async (file: File, documentType: KycDocumentType, opts?: { replaceExisting?: boolean }) => {
      if (!customerId) return;
      const invalid = validateFile(file);
      if (invalid) {
        toast.error(invalid);
        return;
      }
      setUploadingType(documentType);
      setProgress(10);
      const tick = window.setInterval(() => setProgress(p => (p < 85 ? p + 12 : p)), 180);
      try {
        await uploadKycDocument({
          file,
          customerId,
          documentType,
          uploadedBy: analyst,
          kycTier: kycTier ?? null,
          replaceExisting: opts?.replaceExisting,
        });
        setProgress(100);
        append({
          action: 'DOCUMENT_UPLOAD',
          analyst,
          caseId: customerId,
          justification: `${documentType} uploaded (${file.name})`,
        });
        toast.success('Document uploaded — pending verification');
        await refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Upload failed');
      } finally {
        window.clearInterval(tick);
        setUploadingType(null);
        setProgress(0);
      }
    },
    [customerId, analyst, kycTier, append, refresh],
  );

  const verify = useCallback(
    async (doc: KycDocument) => {
      try {
        await verifyKycDocument(doc.id, analyst);
        append({
          action: 'DOCUMENT_VERIFY',
          analyst,
          caseId: doc.customer_id,
          justification: `${doc.document_type} verified (${doc.document_name})`,
        });
        toast.success('Document marked as verified');
        await refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Verification failed');
      }
    },
    [analyst, append, refresh],
  );

  const download = useCallback(
    async (doc: KycDocument) => {
      try {
        await downloadKycDocument(doc);
        append({
          action: 'DOCUMENT_DOWNLOAD',
          analyst,
          caseId: doc.customer_id,
          justification: `${doc.document_type} downloaded (${doc.document_name})`,
        });
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Could not open document');
      }
    },
    [analyst, append],
  );

  return { documents, loading, uploadingType, progress, refresh, upload, verify, download, analyst };
}
