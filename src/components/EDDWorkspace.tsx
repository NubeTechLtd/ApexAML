import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, Upload, FileText, User, ShieldCheck, ShieldX, Camera } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import type { KYCCustomer } from '@/data/mockKYC';

interface EDDWorkspaceProps {
  customer: KYCCustomer | null;
}

export function EDDWorkspace({ customer }: EDDWorkspaceProps) {
  if (!customer) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center py-16">
        <User className="h-10 w-10 text-muted-foreground/40 mb-3" />
        <p className="text-sm text-muted-foreground">Select a customer from the queue above to begin Enhanced Due Diligence.</p>
      </div>
    );
  }

  const handleApprove = () => {
    toast({ title: 'KYC Approved', description: `${customer.name} has been approved and moved to active customers.` });
  };

  const handleReject = () => {
    toast({ title: 'KYC Rejected & Blocked', description: `${customer.name} has been blocked. Compliance team notified.`, variant: 'destructive' });
  };

  const scoreColor = customer.smileIdentityScore >= 80
    ? 'text-[hsl(var(--risk-low))]'
    : customer.smileIdentityScore >= 50
    ? 'text-[hsl(var(--risk-medium))]'
    : 'text-[hsl(var(--risk-critical))]';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">Enhanced Due Diligence — {customer.name}</h2>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="destructive" onClick={handleReject} className="gap-1.5 text-xs">
            <ShieldX className="h-3.5 w-3.5" />
            Reject & Block
          </Button>
          <Button size="sm" onClick={handleApprove} className="gap-1.5 text-xs">
            <ShieldCheck className="h-3.5 w-3.5" />
            Approve KYC
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Smile Identity / NIBSS API Response */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-medium text-muted-foreground">Smile Identity / NIBSS Verification</CardTitle>
              <Badge variant="outline" className={cn('text-[10px] border-0 font-semibold',
                customer.nibssVerified
                  ? 'bg-[hsl(var(--risk-low)/0.12)] text-[hsl(var(--risk-low))]'
                  : 'bg-[hsl(var(--risk-critical)/0.12)] text-[hsl(var(--risk-critical))]'
              )}>
                {customer.nibssVerified ? 'NIBSS Verified' : 'NIBSS Unverified'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Photo comparison */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border bg-muted/50 flex flex-col items-center justify-center p-6">
                <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mb-2">
                  <User className="h-8 w-8 text-muted-foreground/60" />
                </div>
                <span className="text-[10px] text-muted-foreground font-medium">Government Photo</span>
                <span className="text-[10px] text-muted-foreground">(NIN Database)</span>
              </div>
              <div className="rounded-lg border bg-muted/50 flex flex-col items-center justify-center p-6">
                <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mb-2">
                  <Camera className="h-8 w-8 text-muted-foreground/60" />
                </div>
                <span className="text-[10px] text-muted-foreground font-medium">Live Selfie Capture</span>
                <span className="text-[10px] text-muted-foreground">(Liveness Check)</span>
              </div>
            </div>

            {/* API response details */}
            <div className="rounded-lg border bg-card p-3 space-y-2">
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">API Response</p>
              <div className="grid grid-cols-2 gap-y-2 text-xs">
                <span className="text-muted-foreground">Match Score</span>
                <span className={cn('font-semibold text-right', scoreColor)}>{customer.smileIdentityScore}%</span>
                <span className="text-muted-foreground">BVN</span>
                <span className="text-right font-mono text-foreground">{customer.bvn}</span>
                <span className="text-muted-foreground">NIN</span>
                <span className="text-right font-mono text-foreground">{customer.nin}</span>
                <span className="text-muted-foreground">BVN Match</span>
                <span className="text-right flex items-center justify-end gap-1">
                  {customer.bvnMatch === 'match' ? <CheckCircle2 className="h-3.5 w-3.5 text-[hsl(var(--risk-low))]" /> : customer.bvnMatch === 'mismatch' ? <XCircle className="h-3.5 w-3.5 text-[hsl(var(--risk-critical))]" /> : <span className="text-muted-foreground">Pending</span>}
                </span>
                <span className="text-muted-foreground">NIN Match</span>
                <span className="text-right flex items-center justify-end gap-1">
                  {customer.ninMatch === 'match' ? <CheckCircle2 className="h-3.5 w-3.5 text-[hsl(var(--risk-low))]" /> : customer.ninMatch === 'mismatch' ? <XCircle className="h-3.5 w-3.5 text-[hsl(var(--risk-critical))]" /> : <span className="text-muted-foreground">Pending</span>}
                </span>
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
          <CardContent className="space-y-4">
            {/* Upload zone */}
            <div
              className="rounded-lg border-2 border-dashed border-border hover:border-primary/40 transition-colors flex flex-col items-center justify-center p-8 cursor-pointer group"
              onClick={() => toast({ title: 'Upload', description: 'File picker would open here.' })}
            >
              <Upload className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors mb-2" />
              <p className="text-xs font-medium text-foreground">Drop files or click to upload</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Proof of Address, Corporate Registry, ID Scans</p>
            </div>

            {/* Existing documents */}
            <div className="space-y-1.5">
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                Uploaded Documents ({customer.documents.length})
              </p>
              {customer.documents.length === 0 ? (
                <p className="text-xs text-muted-foreground py-4 text-center">No documents uploaded yet.</p>
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
    </div>
  );
}
