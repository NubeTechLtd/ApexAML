import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ActiveFilterChip } from '@/components/ActiveFilterChip';
import { NotificationBell } from '@/components/NotificationBell';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { ThemeToggle } from '@/components/ThemeToggle';
import { AuditBell } from '@/components/AuditBell';
import { ConfirmEscalationDialog } from '@/components/ConfirmEscalationDialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label';
import { mockAlerts, type Alert, type TxChannel } from '@/data/mockAlerts';
import { useToast } from '@/hooks/use-toast';
import { useAuditLog } from '@/hooks/useAuditLog';
import { useCBNRate } from '@/hooks/useCBNRate';
import { generateGoAMLXml, downloadXmlFile } from '@/lib/generateGoAMLXml';
import { IMTOInvestigation } from '@/components/IMTOInvestigation';
import { CrossBorderSLACard } from '@/components/CrossBorderSLACard';
import { PhantomPayrollNetwork } from '@/components/PhantomPayrollNetwork';
import { CommingleAlertCard } from '@/components/CommingleAlertCard';
import { CaseLifecycleBar } from '@/components/CaseLifecycleBar';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, AlertTriangle, Sparkles, Bot, Send, FileDown,
  Loader2, CheckCircle2, Shield, Clock, User, Fingerprint,
  CreditCard, ArrowUpRight, ArrowDownLeft, Flag, ShieldAlert,
  ShieldCheck, Eye, Users, RefreshCw,
} from 'lucide-react';

/* ── Mock Analysts ────────────────────────────────────── */

const ANALYSTS = [
  { id: 'a1', name: 'Chioma Adeyemi', initials: 'CA', color: 'bg-blue-500/15 text-blue-700 dark:text-blue-400' },
  { id: 'a2', name: 'Ibrahim Musa', initials: 'IM', color: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400' },
  { id: 'a3', name: 'Ngozi Okafor', initials: 'NO', color: 'bg-purple-500/15 text-purple-700 dark:text-purple-400' },
  { id: 'a4', name: 'Emeka Obi', initials: 'EO', color: 'bg-amber-500/15 text-amber-700 dark:text-amber-400' },
];

// Default assignments for some alerts
const DEFAULT_ASSIGNMENTS: Record<string, string> = {
  [mockAlerts[0]?.id]: 'a1',
  [mockAlerts[1]?.id]: 'a3',
  [mockAlerts[2]?.id]: 'a2',
};

/* ── Helpers ─────────────────────────────────────────── */

function formatNGN(amount: number) {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(amount);
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleString('en-NG', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

const riskColors: Record<string, string> = {
  Critical: 'bg-destructive/10 text-destructive border-destructive/30',
  High: 'bg-[hsl(var(--risk-high)/0.1)] text-[hsl(var(--risk-high))] border-[hsl(var(--risk-high)/0.3)]',
  Medium: 'bg-[hsl(var(--risk-medium)/0.1)] text-[hsl(var(--risk-medium))] border-[hsl(var(--risk-medium)/0.3)]',
  Low: 'bg-[hsl(var(--risk-low)/0.1)] text-[hsl(var(--risk-low))] border-[hsl(var(--risk-low)/0.3)]',
};

const channelColors: Record<TxChannel, string> = {
  'POS': 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
  'Mobile Transfer': 'bg-blue-500/15 text-blue-700 dark:text-blue-400',
  'USSD': 'bg-purple-500/15 text-purple-700 dark:text-purple-400',
  'ATM Withdrawal': 'bg-muted text-muted-foreground',
  'Online Banking': 'bg-primary/10 text-primary',
  'Card Payment': 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
  'Cash Deposit': 'bg-destructive/15 text-destructive',
  'IMTO Cash Payout': 'bg-destructive/15 text-destructive',
};

type CaseStatus = 'Open' | 'Under Review' | 'Escalated' | 'Closed';

interface ChatMessage {
  id: number;
  role: 'user' | 'assistant';
  content: string;
}

const quickResponses: Record<string, string> = {
  shorter: '✅ Done — I\'ve condensed the narrative to focus on key facts while preserving regulatory compliance language.',
  flags: '✅ Done — I\'ve appended the behavioral red flags as a numbered appendix to the narrative.',
  fatf: '✅ Done — FATF Recommendation 20 on STR obligations referenced in section 2 of the narrative.',
  circular: '✅ Done — CBN Circular BSD/DIR/PUB/LAB/019/002 cited in the regulatory basis paragraph.',
  hausa: '✅ Done — Narrative section translated to Hausa for internal memo distribution. goAML field labels retained in English.',
  formal: '✅ Done — Narrative reformatted to formal NFIU register: passive voice, institutional phrasing, and regulatory cross-references applied throughout.',
  default: '✅ Understood — Draft updated accordingly. Review changes in the editor.',
};

function getResponse(input: string): string {
  const l = input.toLowerCase();
  if (l.includes('short') || l.includes('concise')) return quickResponses.shorter;
  if (l.includes('flag') || l.includes('red flag')) return quickResponses.flags;
  if (l.includes('fatf') || l.includes('recommendation')) return quickResponses.fatf;
  if (l.includes('circular') || l.includes('bsd/dir')) return quickResponses.circular;
  if (l.includes('hausa')) return quickResponses.hausa;
  if (l.includes('formal') || l.includes('nfiu language')) return quickResponses.formal;
  return quickResponses.default;
}

const DISMISSAL_REASONS = [
  'Name/DOB mismatch',
  'Different nationality',
  'Verified alternate identity',
  'Business transaction',
  'Insufficient evidence',
] as const;

/* ── Status Stepper ──────────────────────────────────── */

const STEPS: { key: CaseStatus; label: string }[] = [
  { key: 'Open', label: 'Open' },
  { key: 'Under Review', label: 'Under Review' },
  { key: 'Escalated', label: 'Escalated to NFIU' },
  { key: 'Closed', label: 'Closed (FP)' },
];

function StatusStepper({ status }: { status: CaseStatus }) {
  const currentIdx = status === 'Closed'
    ? 3
    : STEPS.findIndex(s => s.key === status);

  return (
    <div className="flex items-center gap-0 w-full">
      {STEPS.map((step, i) => {
        // For Escalated/Closed which are terminal branches
        const isTerminal = i >= 2;
        const isActive = i === currentIdx;
        const isPast = i < currentIdx || (status === 'Closed' && i < 3) || (status === 'Escalated' && i < 2);
        // Only show first two + the relevant terminal
        if (isTerminal && !isActive && status !== 'Under Review' && status !== 'Open') {
          if (status === 'Escalated' && i === 3) return null;
          if (status === 'Closed' && i === 2) return null;
        }

        return (
          <div key={step.key} className="flex items-center gap-0 flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1">
              <div className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors ${
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : isPast
                    ? 'bg-primary/20 text-primary'
                    : 'bg-muted text-muted-foreground'
              }`}>
                {isPast && !isActive ? <CheckCircle2 className="h-3.5 w-3.5" /> : i + 1}
              </div>
              <span className={`text-[10px] whitespace-nowrap ${isActive ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && !(isTerminal) && (
              <div className={`flex-1 h-px mx-1 mt-[-14px] ${isPast ? 'bg-primary/40' : 'bg-border'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ── Alert List Card ─────────────────────────────────── */

function MiniAlertCard({ alert, isSelected, onClick, status, assignedAnalyst }: {
  alert: Alert; isSelected: boolean; onClick: () => void; status: CaseStatus;
  assignedAnalyst?: typeof ANALYSTS[number];
}) {
  const isResolved = status === 'Escalated' || status === 'Closed';

  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-lg p-3 transition-all border relative ${
        isSelected
          ? 'bg-primary/5 border-primary/30 shadow-sm'
          : 'bg-card border-transparent hover:bg-muted/50 hover:border-border'
      } ${isResolved ? 'opacity-50' : ''}`}
    >
      {isResolved && (
        <div className="absolute top-2 right-2">
          <CheckCircle2 className="h-4 w-4 text-primary" />
        </div>
      )}
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[11px] font-mono text-muted-foreground">{alert.caseId}</span>
        <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${riskColors[alert.riskLevel]}`}>
          {alert.riskLevel}
        </Badge>
      </div>
      <p className="text-sm font-semibold text-foreground truncate">{alert.customerProfile.fullName}</p>
      <p className="text-xs text-muted-foreground mt-0.5 truncate">{alert.ruleTriggered}</p>
      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center gap-1.5">
          <Badge variant="secondary" className={`text-[10px] ${
            status === 'Closed' ? 'bg-muted text-muted-foreground' :
            status === 'Escalated' ? 'bg-destructive/10 text-destructive' :
            status === 'Under Review' ? 'bg-primary/10 text-primary' : ''
          }`}>
            {status === 'Closed' ? 'False Positive' : status}
          </Badge>
        </div>
        <div className="flex items-center gap-1.5">
          {assignedAnalyst ? (
            <Avatar className="h-4 w-4">
              <AvatarFallback className={`text-[7px] ${assignedAnalyst.color}`}>{assignedAnalyst.initials}</AvatarFallback>
            </Avatar>
          ) : (
            <span className="text-[9px] text-amber-600 dark:text-amber-400 font-medium">Unassigned</span>
          )}
          <span className="text-[10px] text-muted-foreground">{alert.timeElapsed}</span>
        </div>
      </div>
    </button>
  );
}

/* ── Main Page ───────────────────────────────────────── */

export default function AlertWorkspace() {
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string>(mockAlerts[0].id);
  const [escalateOpen, setEscalateOpen] = useState(false);
  const [fpDialogOpen, setFpDialogOpen] = useState(false);
  const [fpReason, setFpReason] = useState('');

  // Status overrides (local state for lifecycle)
  const [statusOverrides, setStatusOverrides] = useState<Record<string, CaseStatus>>({});
  // Assignment state
  const [assignments, setAssignments] = useState<Record<string, string>>(DEFAULT_ASSIGNMENTS);
  const { append: addAuditEntry } = useAuditLog();
  const { rate: cbnRate } = useCBNRate();

  const getStatus = useCallback((alertId: string, original: string): CaseStatus => {
    return statusOverrides[alertId] ?? (original as CaseStatus);
  }, [statusOverrides]);

  const setAlertStatus = useCallback((alertId: string, status: CaseStatus) => {
    setStatusOverrides(prev => ({ ...prev, [alertId]: status }));
  }, []);

  const getAssignedAnalyst = useCallback((alertId: string) => {
    const aId = assignments[alertId];
    return aId ? ANALYSTS.find(a => a.id === aId) : undefined;
  }, [assignments]);

  const handleReassign = useCallback((alertId: string, caseId: string, analystId: string) => {
    const analyst = ANALYSTS.find(a => a.id === analystId);
    if (!analyst) return;
    setAssignments(prev => ({ ...prev, [alertId]: analystId }));
    addAuditEntry({ action: 'NFIU_ESCALATION', analyst: analyst.name, caseId, justification: `Case reassigned to ${analyst.name}` });
    toast({ title: 'Case reassigned', description: `${caseId} assigned to ${analyst.name}.` });
  }, [addAuditEntry, toast]);

  const riskParam = searchParams.get('risk');
  const statusParam = searchParams.get('status');
  const activeFilterLabel = riskParam ? `${riskParam} risk` : statusParam ? `${statusParam} alerts` : null;

  const clearFilterParams = useCallback(() => {
    setSearchParams({});
  }, [setSearchParams]);

  // Channel filter state
  const [channelFilter, setChannelFilter] = useState<TxChannel | 'All'>('All');

  // STR state
  const [strDraft, setStrDraft] = useState('');
  const [strLoading, setStrLoading] = useState(false);
  const [strGenerated, setStrGenerated] = useState(false);
  const [editVersion, setEditVersion] = useState(0);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [underReviewAtMap, setUnderReviewAtMap] = useState<Record<string, string>>({});
  const [exportedIds, setExportedIds] = useState<Record<string, boolean>>({});
  const chatEndRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    return mockAlerts.filter((a) => {
      const q = search.toLowerCase();
      const effectiveStatus = getStatus(a.id, a.status);
      const matchesStatus = statusParam ? effectiveStatus === statusParam : true;
      const matchesRisk = riskParam ? a.riskLevel === riskParam : true;
      return matchesStatus && matchesRisk && (
        !q ||
        a.customerProfile.fullName.toLowerCase().includes(q) ||
        a.caseId.toLowerCase().includes(q) ||
        a.ruleTriggered.toLowerCase().includes(q)
      );
    });
  }, [search, riskParam, statusParam, getStatus]);

  const actionableCount = useMemo(() => {
    return filtered.filter(a => {
      const s = getStatus(a.id, a.status);
      return s !== 'Escalated' && s !== 'Closed';
    }).length;
  }, [filtered, getStatus]);

  const selected = filtered.find((a) => a.id === selectedId) || filtered[0];

  // Reset STR state when alert changes
  useEffect(() => {
    const currentAlert = mockAlerts.find(a => a.id === selectedId);
    // Cross-border flags arrive with the overseas referral data already in
    // the narrative — pre-populate the draft so the analyst only fills in
    // the Nigerian transaction tail.
    const isCrossBorder = currentAlert?.alertType === 'CROSS_BORDER_FLAG';
    setStrDraft(isCrossBorder ? currentAlert!.aiDraftedNarrative : '');
    setStrLoading(false);
    setStrGenerated(isCrossBorder);
    setChatMessages([]);
    setEditVersion(0);
    setChannelFilter('All');
    setEditVersion(0);
  }, [selectedId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleGenerateSTR = () => {
    if (!selected) return;
    setStrLoading(true);
    setStrDraft('');
    setTimeout(() => {
      setStrDraft(selected.aiDraftedNarrative);
      setStrLoading(false);
      setStrGenerated(true);
    }, 2200);
  };

  const handleSendChat = () => {
    if (!chatInput.trim()) return;
    const userMsg: ChatMessage = { id: Date.now(), role: 'user', content: chatInput };
    setChatMessages((prev) => [...prev, userMsg]);
    const input = chatInput;
    setChatInput('');
    setIsTyping(true);
    setTimeout(() => {
      setChatMessages((prev) => [...prev, { id: Date.now(), role: 'assistant', content: getResponse(input) }]);
      setIsTyping(false);
      setEditVersion((v) => v + 1);
    }, 1400);
  };

  const handleExport = useCallback(() => {
    if (!selected) return;
    const today = new Date().toISOString().split('T')[0];
    const filename = `STR_${selected.caseId}_${today}.xml`;
    const xml = generateGoAMLXml(selected, strDraft);
    downloadXmlFile(xml, filename);
    setExportedIds((prev) => ({ ...prev, [selected.id]: true }));
    toast({
      title: 'STR exported',
      description: `${filename} ready for NFIU goAML portal upload.`,
    });
  }, [selected, strDraft, toast]);

  const handleEscalate = useCallback(() => {
    setEscalateOpen(true);
  }, []);

  const handleMarkUnderReview = useCallback(() => {
    if (!selected) return;
    setAlertStatus(selected.id, 'Under Review');
    toast({ title: 'Status updated', description: `${selected.caseId} marked as Under Review.` });
  }, [selected, setAlertStatus, toast]);

  const handleCloseFP = useCallback(() => {
    if (!selected || !fpReason) return;
    setAlertStatus(selected.id, 'Closed');
    toast({ title: 'Alert closed', description: `${selected.caseId} closed as False Positive — ${fpReason}.` });
    setFpDialogOpen(false);
    setFpReason('');
  }, [selected, fpReason, setAlertStatus, toast]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.shiftKey && e.key === 'E') { e.preventDefault(); handleEscalate(); }
      if (e.shiftKey && e.key === 'D') { e.preventDefault(); handleExport(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleEscalate, handleExport]);

  if (!selected) return null;

  const cp = selected.customerProfile;
  const currentStatus = getStatus(selected.id, selected.status);
  const isResolved = currentStatus === 'Escalated' || currentStatus === 'Closed';

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-h-0">
          {/* Top bar */}
          <div className="flex items-center justify-between border-b px-6 py-3 bg-card shrink-0">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <h1 className="text-lg font-bold text-foreground">Alert Workspace</h1>
            </div>
            <div className="flex items-center gap-2">
              <AuditBell />
              <NotificationBell />
              <ThemeToggle />
            </div>
          </div>

          {/* Split pane */}
          <div className="flex flex-1 min-h-0">
            {/* Left pane – Alert list (30%) */}
            <div className="w-[30%] min-w-[280px] border-r flex flex-col bg-muted/20">
              <div className="p-3 border-b bg-card">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Search alerts…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-8 h-8 text-sm bg-background"
                  />
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <p className="text-[11px] text-muted-foreground">
                    {actionableCount} alert{actionableCount !== 1 ? 's' : ''} requiring action
                    {actionableCount < filtered.length && (
                      <span className="text-muted-foreground/60"> · {filtered.length - actionableCount} resolved</span>
                    )}
                  </p>
                  {activeFilterLabel && <ActiveFilterChip label={activeFilterLabel} onClear={clearFilterParams} />}
                </div>
              </div>
              <ScrollArea className="flex-1">
                <div className="p-2 space-y-1">
                  {filtered.map((alert) => (
                    <MiniAlertCard
                      key={alert.id}
                      alert={alert}
                      isSelected={alert.id === selectedId}
                      onClick={() => setSelectedId(alert.id)}
                      status={getStatus(alert.id, alert.status)}
                      assignedAnalyst={getAssignedAnalyst(alert.id)}
                    />
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* Right pane – Investigation workspace (70%) */}
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
              <ScrollArea className="flex-1">
                <div className="p-6 space-y-6">
                  {/* Cross-border SLA banner — overseas-flagged STR clock */}
                  {selected.alertType === 'CROSS_BORDER_FLAG' && selected.crossBorder && (
                    <motion.div key={`xb-${selected.id}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                      <CrossBorderSLACard context={selected.crossBorder} />
                    </motion.div>
                  )}

                  {/* IMTO-specific investigation panel */}
                  {selected.alertType && selected.alertType.startsWith('IMTO_') && (
                    <motion.div key={`imto-${selected.id}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                      <IMTOInvestigation alert={selected} isResolved={isResolved} />
                    </motion.div>
                  )}

                  {/* Phantom Payroll hub-and-spoke network */}
                  {selected.alertType === 'B2P_PHANTOM_PAYROLL_PATTERN' && selected.phantomPayroll && (
                    <motion.div key={`pp-${selected.id}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                      <PhantomPayrollNetwork context={selected.phantomPayroll} />
                    </motion.div>
                  )}

                  {/* IMTO Settlement Account commingling card */}
                  {selected.alertType === 'IMTO_ACCOUNT_COMMINGLING' && selected.commingling && (
                    <motion.div key={`cm-${selected.id}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                      <CommingleAlertCard alert={selected} />
                    </motion.div>
                  )}

                  {/* Case Header */}
                  <motion.div key={selected.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                    <Card className={`border-l-4 ${isResolved ? 'border-l-muted-foreground' : 'border-l-destructive'}`}>
                      <CardContent className="py-4 px-5 space-y-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2">
                              <AlertTriangle className="h-4 w-4 text-destructive" />
                              <span className="font-semibold text-foreground text-sm">{selected.ruleTriggered}</span>
                            </div>
                            <p className="text-xs text-muted-foreground max-w-xl">{selected.description}</p>
                            <div className="flex items-center gap-3 pt-1">
                              <span className="text-[11px] font-mono text-muted-foreground">{selected.caseId}</span>
                              <Badge variant="outline" className={`text-[10px] ${riskColors[selected.riskLevel]}`}>
                                {selected.riskLevel} · Score {cp.riskScore}/100
                              </Badge>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2 shrink-0">
                            <Button size="sm" variant="destructive" className="gap-1.5" onClick={handleEscalate} disabled={isResolved}>
                              <ShieldAlert className="h-3.5 w-3.5" />
                              Escalate to NFIU
                              <Badge variant="outline" className="text-[8px] px-1 py-0 ml-1 bg-destructive-foreground/10 text-destructive-foreground border-destructive-foreground/20">⇧E</Badge>
                            </Button>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="gap-1.5 text-xs h-7"
                                onClick={handleMarkUnderReview}
                                disabled={currentStatus !== 'Open'}
                              >
                                <Eye className="h-3 w-3" /> Mark Under Review
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="gap-1.5 text-xs h-7"
                                onClick={() => setFpDialogOpen(true)}
                                disabled={isResolved}
                              >
                                <ShieldCheck className="h-3 w-3" /> Close as FP
                              </Button>
                            </div>
                          </div>
                        </div>

                        {/* Assignment row */}
                        <div className="flex items-center justify-between pt-2 border-t border-border">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] text-muted-foreground">Assigned to:</span>
                              {(() => {
                                const assignee = getAssignedAnalyst(selected.id);
                                return assignee ? (
                                  <div className="flex items-center gap-1.5">
                                    <Avatar className="h-5 w-5">
                                      <AvatarFallback className={`text-[8px] ${assignee.color}`}>{assignee.initials}</AvatarFallback>
                                    </Avatar>
                                    <span className="text-xs font-medium text-foreground">{assignee.name}</span>
                                  </div>
                                ) : (
                                  <span className="text-xs font-medium text-amber-600 dark:text-amber-400">Unassigned</span>
                                );
                              })()}
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-6 w-6">
                                    <RefreshCw className="h-3 w-3 text-muted-foreground" />
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-48 p-1" align="start">
                                  <p className="text-[10px] uppercase text-muted-foreground tracking-wider px-2 py-1.5">Reassign to</p>
                                  {ANALYSTS.map((a) => (
                                    <button
                                      key={a.id}
                                      onClick={() => handleReassign(selected.id, selected.caseId, a.id)}
                                      className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs hover:bg-muted transition-colors text-left"
                                    >
                                      <Avatar className="h-5 w-5">
                                        <AvatarFallback className={`text-[8px] ${a.color}`}>{a.initials}</AvatarFallback>
                                      </Avatar>
                                      <span className="text-foreground">{a.name}</span>
                                      {assignments[selected.id] === a.id && (
                                        <CheckCircle2 className="h-3 w-3 text-primary ml-auto" />
                                      )}
                                    </button>
                                  ))}
                                </PopoverContent>
                              </Popover>
                            </div>
                            <Separator orientation="vertical" className="h-4" />
                            <div className="flex items-center gap-1.5">
                              <Users className="h-3 w-3 text-muted-foreground" />
                              <span className="text-[11px] text-muted-foreground">Watched by <span className="font-medium text-foreground">2</span></span>
                            </div>
                          </div>
                        </div>

                        {/* Status stepper */}
                        <div className="pt-2 border-t border-border">
                          <StatusStepper status={currentStatus} />
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>

                  {/* Customer Profile (Collapsible) */}
                  <Accordion type="multiple" defaultValue={['customer-profile', 'red-flags']}>
                    <AccordionItem value="customer-profile" className="border rounded-lg overflow-hidden">
                      <Card className="border-0 shadow-none">
                        <AccordionTrigger className="px-5 py-3 hover:no-underline">
                          <div className="flex items-center gap-2 text-sm font-semibold">
                            <User className="h-4 w-4 text-muted-foreground" />
                            Customer Profile
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <CardContent className="py-3 px-5 pt-0">
                            <div className="grid grid-cols-4 gap-4">
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <div>
                                  <p className="text-[10px] uppercase text-muted-foreground tracking-wider">Customer</p>
                                  <p className="text-sm font-semibold text-foreground">{cp.fullName}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Fingerprint className="h-4 w-4 text-muted-foreground" />
                                <div>
                                  <p className="text-[10px] uppercase text-muted-foreground tracking-wider">BVN</p>
                                  <p className="text-sm font-mono text-foreground">{cp.bvn}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <CreditCard className="h-4 w-4 text-muted-foreground" />
                                <div>
                                  <p className="text-[10px] uppercase text-muted-foreground tracking-wider">NUBAN</p>
                                  <p className="text-sm font-mono text-foreground">{cp.nuban}</p>
                                </div>
                              </div>
                              <div>
                                <p className="text-[10px] uppercase text-muted-foreground tracking-wider">KYC Tier</p>
                                <p className="text-sm font-medium text-foreground">{cp.kycTier}</p>
                              </div>
                            </div>
                          </CardContent>
                        </AccordionContent>
                      </Card>
                    </AccordionItem>

                  {/* Transaction Timeline */}
                  {(() => {
                    // Channel summary
                    const channelCounts = selected.transactions.reduce<Record<string, number>>((acc, tx) => {
                      acc[tx.channel] = (acc[tx.channel] || 0) + 1;
                      return acc;
                    }, {});
                    const filteredTx = channelFilter === 'All'
                      ? selected.transactions
                      : selected.transactions.filter(tx => tx.channel === channelFilter);

                    return (
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-semibold flex items-center gap-2">
                            <Clock className="h-4 w-4 text-primary" />
                            Transaction Timeline ({filteredTx.length}{channelFilter !== 'All' ? ` of ${selected.transactions.length}` : ''})
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {/* Channel summary chips */}
                          <div className="flex flex-wrap gap-1.5">
                            <button
                              onClick={() => setChannelFilter('All')}
                              className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${
                                channelFilter === 'All'
                                  ? 'bg-primary text-primary-foreground border-primary'
                                  : 'bg-card text-muted-foreground hover:border-primary/30'
                              }`}
                            >
                              All ({selected.transactions.length})
                            </button>
                            {Object.entries(channelCounts).map(([ch, count]) => (
                              <button
                                key={ch}
                                onClick={() => setChannelFilter(ch as TxChannel)}
                                className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${
                                  channelFilter === ch
                                    ? 'bg-primary text-primary-foreground border-primary'
                                    : `${channelColors[ch as TxChannel] || 'bg-muted text-muted-foreground'} border-transparent hover:border-primary/30`
                                }`}
                              >
                                {count} {ch}
                              </button>
                            ))}
                          </div>

                          {/* Timeline */}
                          <div className="relative space-y-0">
                            {filteredTx.map((tx, i) => (
                              <div key={tx.id} className="flex items-start gap-3 relative">
                                {i < filteredTx.length - 1 && (
                                  <div className="absolute left-[15px] top-8 bottom-0 w-px bg-border" />
                                )}
                                <div className={`shrink-0 mt-1 h-8 w-8 rounded-full flex items-center justify-center border ${
                                  tx.type === 'Credit'
                                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                                    : 'bg-destructive/10 border-destructive/30 text-destructive'
                                }`}>
                                  {tx.type === 'Credit'
                                    ? <ArrowDownLeft className="h-3.5 w-3.5" />
                                    : <ArrowUpRight className="h-3.5 w-3.5" />
                                  }
                                </div>
                                <div className="flex-1 pb-4">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <div className="flex items-center gap-2">
                                        <p className="text-sm font-medium text-foreground">{tx.counterparty}</p>
                                        <span className={`inline-flex text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${channelColors[tx.channel] || 'bg-muted text-muted-foreground'}`}>
                                          {tx.channel}
                                        </span>
                                      </div>
                                      <p className="text-[11px] text-muted-foreground">{formatTime(tx.date)}</p>
                                    </div>
                                    <div className="text-right">
                                      <p className={`text-sm font-semibold ${tx.type === 'Credit' ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive'}`}>
                                        {tx.type === 'Credit' ? '+' : '-'}{formatNGN(tx.amountNGN)}
                                      </p>
                                      {tx.channel === 'IMTO Cash Payout' ? (
                                        <p className="text-[10px] text-muted-foreground tabular-nums">
                                          ≈ ${(tx.amountNGN / cbnRate).toFixed(0)} USD
                                          {tx.agentLocation && <span className="ml-1">· {tx.agentLocation}</span>}
                                        </p>
                                      ) : (
                                        <p className="text-[10px] text-muted-foreground">Bal: {formatNGN(tx.balanceAfter)}</p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })()}

                    {/* Behavioral Red Flags (Collapsible) */}
                    <AccordionItem value="red-flags" className="border rounded-lg overflow-hidden">
                      <Card className="border-0 shadow-none">
                        <AccordionTrigger className="px-5 py-3 hover:no-underline">
                          <div className="flex items-center gap-2 text-sm font-semibold">
                            <Flag className="h-4 w-4 text-destructive" />
                            Behavioral Red Flags
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <CardContent className="pt-0">
                            <ul className="space-y-2">
                              {selected.behavioralRedFlags.map((flag, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                                  <AlertTriangle className="h-3.5 w-3.5 mt-0.5 text-destructive shrink-0" />
                                  {flag}
                                </li>
                              ))}
                            </ul>
                          </CardContent>
                        </AccordionContent>
                      </Card>
                    </AccordionItem>
                  </Accordion>

                  <Separator />

                  {/* AI STR Co-Pilot */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-primary" />
                        <h2 className="text-base font-bold text-foreground">AI STR Co-Pilot</h2>
                      </div>
                      {strGenerated && (
                        <Badge variant="outline" className="text-[10px] gap-1">
                          <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                          Draft v{editVersion + 1}
                        </Badge>
                      )}
                    </div>

                    {!strGenerated && !strLoading && (
                      <Card className="border-dashed">
                        <CardContent className="py-10 flex flex-col items-center gap-4">
                          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                            <Sparkles className="h-7 w-7 text-primary" />
                          </div>
                          <div className="text-center space-y-1.5">
                            <p className="text-sm font-medium text-foreground">Generate an NFIU-formatted STR</p>
                            <p className="text-xs text-muted-foreground max-w-md">
                              AI will analyze the alert data, correlate transactions, and produce a draft Suspicious Transaction Report ready for NFIU goAML submission.
                            </p>
                          </div>
                          <Button size="lg" className="gap-2 mt-2" onClick={handleGenerateSTR}>
                            <Sparkles className="h-4 w-4" /> Generate STR Narrative
                          </Button>
                        </CardContent>
                      </Card>
                    )}

                    {strLoading && (
                      <Card>
                        <CardContent className="py-8 space-y-4">
                          <div className="flex items-center justify-center gap-3">
                            <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}>
                              <Loader2 className="h-6 w-6 text-primary" />
                            </motion.div>
                            <div>
                              <p className="text-sm font-medium text-foreground">Analyzing transaction network…</p>
                              <p className="text-xs text-muted-foreground">
                                Correlating {selected.transactions.length} events across compliance databases
                              </p>
                            </div>
                          </div>
                          <div className="flex justify-center gap-2">
                            {['KYC Check', 'PEP Screen', 'Pattern Analysis', 'Drafting'].map((step, i) => (
                              <motion.div key={step} initial={{ opacity: 0.3 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.5 }}>
                                <Badge variant="outline" className="text-[10px]">{step}</Badge>
                              </motion.div>
                            ))}
                          </div>
                          <div className="space-y-2 pt-2">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-[90%]" />
                            <Skeleton className="h-4 w-[75%]" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-[60%]" />
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {strGenerated && (
                      <div className="flex gap-4 min-h-[400px]">
                        {/* Editor */}
                         <div className={`flex-1 flex flex-col rounded-lg border overflow-hidden relative transition-all duration-500 ${isTyping ? 'border-primary/50 shadow-[0_0_20px_hsl(var(--primary)/0.2)]' : ''}`}>
                          <div className="px-4 py-2 border-b bg-muted/30 flex items-center justify-between shrink-0">
                            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">STR Draft Editor</span>
                            <div className="flex items-center gap-2">
                              {strGenerated && (
                                <Badge variant="outline" className="text-[9px] gap-1 bg-primary/5 text-primary border-primary/20">
                                  <Sparkles className="h-2.5 w-2.5" />
                                  AI Generated — Review Required
                                </Badge>
                              )}
                              <Badge variant="outline" className="text-[9px]">Editable</Badge>
                              <Button size="sm" className="h-7 gap-1.5 text-xs" onClick={handleExport}>
                                <FileDown className="h-3 w-3" /> Export goAML XML
                                <Badge variant="outline" className="text-[8px] px-1 py-0 ml-0.5 bg-primary-foreground/10 border-primary-foreground/20">⇧D</Badge>
                              </Button>
                            </div>
                          </div>
                          <textarea
                            value={strDraft}
                            onChange={(e) => setStrDraft(e.target.value)}
                            className="flex-1 w-full resize-none bg-background p-4 text-xs font-mono leading-relaxed text-foreground focus:outline-none min-h-[350px]"
                            spellCheck={false}
                          />
                        </div>

                        {/* Chat assistant */}
                        <div className="w-72 flex flex-col rounded-lg border overflow-hidden shrink-0">
                          <div className="px-3 py-2 border-b bg-muted/30 flex items-center gap-2 shrink-0">
                            <Bot className="h-3.5 w-3.5 text-primary" />
                            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">AI Assistant</span>
                          </div>

                          <ScrollArea className="flex-1 p-3">
                            <div className="space-y-3">
                              <AnimatePresence>
                                {chatMessages.map((msg) => (
                                  <motion.div
                                    key={msg.id}
                                    initial={{ opacity: 0, y: 6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                  >
                                    <div className={`max-w-[90%] rounded-lg px-3 py-2 text-xs leading-relaxed ${
                                      msg.role === 'user'
                                        ? 'bg-primary text-primary-foreground'
                                        : 'bg-muted text-foreground'
                                    }`}>
                                      {msg.content}
                                    </div>
                                  </motion.div>
                                ))}
                              </AnimatePresence>
                              {isTyping && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                                  <div className="bg-muted rounded-lg px-3 py-2 text-xs text-muted-foreground flex items-center gap-1.5">
                                    <Loader2 className="h-3 w-3 animate-spin" /> Updating draft…
                                  </div>
                                </motion.div>
                              )}
                              <div ref={chatEndRef} />
                            </div>
                          </ScrollArea>

                          <Separator />
                          <div className="p-3 space-y-2 shrink-0">
                            <div className="flex gap-2">
                              <Input
                                placeholder="Refine STR draft with AI…"
                                value={chatInput}
                                onChange={(e) => setChatInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
                                className="h-8 text-xs bg-background"
                              />
                              <Button size="icon" className="h-8 w-8 shrink-0" onClick={handleSendChat} disabled={!chatInput.trim()}>
                                <Send className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {['Make it shorter', 'Add red flags', 'Add FATF typology reference', 'Cite CBN circular BSD/DIR/PUB/LAB/019/002', 'Translate narrative to Hausa (for internal memo)', 'Formal NFIU language'].map((s) => (
                                <button
                                  key={s}
                                  onClick={() => setChatInput(s)}
                                  className="text-[10px] px-2 py-0.5 rounded-full border bg-card text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors"
                                >
                                  {s}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </ScrollArea>
            </div>
          </div>
        </div>
      </div>

      <ConfirmEscalationDialog
        open={escalateOpen}
        onOpenChange={setEscalateOpen}
        customerName={selected.customerProfile.fullName}
        caseId={selected.caseId}
        action="NFIU_ESCALATION"
        onConfirmed={() => {
          setAlertStatus(selected.id, 'Escalated');
          toast({ title: 'Escalated to NFIU', description: `Case ${selected.caseId} escalated.` });
        }}
      />

      {/* Close as False Positive dialog */}
      <AlertDialog open={fpDialogOpen} onOpenChange={(v) => { if (!v) setFpReason(''); setFpDialogOpen(v); }}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" /> Close as False Positive
            </AlertDialogTitle>
            <AlertDialogDescription>
              Closing <span className="font-semibold text-foreground">{selected.caseId}</span> as a false positive. This action will be logged to the audit trail.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-3 py-2">
            <Label className="text-xs font-medium">Dismissal reason</Label>
            <Select value={fpReason} onValueChange={setFpReason}>
              <SelectTrigger><SelectValue placeholder="Select reason…" /></SelectTrigger>
              <SelectContent>
                {DISMISSAL_REASONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button disabled={!fpReason} onClick={handleCloseFP}>Confirm Close</Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SidebarProvider>
  );
}
