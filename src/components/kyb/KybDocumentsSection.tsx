import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Download, FileText, Loader2, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useKycDocuments } from '@/hooks/useKycDocuments';
import { ACCEPT_ATTR, DOCUMENT_LABELS, formatBytes, type KycDocument, type KycDocumentType } from '@/lib/kycDocuments';

interface Props {
  entityId: string;
  businessType: string;
  required: KycDocumentType[];
  onCountChange?: (onFile: number) => void;
}

export function KybDocumentsSection({ entityId, businessType, required, onCountChange }: Props) {
  const { documents, loading, uploadingType, progress, upload, download } = useKycDocuments(entityId, businessType);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [pendingType, setPendingType] = useState<KycDocumentType | null>(null);

  const currentByType = new Map<string, KycDocument>();
  documents.filter(d => d.is_current).forEach(d => {
    if (!currentByType.has(d.document_type)) currentByType.set(d.document_type, d);
  });
  const onFile = required.filter(t => currentByType.has(t)).length;
  useEffect(() => { onCountChange?.(onFile); }, [onFile, onCountChange]);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !pendingType) return;
    const type = pendingType;
    setPendingType(null);
    await upload(file, type, { replaceExisting: currentByType.has(type) });
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xs font-medium text-muted-foreground">
            Required documents — {businessType}
          </CardTitle>
          <Badge variant="outline" className="text-[10px]">{onFile}/{required.length} on file</Badge>
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
                    <p className="text-[10px] text-muted-foreground truncate">
                      {doc
                        ? `${doc.document_name} · ${formatBytes(doc.file_size_bytes)} · ${doc.uploaded_by}`
                        : 'Not yet provided by the company.'}
                    </p>
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
                      <Badge variant="outline" className="text-[9px] border-0 font-semibold bg-destructive/10 text-destructive">Required</Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-[10px] gap-1"
                        disabled={busy}
                        onClick={() => { setPendingType(type); inputRef.current?.click(); }}
                      >
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

        {onFile === required.length && !loading && (
          <p className="text-[10px] text-[hsl(var(--risk-low))] flex items-center gap-1.5 pt-1">
            <CheckCircle2 className="h-3 w-3" /> All CAC documents for a {businessType} are on file.
          </p>
        )}
        <p className="text-[10px] text-muted-foreground pt-1">PDF, JPG or PNG · maximum 5MB per file.</p>
      </CardContent>
    </Card>
  );
}
