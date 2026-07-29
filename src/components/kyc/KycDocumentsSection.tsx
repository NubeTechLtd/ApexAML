import { useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Download, FileText, Loader2, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useKycDocuments } from '@/hooks/useKycDocuments';
import {
  ACCEPT_ATTR,
  DOCUMENT_LABELS,
  formatBytes,
  normaliseTier,
  requiredDocsForTier,
  type KycDocument,
  type KycDocumentType,
} from '@/lib/kycDocuments';

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('en-NG', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false,
  });
}

interface Props {
  customerId: string;
  kycTier: string;
  onUploaded?: (documentType: KycDocumentType) => void;
}

export function KycDocumentsSection({ customerId, kycTier, onUploaded }: Props) {
  const tier = normaliseTier(kycTier);
  const required = requiredDocsForTier(tier);
  const { documents, loading, uploadingType, progress, upload, download } = useKycDocuments(customerId, tier);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [pendingType, setPendingType] = useState<KycDocumentType | null>(null);

  const currentByType = new Map<string, KycDocument>();
  documents.filter(d => d.is_current).forEach(d => {
    if (!currentByType.has(d.document_type)) currentByType.set(d.document_type, d);
  });

  const uploadedCount = required.filter(t => currentByType.has(t)).length;

  const pickFile = (type: KycDocumentType) => {
    setPendingType(type);
    inputRef.current?.click();
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !pendingType) return;
    const type = pendingType;
    setPendingType(null);
    await upload(file, type, { replaceExisting: currentByType.has(type) });
    onUploaded?.(type);
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xs font-medium text-muted-foreground">
            Documents — required for {tier}
          </CardTitle>
          <Badge variant="outline" className="text-[10px]">
            {uploadedCount}/{required.length} on file
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <input ref={inputRef} type="file" accept={ACCEPT_ATTR} className="hidden" onChange={handleFile} />

        {loading && (
          <p className="text-xs text-muted-foreground py-3 text-center flex items-center justify-center gap-2">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading documents…
          </p>
        )}

        {required.map(type => {
          const doc = currentByType.get(type);
          const busy = uploadingType === type;
          return (
            <div key={type} className="rounded-lg border p-2.5 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2 min-w-0">
                  <FileText className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-foreground">{DOCUMENT_LABELS[type]}</p>
                    {doc ? (
                      <p className="text-[10px] text-muted-foreground truncate">
                        {doc.document_name} · {formatBytes(doc.file_size_bytes)} · {formatDate(doc.uploaded_at)} · {doc.uploaded_by}
                      </p>
                    ) : (
                      <p className="text-[10px] text-muted-foreground">Not yet provided by the customer.</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {doc ? (
                    <>
                      <Badge
                        variant="outline"
                        className={cn(
                          'text-[9px] border-0 font-semibold',
                          doc.verified
                            ? 'bg-[hsl(var(--risk-low))]/10 text-[hsl(var(--risk-low))]'
                            : 'bg-[hsl(var(--risk-medium))]/10 text-[hsl(var(--risk-medium))]',
                        )}
                      >
                        {doc.verified ? 'Verified' : 'Pending verification'}
                      </Badge>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => download(doc)} aria-label="Download document">
                        <Download className="h-3.5 w-3.5" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <Badge variant="outline" className="text-[9px] border-0 font-semibold bg-destructive/10 text-destructive">
                        Required
                      </Badge>
                      <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1" disabled={busy} onClick={() => pickFile(type)}>
                        {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
                        Upload document
                      </Button>
                    </>
                  )}
                </div>
              </div>
              {busy && <Progress value={progress} className="h-1" />}
            </div>
          );
        })}

        {uploadedCount === required.length && !loading && (
          <p className="text-[10px] text-[hsl(var(--risk-low))] flex items-center gap-1.5 pt-1">
            <CheckCircle2 className="h-3 w-3" /> All {tier} documents are on file.
          </p>
        )}
        <p className="text-[10px] text-muted-foreground pt-1">PDF, JPG or PNG · maximum 5MB per file.</p>
      </CardContent>
    </Card>
  );
}
