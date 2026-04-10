import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  CheckCircle2, XCircle, Loader2, Upload, FileText, User, Camera,
  ShieldCheck, ShieldAlert, ChevronDown, RefreshCw, ScanFace, Clock,
  FileDown, Flag,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { KYCCustomer } from '@/data/mockKYC';
import { TierManagement } from '@/components/kyc/TierManagement';

interface AuditEntry {
  id: string;
  timestamp: string;
  action: string;
  detail: string;
}

function formatTs(iso: string) {
  return new Date(iso).toLocaleString('en-NG', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false });
}

/* ── Verification Row ────────────────────────────── */

function VerificationRow({ label, status, verifiedAt, failReason, onReverify }: {
  label: string;
  status: 'match' | 'mismatch' | 'pending';
  verifiedAt?: string;
  failReason?: string;
  onReverify: () => void;
}) {
  return (
    <div className="flex items-center justify-between py-2.5 px-3 rounded-lg border border-border bg-card">
      <div className="flex items-center gap-2.5">
        {status === 'match' && <CheckCircle2 className="h-4 w-4 text-[hsl(var(--risk-low))]" />}
        {status === 'mismatch' && <XCircle className="h-4 w-4 text-destructive" />}
        {status === 'pending' && <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />}
        <div>
          <p className="text-xs font-medium text-foreground">{label}</p>
          {status === 'match' && verifiedAt && (
            <p className="text-[10px] text-[hsl(var(--risk-low))]">Verified · {formatTs(verifiedAt)}</p>
          )}
          {status === 'mismatch' && (
            <p className="text-[10px] text-destructive">{failReason || 'Verification failed'}</p>
          )}
          {status === 'pending' && (
            <p className="text-[10px] text-muted-foreground">Awaiting verification…</p>
          )}
        </div>
      </div>
      <Button variant="outline" size="sm" className="text-[10px] h-6 px-2 gap-1" onClick={onReverify}>
        <RefreshCw className="h-3 w-3" /> Re-verify
      </Button>
    </div>
  );
}

/* ── Liveness Row ────────────────────────────────── */

function LivenessRow({ status, confidence, onReverify }: {
  status: 'pass' | 'fail' | 'pending';
  confidence: number;
  onReverify: () => void;
}) {
  return (
    <div className="flex items-center justify-between py-2.5 px-3 rounded-lg border border-border bg-card">
      <div className="flex items-center gap-2.5">
        {status === 'pass' && <ScanFace className="h-4 w-4 text-[hsl(var(--risk-low))]" />}
        {status === 'fail' && <ScanFace className="h-4 w-4 text-destructive" />}
        {status === 'pending' && <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />}
        <div>
          <p className="text-xs font-medium text-foreground">Liveness Check</p>
          {status === 'pass' && (
            <p className="text-[10px] text-[hsl(var(--risk-low))]">Biometric confidence: {confidence}%</p>
          )}
          {status === 'fail' && (
            <p className="text-[10px] text-destructive">Failed — confidence {confidence}% (min 60%)</p>
          )}
          {status === 'pending' && (
            <p className="text-[10px] text-muted-foreground">Awaiting biometric capture…</p>
          )}
        </div>
      </div>
      <Button variant="outline" size="sm" className="text-[10px] h-6 px-2 gap-1" onClick={onReverify}>
        <RefreshCw className="h-3 w-3" /> Re-verify
      </Button>
    </div>
  );
}

/* ── Main EDDWorkspace ───────────────────────────── */

interface EDDWorkspaceProps {
  customer: KYCCustomer | null;
  onTierUpgrade?: (newTier: string) => void;
}

export function EDDWorkspace({ customer, onTierUpgrade }: EDDWorkspaceProps) {
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);
  const [reverifying, setReverifying] = useState<Record<string, boolean>>({});

  const addAudit = useCallback((action: string, detail: string) => {
    setAuditLog(prev => [{ id: crypto.randomUUID(), timestamp: new Date().toISOString(), action, detail }, ...prev]);
  }, []);

  const handleReverify = useCallback((type: string) => {
    setReverifying(prev => ({ ...prev, [type]: true }));
    addAudit('RE-VERIFY', `${type} re-verification initiated for ${customer?.name}`);
    setTimeout(() => {
      setReverifying(prev => ({ ...prev, [type]: false }));
      toast.success(`${type} re-verification complete`);
      addAudit('VERIFIED', `${type} re-verification completed successfully`);
    }, 1000);
  }, [customer, addAudit]);

  const handleAction = useCallback((action: string) => {
    if (!customer) return;
    const messages: Record<string, string> = {
      approve: `KYC approved for ${customer.name}. Account moved to active.`,
      escalate: `${customer.name} escalated to Enhanced Due Diligence.`,
      docs: `Document request sent to ${customer.name}.`,
      flag: `${customer.name} flagged for NFIU review.`,
    };
    toast.success(messages[action] || 'Action performed.');
    addAudit(action.toUpperCase(), messages[action] || action);
  }, [customer, addAudit]);

  if (!customer) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/50 mb-4">
          <User className="h-8 w-8 text-muted-foreground/40" />
        </div>
        <p className="text-sm font-medium text-muted-foreground">Select a customer to begin KYC review</p>
        <p className="text-xs text-muted-foreground/60 mt-1">Choose from the verification queue on the left</p>
      </div>
    );
  }

  const scoreColor = customer.smileIdentityScore >= 80
    ? 'text-[hsl(var(--risk-low))]'
    : customer.smileIdentityScore >= 50
    ? 'text-[hsl(var(--risk-medium))]'
    : 'text-destructive';

  const tierBadge: Record<string, string> = {
    'Tier 1': 'bg-muted text-muted-foreground',
    'Tier 2': 'bg-[hsl(var(--risk-medium))]/10 text-[hsl(var(--risk-medium))]',
    'Tier 3': 'bg-[hsl(var(--risk-low))]/10 text-[hsl(var(--risk-low))]',
  };

  return (
    <div className="flex flex-col h-full">
      {/* Sticky Header */}
      <div className="sticky top-0 z-10 border-b bg-card px-5 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-xs font-bold text-foreground shrink-0">
            {customer.name.split(' ').map(n => n[0]).join('')}
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-foreground truncate">{customer.name}</h2>
            <div className="flex items-center gap-2 mt-0.5">
              <Badge variant="outline" className={cn('text-[9px] px-1.5 py-0 border-0', tierBadge[customer.kycTier] || 'bg-muted text-muted-foreground')}>
                {customer.kycTier}
              </Badge>
              <Badge variant="outline" className={cn('text-[9px] px-1.5 py-0 border-0', customer.bvnMatch === 'match' ? 'bg-[hsl(var(--risk-low))]/10 text-[hsl(var(--risk-low))]' : customer.bvnMatch === 'mismatch' ? 'bg-destructive/10 text-destructive' : 'bg-muted text-muted-foreground')}>
                {customer.bvnMatch === 'match' ? '✓ BVN Verified' : customer.bvnMatch === 'mismatch' ? '✗ BVN Failed' : '⏳ BVN Pending'}
              </Badge>
            </div>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" className="gap-1.5 text-xs">
              Actions <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => handleAction('approve')} className="text-xs gap-2">
              <ShieldCheck className="h-3.5 w-3.5" /> Approve KYC
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleAction('escalate')} className="text-xs gap-2">
              <ShieldAlert className="h-3.5 w-3.5" /> Escalate to EDD
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleAction('docs')} className="text-xs gap-2">
              <FileDown className="h-3.5 w-3.5" /> Request Docs
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleAction('flag')} className="text-xs gap-2 text-destructive focus:text-destructive">
              <Flag className="h-3.5 w-3.5" /> Flag for NFIU
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Scrollable Content */}
      <ScrollArea className="flex-1">
        <div className="p-5 space-y-5">
          {/* Identity Verification Results */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Identity Verification</h3>
            <div className="space-y-2">
              <VerificationRow
                label="BVN Verification"
                status={reverifying['BVN'] ? 'pending' : customer.bvnMatch}
                verifiedAt={customer.bvnVerifiedAt}
                failReason={customer.bvnFailReason}
                onReverify={() => handleReverify('BVN')}
              />
              <VerificationRow
                label="NIN Verification"
                status={reverifying['NIN'] ? 'pending' : customer.ninMatch}
                verifiedAt={customer.ninVerifiedAt}
                failReason={customer.ninFailReason}
                onReverify={() => handleReverify('NIN')}
              />
              <LivenessRow
                status={reverifying['Liveness'] ? 'pending' : customer.livenessCheck}
                confidence={customer.livenessConfidence}
                onReverify={() => handleReverify('Liveness')}
              />
            </div>
          </div>

          <Separator />

          {/* Smile Identity / Photo Comparison */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xs font-medium text-muted-foreground">Smile Identity / NIBSS</CardTitle>
                  <Badge variant="outline" className={cn('text-[10px] border-0 font-semibold',
                    customer.nibssVerified
                      ? 'bg-[hsl(var(--risk-low))]/10 text-[hsl(var(--risk-low))]'
                      : 'bg-destructive/10 text-destructive'
                  )}>
                    {customer.nibssVerified ? 'NIBSS Verified' : 'NIBSS Unverified'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg border bg-muted/50 flex flex-col items-center justify-center p-4">
                    <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-2">
                      <User className="h-7 w-7 text-muted-foreground/60" />
                    </div>
                    <span className="text-[10px] text-muted-foreground font-medium">Government Photo</span>
                  </div>
                  <div className="rounded-lg border bg-muted/50 flex flex-col items-center justify-center p-4">
                    <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-2">
                      <Camera className="h-7 w-7 text-muted-foreground/60" />
                    </div>
                    <span className="text-[10px] text-muted-foreground font-medium">Live Selfie</span>
                  </div>
                </div>
                <div className="rounded-lg border bg-card p-3 space-y-1.5">
                  <div className="grid grid-cols-2 gap-y-1.5 text-xs">
                    <span className="text-muted-foreground">Match Score</span>
                    <span className={cn('font-semibold text-right', scoreColor)}>{customer.smileIdentityScore}%</span>
                    <span className="text-muted-foreground">BVN</span>
                    <span className="text-right font-mono text-foreground">{customer.bvn}</span>
                    <span className="text-muted-foreground">NIN</span>
                    <span className="text-right font-mono text-foreground">{customer.nin}</span>
                    <span className="text-muted-foreground">Email</span>
                    <span className="text-right text-foreground truncate">{customer.email}</span>
                    <span className="text-muted-foreground">Phone</span>
                    <span className="text-right text-foreground">{customer.phone}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Document Vault */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">Document Vault</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div
                  className="rounded-lg border-2 border-dashed border-border hover:border-primary/40 transition-colors flex flex-col items-center justify-center p-6 cursor-pointer group"
                  onClick={() => { toast('File picker would open here.'); addAudit('UPLOAD_ATTEMPT', 'Document upload initiated'); }}
                >
                  <Upload className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors mb-1.5" />
                  <p className="text-xs font-medium text-foreground">Drop files or click to upload</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Proof of Address, ID Scans</p>
                </div>
                <div className="space-y-1.5">
                  <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                    Uploaded ({customer.documents.length})
                  </p>
                  {customer.documents.length === 0 ? (
                    <p className="text-xs text-muted-foreground py-3 text-center">No documents uploaded.</p>
                  ) : (
                    customer.documents.map((doc, i) => (
                      <div key={i} className="flex items-center justify-between rounded-lg border p-2.5">
                        <div className="flex items-center gap-2 min-w-0">
                          <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-foreground truncate">{doc.name}</p>
                            <p className="text-[10px] text-muted-foreground">{doc.type}</p>
                          </div>
                        </div>
                        <span className="text-[10px] text-muted-foreground shrink-0 ml-2">{doc.uploadedAt}</span>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <Separator />

          {/* KYC Tier Management */}
          {onTierUpgrade && (
            <TierManagement customer={customer} onTierUpgrade={onTierUpgrade} addAudit={addAudit} />
          )}

          <Separator />

          {/* Session Audit Log */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <Clock className="h-3.5 w-3.5" />
              Session Audit Log
              {auditLog.length > 0 && <Badge variant="outline" className="text-[9px]">{auditLog.length}</Badge>}
            </h3>
            {auditLog.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center rounded-lg border bg-muted/20">
                No actions recorded this session. Actions will appear here as you review this customer.
              </p>
            ) : (
              <div className="space-y-1 max-h-48 overflow-y-auto rounded-lg border bg-muted/20 p-2">
                {auditLog.map(entry => (
                  <div key={entry.id} className="flex items-start gap-2 py-1.5 px-2 rounded text-xs">
                    <span className="font-mono text-[10px] text-muted-foreground shrink-0 mt-0.5">
                      {new Date(entry.timestamp).toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
                    </span>
                    <Badge variant="outline" className="text-[9px] px-1.5 py-0 shrink-0">{entry.action}</Badge>
                    <span className="text-muted-foreground">{entry.detail}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
