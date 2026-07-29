import { useEffect, useRef, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Download, FileText, Loader2, RefreshCw, ShieldCheck, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useKycDocuments } from '@/hooks/useKycDocuments';
import {
  ACCEPT_ATTR,
  DOCUMENT_LABELS,
  formatBytes,
  getSignedUrl,
  isImagePath,
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

function Thumbnail({ doc }: { doc: KycDocument }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    if (isImagePath(doc.storage_path)) {
      getSignedUrl(doc.storage_path).then(u => { if (active) setUrl(u); }).catch(() => undefined);
    }
    return () => { active = false; };
  }, [doc.storage_path]);

  if (url) {
    return <img src={url} alt={`${doc.document_name} preview`} loading="lazy" className="h-14 w-14 rounded-md object-cover border" />;
  }
  return (
    <div className="h-14 w-14 rounded-md border bg-muted/50 flex items-center justify-center">
      <FileText className="h-6 w-6 text-muted-foreground" />
    </div>
  );
}

interface Props {
  customerId: string;
  kycTier: string;
  canVerify?: boolean;
}

export function Customer360DocumentsTab({ customerId, kycTier, canVerify = true }: Props) {
  const tier = normaliseTier(kycTier);
  const required = requiredDocsForTier(tier);
  const { documents, loading, uploadingType, progress, upload, verify, download } = useKycDocuments(customerId, tier);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [pendingType, setPendingType] = useState<KycDocumentType | null>(null);

  const current = documents.filter(d => d.is_current);
  const types = Array.from(new Set<string>([...required, ...current.map(d => d.document_type)]));

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
    const hasCurrent = current.some(d => d.document_type === type);
    await upload(file, type, { replaceExisting: hasCurrent });
  };

  return (
    <Card>
      <CardContent className="pt-4 space-y-3">
        <input ref={inputRef} type="file" accept={ACCEPT_ATTR} className="hidden" onChange={handleFile} />

        {loading ? (
          <p className="text-sm text-muted-foreground py-8 text-center flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading documents…
          </p>
        ) : (
          types.map(type => {
            const docs = current.filter(d => d.document_type === type);
            const label = DOCUMENT_LABELS[type as KycDocumentType] ?? type;
            const busy = uploadingType === type;
            const versions = documents.filter(d => d.document_type === type && !d.is_current).length;
            return (
              <div key={type} className="rounded-lg border p-3 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-semibold text-foreground">{label}</p>
                    {versions > 0 && (
                      <Badge variant="outline" className="text-[9px]">{versions} previous version{versions > 1 ? 's' : ''}</Badge>
                    )}
                  </div>
                  {docs.length === 0 && (
                    <div className="flex items-center gap-1.5">
                      <Badge variant="outline" className="text-[9px] border-0 font-semibold bg-destructive/10 text-destructive">Required</Badge>
                      <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1" disabled={busy} onClick={() => pickFile(type as KycDocumentType)}>
                        {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />} Upload document
                      </Button>
                    </div>
                  )}
                </div>

                {busy && <Progress value={progress} className="h-1" />}

                {docs.map(doc => (
                  <div key={doc.id} className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <Thumbnail doc={doc} />
                      <div className="min-w-0 space-y-1">
                        <p className="text-xs font-medium text-foreground truncate">{doc.document_name}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {formatBytes(doc.file_size_bytes)} · Uploaded {formatDate(doc.uploaded_at)} by {doc.uploaded_by}
                        </p>
                        <Badge
                          variant="outline"
                          className={cn('text-[9px] border-0 font-semibold',
                            doc.verified
                              ? 'bg-[hsl(var(--risk-low))]/10 text-[hsl(var(--risk-low))]'
                              : 'bg-[hsl(var(--risk-medium))]/10 text-[hsl(var(--risk-medium))]')}
                        >
                          {doc.verified ? `Verified by ${doc.verified_by ?? 'analyst'}` : 'Pending verification'}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {canVerify && !doc.verified && (
                        <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1" onClick={() => verify(doc)}>
                          <ShieldCheck className="h-3 w-3" /> Verify
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" className="h-7 w-7" aria-label="Download document" onClick={() => download(doc)}>
                        <Download className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" aria-label="Replace document" disabled={busy} onClick={() => pickFile(type as KycDocumentType)}>
                        <RefreshCw className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            );
          })
        )}

        {!loading && current.length > 0 && current.every(d => d.verified) && (
          <p className="text-[10px] text-[hsl(var(--risk-low))] flex items-center gap-1.5">
            <CheckCircle2 className="h-3 w-3" /> All uploaded documents have been verified.
          </p>
        )}
        <p className="text-[10px] text-muted-foreground">PDF, JPG or PNG · maximum 5MB per file. Replacing a document archives the previous version.</p>
      </CardContent>
    </Card>
  );
}
