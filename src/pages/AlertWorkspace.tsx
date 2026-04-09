import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { mockAlerts, type Alert } from '@/data/mockAlerts';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, AlertTriangle, Sparkles, Bot, Send, FileDown,
  Loader2, CheckCircle2, Shield, Clock, User, Fingerprint,
  CreditCard, ArrowUpRight, ArrowDownLeft, Flag, ShieldAlert,
} from 'lucide-react';

/* ── Helpers ─────────────────────────────────────────── */

function formatNGN(amount: number) {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(amount);
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleString('en-NG', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false,
  });
}

const riskColors: Record<string, string> = {
  Critical: 'bg-destructive/10 text-destructive border-destructive/30',
  High: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/30',
  Medium: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/30',
  Low: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30',
};

/* ── Chat types ──────────────────────────────────────── */

interface ChatMessage {
  id: number;
  role: 'user' | 'assistant';
  content: string;
}

const quickResponses: Record<string, string> = {
  shorter: '✅ Done — I\'ve condensed the narrative to focus on key facts while preserving regulatory compliance language.',
  french: '✅ Done — Narrative translated to French. NFIU field labels retained in English per goAML spec.',
  flags: '✅ Done — I\'ve appended the behavioral red flags as a numbered appendix to the narrative.',
  default: '✅ Understood — Draft updated accordingly. Review changes in the editor.',
};

function getResponse(input: string): string {
  const l = input.toLowerCase();
  if (l.includes('short') || l.includes('concise')) return quickResponses.shorter;
  if (l.includes('french') || l.includes('translate')) return quickResponses.french;
  if (l.includes('flag') || l.includes('red flag')) return quickResponses.flags;
  return quickResponses.default;
}

/* ── Alert List Card ─────────────────────────────────── */

function MiniAlertCard({ alert, isSelected, onClick }: { alert: Alert; isSelected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-lg p-3 transition-all border ${
        isSelected
          ? 'bg-primary/5 border-primary/30 shadow-sm'
          : 'bg-card border-transparent hover:bg-muted/50 hover:border-border'
      }`}
    >
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[11px] font-mono text-muted-foreground">{alert.caseId}</span>
        <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${riskColors[alert.riskLevel]}`}>
          {alert.riskLevel}
        </Badge>
      </div>
      <p className="text-sm font-semibold text-foreground truncate">{alert.customerProfile.fullName}</p>
      <p className="text-xs text-muted-foreground mt-0.5 truncate">{alert.ruleTriggered}</p>
      <div className="flex items-center justify-between mt-2">
        <Badge variant="secondary" className="text-[10px]">{alert.status}</Badge>
        <span className="text-[10px] text-muted-foreground">{alert.timeElapsed}</span>
      </div>
    </button>
  );
}

/* ── Main Page ───────────────────────────────────────── */

export default function AlertWorkspace() {
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string>(mockAlerts[0].id);

  // STR state
  const [strDraft, setStrDraft] = useState('');
  const [strLoading, setStrLoading] = useState(false);
  const [strGenerated, setStrGenerated] = useState(false);
  const [editVersion, setEditVersion] = useState(0);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    return mockAlerts.filter((a) => {
      const q = search.toLowerCase();
      return (
        a.status === 'Open' || a.status === 'Under Review'
      ) && (
        !q ||
        a.customerProfile.fullName.toLowerCase().includes(q) ||
        a.caseId.toLowerCase().includes(q) ||
        a.ruleTriggered.toLowerCase().includes(q)
      );
    });
  }, [search]);

  const selected = filtered.find((a) => a.id === selectedId) || filtered[0];

  // Reset STR state when alert changes
  useEffect(() => {
    setStrDraft('');
    setStrLoading(false);
    setStrGenerated(false);
    setChatMessages([]);
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
      setChatMessages([{
        id: 1,
        role: 'assistant',
        content: `I've drafted an STR for ${selected.customerProfile.fullName} based on "${selected.ruleTriggered}". The narrative is pre-filled in the editor. You can edit directly or ask me to refine it.`,
      }]);
    }, 2500);
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
    toast({
      title: 'Exporting to goAML XML',
      description: `STR for ${selected.caseId} packaged in NFIU goAML XML format and queued for submission.`,
    });
  }, [selected, toast]);

  const handleEscalate = useCallback(() => {
    toast({
      title: 'Escalated to NFIU',
      description: `Case ${selected.caseId} has been escalated with priority ${selected.riskLevel}.`,
    });
  }, [selected, toast]);

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
            <ThemeToggle />
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
                <p className="text-[11px] text-muted-foreground mt-2">
                  {filtered.length} alert{filtered.length !== 1 ? 's' : ''} requiring action
                </p>
              </div>
              <ScrollArea className="flex-1">
                <div className="p-2 space-y-1">
                  {filtered.map((alert) => (
                    <MiniAlertCard
                      key={alert.id}
                      alert={alert}
                      isSelected={alert.id === selectedId}
                      onClick={() => setSelectedId(alert.id)}
                    />
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* Right pane – Investigation workspace (70%) */}
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
              <ScrollArea className="flex-1">
                <div className="p-6 space-y-6">
                  {/* Case Header */}
                  <motion.div key={selected.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                    <Card className="border-l-4 border-l-destructive">
                      <CardContent className="py-4 px-5">
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
                          <Button size="sm" variant="destructive" className="gap-1.5 shrink-0" onClick={handleEscalate}>
                            <ShieldAlert className="h-3.5 w-3.5" />
                            Escalate to NFIU
                            <Badge variant="outline" className="text-[8px] px-1 py-0 ml-1 bg-destructive-foreground/10 text-destructive-foreground border-destructive-foreground/20">⇧E</Badge>
                          </Button>
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
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        <Clock className="h-4 w-4 text-primary" />
                        Transaction Timeline ({selected.transactions.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="relative space-y-0">
                        {selected.transactions.map((tx, i) => (
                          <div key={tx.id} className="flex items-start gap-3 relative">
                            {/* Vertical connector */}
                            {i < selected.transactions.length - 1 && (
                              <div className="absolute left-[15px] top-8 bottom-0 w-px bg-border" />
                            )}
                            {/* Icon */}
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
                            {/* Details */}
                            <div className="flex-1 pb-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm font-medium text-foreground">{tx.counterparty}</p>
                                  <p className="text-[11px] text-muted-foreground">{formatTime(tx.date)}</p>
                                </div>
                                <div className="text-right">
                                  <p className={`text-sm font-semibold ${tx.type === 'Credit' ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive'}`}>
                                    {tx.type === 'Credit' ? '+' : '-'}{formatNGN(tx.amountNGN)}
                                  </p>
                                  <p className="text-[10px] text-muted-foreground">Bal: {formatNGN(tx.balanceAfter)}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

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
                         <div className={`flex-1 flex flex-col rounded-lg border overflow-hidden relative transition-all ${strLoading ? 'border-primary/50 shadow-[0_0_15px_hsl(var(--primary)/0.15)]' : ''}`}>
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
                              {['Make it shorter', 'Add red flags', 'Translate to French'].map((s) => (
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
    </SidebarProvider>
  );
}
