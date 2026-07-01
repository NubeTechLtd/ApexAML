import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  FileText, FileWarning, Send, Clock, MoreHorizontal, Eye, RefreshCw,
  Download, Plus, ArrowRight, ArrowLeft, Loader2, CheckCircle2, XCircle,
  AlertTriangle, PenLine,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  mockSTRRecords, mockNFIUSubmissions,
  type STRRecord, type NFIUSubmission,
} from '@/data/mockSTR';

/* ── helpers ──────────────────────────────────── */

function formatAmount(n: number) {
  return '₦' + n.toLocaleString('en-NG');
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-NG', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatTs(iso: string) {
  return new Date(iso).toLocaleString('en-NG', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false });
}

const statusStyle: Record<string, string> = {
  Draft: 'bg-muted text-muted-foreground',
  'Pending Review': 'bg-[hsl(var(--risk-medium))]/10 text-[hsl(var(--risk-medium))]',
  'Submitted to NFIU': 'bg-[hsl(var(--risk-low))]/10 text-[hsl(var(--risk-low))]',
  Rejected: 'bg-destructive/10 text-destructive',
};

const ackStyle: Record<string, string> = {
  Accepted: 'bg-[hsl(var(--risk-low))]/10 text-[hsl(var(--risk-low))]',
  Pending: 'bg-[hsl(var(--risk-medium))]/10 text-[hsl(var(--risk-medium))]',
  Rejected: 'bg-destructive/10 text-destructive',
};

/* ── Mock alert IDs for linking ───────────────── */
const MOCK_ALERTS = [
  { id: 'ALT-2026-0891', label: 'ALT-2026-0891 · POS Terminal Structuring · Chidinma Okafor' },
  { id: 'ALT-2026-0892', label: 'ALT-2026-0892 · BDC Liquidation · Emeka Nwosu' },
  { id: 'ALT-2026-0893', label: 'ALT-2026-0893 · Layered Transfers · Fatima Abdullahi' },
  { id: 'ALT-2026-0894', label: 'ALT-2026-0894 · Rapid Movement of Funds · Oluwaseun Adeyemi' },
  { id: 'ALT-2026-0895', label: 'ALT-2026-0895 · Unusual Cash Deposits · Amina Bello' },
];

const AI_NARRATIVE = `SUSPICIOUS TRANSACTION REPORT — NFIU STRUCTURED NARRATIVE

1. CUSTOMER PROFILE
The subject account holder maintains a Tier 2 individual savings account opened on 12 January 2024. The account was flagged following automated rule triggers on the AML monitoring platform.

2. SUSPICIOUS ACTIVITY SUMMARY
Between 15 March 2026 and 02 April 2026, the account exhibited patterns consistent with structured POS terminal deposits designed to circumvent the ₦5,000,000 CTR reporting threshold. A total of ₦14,500,000 was deposited across 28 POS transactions, none exceeding ₦520,000 individually.

3. TRIGGERING EVENTS
• Rule R-204 (POS Structuring) triggered on 28 March 2026 — 12 deposits within 48 hours totalling ₦6,100,000.
• Manual review identified 3 linked POS terminals registered to the same beneficial owner.
• No corresponding economic activity or declared income justifies the volume.

4. NFIU FORMATTING
This report is structured per goAML XML schema v4.2 and references CBN Circular BSD/DIR/PUB/LAB/019/002. The filing institution recommends immediate account restriction pending NFIU review.`;

/* ── New STR Sheet ────────────────────────────── */

function NewSTRSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [step, setStep] = useState(1);
  const [linkedAlert, setLinkedAlert] = useState('');
  const [narrative, setNarrative] = useState('');
  const [generating, setGenerating] = useState(false);
  const [editedNarrative, setEditedNarrative] = useState('');

  // Reset on close
  useEffect(() => {
    if (!open) {
      setTimeout(() => { setStep(1); setLinkedAlert(''); setNarrative(''); setEditedNarrative(''); setGenerating(false); }, 300);
    }
  }, [open]);

  // Typewriter effect for step 2
  const startGeneration = useCallback(() => {
    setGenerating(true);
    setNarrative('');
    let i = 0;
    const interval = setInterval(() => {
      i += 3;
      if (i >= AI_NARRATIVE.length) {
        setNarrative(AI_NARRATIVE);
        setEditedNarrative(AI_NARRATIVE);
        setGenerating(false);
        clearInterval(interval);
      } else {
        setNarrative(AI_NARRATIVE.slice(0, i));
      }
    }, 2000 / (AI_NARRATIVE.length / 3));
  }, []);

  useEffect(() => {
    if (step === 2 && !narrative && !generating) startGeneration();
  }, [step, narrative, generating, startGeneration]);

  const handleSubmit = () => {
    toast.success('STR filed — Ref: STR-2026-00042');
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg flex flex-col">
        <SheetHeader>
          <SheetTitle className="text-sm">New Suspicious Transaction Report</SheetTitle>
          <SheetDescription className="text-xs">Step {step} of 3</SheetDescription>
        </SheetHeader>

        {/* Progress */}
        <div className="flex gap-1 my-2">
          {[1, 2, 3].map(s => (
            <div key={s} className={cn('h-1 flex-1 rounded-full transition-colors', s <= step ? 'bg-primary' : 'bg-muted')} />
          ))}
        </div>

        <ScrollArea className="flex-1">
          {step === 1 && (
            <div className="space-y-4 pr-2">
              <div>
                <p className="text-xs font-medium text-foreground mb-1.5">Link to Alert</p>
                <Select value={linkedAlert} onValueChange={setLinkedAlert}>
                  <SelectTrigger className="text-xs"><SelectValue placeholder="Select an alert…" /></SelectTrigger>
                  <SelectContent>
                    {MOCK_ALERTS.map(a => (
                      <SelectItem key={a.id} value={a.id} className="text-xs">{a.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[10px] text-muted-foreground mt-1">The STR will inherit alert metadata and transaction data.</p>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3 pr-2">
              <div className="flex items-center gap-2">
                <PenLine className="h-3.5 w-3.5 text-primary" />
                <p className="text-xs font-medium text-foreground">AI-Generated Narrative</p>
                {generating && <Loader2 className="h-3 w-3 animate-spin text-primary" />}
              </div>
              <div className="rounded-lg border bg-muted/30 p-3 min-h-[200px]">
                <pre className="text-[11px] text-foreground whitespace-pre-wrap font-mono leading-relaxed">
                  {narrative}
                  {generating && <span className="animate-pulse">▊</span>}
                </pre>
              </div>
              {!generating && narrative && (
                <p className="text-[10px] text-muted-foreground">You can edit the narrative in the next step before submitting.</p>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-3 pr-2">
              <p className="text-xs font-medium text-foreground">Review & Edit Narrative</p>
              <Textarea
                value={editedNarrative}
                onChange={e => setEditedNarrative(e.target.value)}
                className="min-h-[250px] text-[11px] font-mono"
              />
              <div className="rounded-lg border bg-card p-3 space-y-1.5 text-xs">
                <div className="flex justify-between"><span className="text-muted-foreground">Linked Alert</span><span className="font-medium text-foreground">{linkedAlert}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Reference</span><span className="font-mono text-foreground">STR-2026-00042</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Filing Date</span><span className="text-foreground">{formatDate(new Date().toISOString())}</span></div>
              </div>
            </div>
          )}
        </ScrollArea>

        <Separator className="my-2" />
        <div className="flex items-center justify-between">
          <Button variant="outline" size="sm" className="text-xs gap-1" disabled={step === 1} onClick={() => setStep(s => s - 1)}>
            <ArrowLeft className="h-3 w-3" /> Back
          </Button>
          {step < 3 ? (
            <Button size="sm" className="text-xs gap-1" disabled={step === 1 && !linkedAlert || (step === 2 && generating)} onClick={() => setStep(s => s + 1)}>
              Next <ArrowRight className="h-3 w-3" />
            </Button>
          ) : (
            <Button size="sm" className="text-xs gap-1" onClick={handleSubmit}>
              <Send className="h-3 w-3" /> Submit to NFIU
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

/* ── Main Component ───────────────────────────── */

export function STRManagement() {
  const navigate = useNavigate();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [resubmitting, setResubmitting] = useState<string | null>(null);

  const counts = {
    Draft: mockSTRRecords.filter(r => r.status === 'Draft').length,
    'Pending Review': mockSTRRecords.filter(r => r.status === 'Pending Review').length,
    'Submitted to NFIU': mockSTRRecords.filter(r => r.status === 'Submitted to NFIU').length,
    Rejected: mockSTRRecords.filter(r => r.status === 'Rejected').length,
  };

  const summaryCards: { label: string; count: number; icon: React.ReactNode; color: string }[] = [
    { label: 'Draft', count: counts.Draft, icon: <PenLine className="h-4 w-4" />, color: 'text-muted-foreground' },
    { label: 'Pending Review', count: counts['Pending Review'], icon: <Clock className="h-4 w-4" />, color: 'text-[hsl(var(--risk-medium))]' },
    { label: 'Submitted to NFIU', count: counts['Submitted to NFIU'], icon: <Send className="h-4 w-4" />, color: 'text-[hsl(var(--risk-low))]' },
    { label: 'Rejected', count: counts.Rejected, icon: <XCircle className="h-4 w-4" />, color: 'text-destructive' },
  ];

  const handleResubmit = (id: string) => {
    setResubmitting(id);
    setTimeout(() => {
      setResubmitting(null);
      toast.success('STR re-submitted to NFIU goAML portal');
    }, 1500);
  };

  return (
    <div className="space-y-6">
      {/* Summary Row */}
      <div className="flex items-center justify-between">
        <div className="grid grid-cols-4 gap-3 flex-1">
          {summaryCards.map(c => (
            <Card key={c.label}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className={cn('p-2 rounded-lg bg-muted/50', c.color)}>{c.icon}</div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{c.count}</p>
                  <p className="text-[10px] text-muted-foreground font-medium">{c.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <Button size="sm" className="gap-1.5 text-xs ml-4 shrink-0" onClick={() => setSheetOpen(true)}>
          <Plus className="h-3.5 w-3.5" /> New STR
        </Button>
      </div>

      {/* STR Table */}
      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-[10px]">STR Reference</TableHead>
                <TableHead className="text-[10px]">Customer</TableHead>
                <TableHead className="text-[10px]">Alert ID</TableHead>
                <TableHead className="text-[10px]">Typology</TableHead>
                <TableHead className="text-[10px] text-right">Amount</TableHead>
                <TableHead className="text-[10px]">Analyst</TableHead>
                <TableHead className="text-[10px]">Status</TableHead>
                <TableHead className="text-[10px]">Filed</TableHead>
                <TableHead className="text-[10px] w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockSTRRecords.map(r => (
                <TableRow key={r.id}>
                  <TableCell className="text-xs font-mono font-medium">{r.reference}</TableCell>
                  <TableCell className="text-xs">{r.customerName}</TableCell>
                  <TableCell>
                    <button
                      className="text-xs text-primary hover:underline font-mono"
                      onClick={() => navigate(`/alerts?alertId=${r.alertId}`)}
                    >
                      {r.alertId}
                    </button>
                  </TableCell>
                  <TableCell className="text-xs">{r.typology}</TableCell>
                  <TableCell className="text-xs text-right font-mono">{formatAmount(r.amount)}</TableCell>
                  <TableCell className="text-xs">{r.analyst}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn('text-[9px] border-0 px-1.5 py-0', statusStyle[r.status])}>
                      {r.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{formatDate(r.filedDate)}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <MoreHorizontal className="h-3.5 w-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem className="text-xs gap-2" onClick={() => toast.info(`Viewing ${r.reference}`)}>
                          <Eye className="h-3.5 w-3.5" /> View
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-xs gap-2" onClick={() => toast.info(`Re-submitting ${r.reference}`)}>
                          <RefreshCw className="h-3.5 w-3.5" /> Re-submit
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-xs gap-2" onClick={() => toast.info(`Downloading ${r.reference}.xml`)}>
                          <Download className="h-3.5 w-3.5" /> Download XML
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* NFIU Submission Log */}
      <div className="space-y-2">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
          <FileText className="h-3.5 w-3.5" />
          NFIU Submission Log (Last 5)
        </h3>
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-[10px]">Timestamp</TableHead>
                  <TableHead className="text-[10px]">Reference</TableHead>
                  <TableHead className="text-[10px]">Acknowledgment</TableHead>
                  <TableHead className="text-[10px] w-28" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockNFIUSubmissions.map(s => (
                  <TableRow key={s.id}>
                    <TableCell className="text-xs text-muted-foreground">{formatTs(s.timestamp)}</TableCell>
                    <TableCell className="text-xs font-mono font-medium">{s.reference}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn('text-[9px] border-0 px-1.5 py-0', ackStyle[s.acknowledgmentStatus])}>
                        {s.acknowledgmentStatus === 'Accepted' && <CheckCircle2 className="h-3 w-3 mr-1" />}
                        {s.acknowledgmentStatus === 'Pending' && <Clock className="h-3 w-3 mr-1" />}
                        {s.acknowledgmentStatus === 'Rejected' && <XCircle className="h-3 w-3 mr-1" />}
                        {s.acknowledgmentStatus}
                      </Badge>
                      {s.rejectionReason && (
                        <p className="text-[10px] text-destructive mt-0.5">{s.rejectionReason}</p>
                      )}
                    </TableCell>
                    <TableCell>
                      {s.acknowledgmentStatus === 'Rejected' && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-[10px] h-6 px-2 gap-1 text-destructive hover:text-destructive"
                          disabled={resubmitting === s.id}
                          onClick={() => handleResubmit(s.id)}
                        >
                          {resubmitting === s.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                          Resubmit
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <NewSTRSheet open={sheetOpen} onOpenChange={setSheetOpen} />
    </div>
  );
}
