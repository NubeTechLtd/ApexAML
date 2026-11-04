import { extractNarrative, replaceNarrative } from '@/lib/strDraftNarrative';
import { useState, useEffect, useRef } from 'react';
import { Bot, Send, FileDown, Loader2, Sparkles, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/sheet';
import { useToast } from '@/hooks/use-toast';
import { useDataProvider } from '@/data-layer/hooks';
import { useAuditLog } from '@/hooks/useAuditLog';
import type { AlertData } from '@/data/models/legacyAlerts';
import { generateGoAMLXmlFromLegacy, downloadXmlFile } from '@/lib/generateGoAMLXml';
import { resolveExportEntity } from '@/data-layer/exportEntity';
import { MissingProfileFields } from '@/components/MissingProfileFields';
import { motion, AnimatePresence } from 'framer-motion';
import { useZone } from '@/hooks/useZone';
import { DemoSampleLabel, DEMO_SAMPLE_LABEL, DEMO_LIVE_AI_LABEL, DEMO_LIVE_AI_NOTICE, DEMO_FALLBACK_LABEL, demoAiLimitMessage, demoStrAuditJustification } from '@/components/DemoSampleLabel';
import { BookDemoSheet } from '@/components/landing/BookDemoSheet';

interface ChatMessage {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  source?: 'live_ai' | 'fallback';
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(amount);
}

function generateDraft(alert: AlertData, isDemo = false, opts: { narrative?: string; footer?: string } = {}): string {
  const { narrative, footer } = opts;
  const events = alert.transactionTimeline
    .map(
      (e, i) =>
        `   ${i + 1}. ${new Date(e.date).toLocaleDateString('en-GB')} — ${e.type} of ${formatCurrency(e.amount)} via ${e.channel} to/from "${e.counterparty}"${e.flagReason ? ` [Flag: ${e.flagReason}]` : ''}`,
    )
    .join('\n');
  const summary = narrative ? narrative.trim().split('\n').join('\n   ') : alert.summary;

  return `SUSPICIOUS TRANSACTION REPORT (STR)
goAML-style XML (draft)

═══════════════════════════════════════════

1. CUSTOMER PROFILE
━━━━━━━━━━━━━━━━━━
   Full Name:        ${alert.customerName}
   Customer ID:      ${alert.customerId}
   BVN:              ${alert.bvn}
   Account Number:   ${alert.accountNumber}
   KYC Status:       ${alert.kycTier} — Verified
   Risk Rating:      ${alert.riskLevel} (Score: ${alert.riskScore}/100)

2. SUSPICIOUS ACTIVITY DESCRIPTION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Alert Reference:  ${alert.id}
   Alert Type:       ${alert.alertType}
   Total Flagged:    ${formatCurrency(alert.totalFlagged)}
   
   ${narrative ? 'Narrative' : 'Summary'}:
   ${summary}

   The above activity deviates from the customer's established transaction
   profile and raises concerns under the Money Laundering (Prohibition)
   Act 2011 (as amended) and CBN AML/CFT Regulations 2023.

3. TRIGGERING EVENTS
━━━━━━━━━━━━━━━━━━━
   ${alert.transactionTimeline.length} transaction(s) flagged:

${events}

4. NFIU FORMATTING & COMPLIANCE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Reporting Entity:       ApexAML Compliance Suite
   Report Category:        Suspicious Transaction Report
   Filing Deadline:        Within 24 hours of determination
   Regulatory Reference:   CBN AML/CFT Regulations 2023, Section 11
   goAML Report Type:      STR
   Priority:               ${alert.riskLevel === 'Critical' ? 'URGENT' : alert.riskLevel === 'High' ? 'HIGH' : 'STANDARD'}

   This report is being filed pursuant to Section 6(1)(b) of the
   Money Laundering (Prohibition) Act 2011 and NFIU Act 2018.

═══════════════════════════════════════════
   ${footer ?? (isDemo ? DEMO_SAMPLE_LABEL : 'Drafted by STR Co-Pilot')} • ${new Date().toISOString().split('T')[0]}
   Status: DRAFT — Pending analyst review`;
}

const MIN_LOADING_MS = 1500;
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

interface STRCoPilotDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  alert: AlertData;
}

export function STRCoPilotDrawer({ open, onOpenChange, alert }: STRCoPilotDrawerProps) {
  const { toast } = useToast();
  const provider = useDataProvider();
  const { append } = useAuditLog();
  // Ref so a new audit callback never re-runs the draft effect (each run uses a demo AI call).
  const appendRef = useRef(append);
  appendRef.current = append;
  const isDemo = useZone() === 'demo';
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState('');
  const [draftSource, setDraftSource] = useState<'live_ai' | 'fallback'>('fallback');
  const [limitMessage, setLimitMessage] = useState<string | null>(null);
  const [bookOpen, setBookOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [editVersion, setEditVersion] = useState(0);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    setDraft('');
    setChatMessages([]);
    setEditVersion(0);
    setLimitMessage(null);
    const intro = (source?: 'live_ai' | 'fallback') => [{
      id: 1,
      role: 'assistant' as const,
      content: `I've drafted an STR for **${alert.customerName}** based on the ${alert.alertType} alert. The report is prepared as goAML-style XML (draft). You can edit the draft directly or ask me to make changes.`,
      timestamp: new Date(),
      source,
    }];

    if (!isDemo) {
      const timer = setTimeout(() => {
        setDraft(generateDraft(alert, false));
        setLoading(false);
        setChatMessages(intro());
      }, 2500);
      return () => clearTimeout(timer);
    }

    // Demo: first draft comes from the demo-str-narrative function (same caps as
    // the workspace); the pre-written sample is used only if it fails, times out or is capped.
    void (async () => {
      let narrative: string | null = null;
      let capped: string | null = null;
      try {
        const [result] = await Promise.all([provider.str.generate(alert.id), wait(MIN_LOADING_MS)]);
        if (result.source === 'live_ai') narrative = result.narrative;
        capped = demoAiLimitMessage(result.limitReached);
      } catch {
        // Fall through to the labelled sample.
      }
      if (cancelled) return;
      const source = narrative ? 'live_ai' : 'fallback';
      setDraftSource(source);
      setLimitMessage(capped);
      setDraft(narrative
        ? generateDraft(alert, true, { narrative, footer: `${DEMO_LIVE_AI_LABEL}. ${DEMO_LIVE_AI_NOTICE}` })
        : generateDraft(alert, true, { footer: DEMO_FALLBACK_LABEL }));
      setChatMessages([
        ...intro(source),
        ...(capped ? [{ id: 2, role: 'assistant' as const, content: capped, timestamp: new Date() }] : []),
      ]);
      setLoading(false);
      void appendRef.current({ action: 'STR_DRAFT_GENERATED', analyst: '', caseId: alert.id, justification: demoStrAuditJustification(source) }).catch(() => undefined);
    })();
    return () => { cancelled = true; };
  }, [open, alert, isDemo, provider]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleSendChat = () => {
    if (!chatInput.trim()) return;
    const userMsg: ChatMessage = {
      id: Date.now(),
      role: 'user',
      content: chatInput,
      timestamp: new Date(),
    };
    setChatMessages((prev) => [...prev, userMsg]);
    const input = chatInput;
    setChatInput('');
    setIsTyping(true);

    const before = draft;
    // Demo AI edits only the narrative, so send that section and splice the result back in.
    const narrativeOnly = isDemo ? extractNarrative(before) : null;
    provider.str.refine(alert.id, narrativeOnly ?? before, input)
      .then((result) => {
        const next = narrativeOnly !== null ? (replaceNarrative(before, result.narrative) ?? before) : result.narrative;
        const changed = next !== before;
        setDraft(next);
        const capped = isDemo ? demoAiLimitMessage(result.limitReached) : null;
        if (capped) setLimitMessage(capped);
        setChatMessages((prev) => [
          ...prev,
          { id: Date.now(), role: 'assistant', content: result.confirmation, timestamp: new Date(), source: result.source === 'live_ai' ? 'live_ai' : 'fallback' },
          ...(capped ? [{ id: Date.now() + 1, role: 'assistant' as const, content: capped, timestamp: new Date() }] : []),
        ]);
        if (changed) {
          setEditVersion((v) => v + 1);
          void append({ action: 'STR_EDIT', analyst: '', caseId: alert.id, justification: isDemo ? demoStrAuditJustification(result.source === 'live_ai' ? 'live_ai' : 'sample', input) : `STR draft edited by co-pilot: "${input.slice(0, 120)}"` });
        }
      })
      .catch(() => {
        setChatMessages((prev) => [...prev, { id: Date.now(), role: 'assistant', content: '⚠️ I could not apply that change. The draft is unchanged; please try again.', timestamp: new Date() }]);
      })
      .finally(() => setIsTyping(false));
  };

  const handleExport = async () => {
    const today = new Date().toISOString().split('T')[0];
    const filename = `STR_${alert.id}_${today}.xml`;
    let resolved;
    try {
      resolved = await resolveExportEntity(provider);
    } catch {
      toast({ title: 'Export blocked', description: 'Could not load the institution profile. Try again.', variant: 'destructive' });
      return;
    }
    if (!resolved.ok) {
      toast({ title: 'Export blocked', description: <MissingProfileFields missing={resolved.missing} />, variant: 'destructive' });
      return;
    }
    const profileVersion = resolved.entity.version;
    const xml = generateGoAMLXmlFromLegacy(alert, draft, resolved.entity, resolved.label);
    const isLive = provider.kind !== 'demo';
    const record = async () => {
      let draftId: string | null = null;
      try {
        draftId = await provider.str.saveDraft(alert.id, draft);
        if (draftId) await provider.str.recordExport({ alertId: alert.id, draftId, filename, xml });
        await provider.alerts.setStatus(alert.id, 'Escalated');
      } catch {
        // Draft/export records are best effort; the audit entry below is the authority.
      }
      await append({
        action: 'STR_EXPORT', analyst: '', caseId: alert.id,
        justification: `STR exported as goAML-style XML (draft): ${filename}.${profileVersion != null ? ` Institution profile v${profileVersion}.` : ''}`,
        metadata: { filename, profile_version: profileVersion, export_type: 'STR', draft_id: draftId ?? null },
      });
    };
    if (isLive) {
      // Live: no file leaves the platform without its audit entry.
      try {
        await record();
      } catch {
        toast({ title: 'Export not completed', description: 'The export could not be recorded in the audit log, so the file was not downloaded. Try again.', variant: 'destructive' });
        return;
      }
    } else {
      void record().catch(() => undefined);
    }
    downloadXmlFile(xml, filename);
    toast({
      title: 'STR exported',
      description: `${filename}: ${resolved.label}.`,
    });
  };

  return (
    <>
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-4xl p-0 flex flex-col">
        <SheetHeader className="px-6 py-4 border-b bg-card shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                <Sparkles className="h-4.5 w-4.5 text-primary" />
              </div>
              <div>
                <SheetTitle className="text-base">{isDemo ? 'STR Co-Pilot' : 'AI STR Co-Pilot'}</SheetTitle>
                <SheetDescription className="text-xs">
                  {alert.id} • {alert.customerName}
                </SheetDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {!loading && isDemo && <DemoSampleLabel source={draftSource} />}
              {!loading && (
                <Badge variant="outline" className="text-[10px] gap-1">
                  <CheckCircle2 className="h-3 w-3 text-[hsl(var(--risk-low))]" />
                  Draft v{editVersion + 1}
                </Badge>
              )}
              <Button size="sm" className="gap-1.5" onClick={handleExport} disabled={loading}>
                <FileDown className="h-3.5 w-3.5" />
                Export to goAML-style XML (draft)
              </Button>
            </div>
          </div>
        </SheetHeader>

        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            >
              <Loader2 className="h-8 w-8 text-primary" />
            </motion.div>
            <div className="text-center space-y-1.5">
              <p className="text-sm font-medium text-foreground">Analyzing transaction network…</p>
              <p className="text-xs text-muted-foreground">
                Correlating {alert.transactionTimeline.length} events across compliance databases
              </p>
            </div>
            <div className="flex gap-2 mt-2">
              {['KYC Verification', 'PEP Screening', 'Pattern Analysis', 'Draft Generation'].map(
                (step, i) => (
                  <motion.div
                    key={step}
                    initial={{ opacity: 0.3 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.6, duration: 0.4 }}
                  >
                    <Badge variant="outline" className="text-[10px]">{step}</Badge>
                  </motion.div>
                ),
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex min-h-0">
            {/* Editor Pane */}
            <div className="flex-1 flex flex-col border-r min-w-0">
              <div className="px-4 py-2.5 border-b bg-muted/30 flex items-center justify-between shrink-0">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  STR Draft Editor
                </span>
                <Badge variant="outline" className="text-[9px]">Editable</Badge>
              </div>
              {isDemo && limitMessage && (
                <div role="status" className="px-4 py-2 border-b bg-muted/50 flex items-center justify-between gap-3 shrink-0">
                  <span className="text-xs text-foreground">{limitMessage}</span>
                  <Button size="sm" variant="outline" className="h-7 text-xs shrink-0" onClick={() => setBookOpen(true)}>
                    Book a walkthrough
                  </Button>
                </div>
              )}
              <div className="flex-1 min-h-0">
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  className="w-full h-full resize-none bg-background p-4 text-xs font-mono leading-relaxed text-foreground focus:outline-none scrollbar-thin"
                  spellCheck={false}
                />
              </div>
            </div>

            {/* Chat Pane */}
            <div className="w-80 flex flex-col shrink-0">
              <div className="px-4 py-2.5 border-b bg-muted/30 flex items-center gap-2 shrink-0">
                <Bot className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {isDemo ? 'STR drafting assistant' : 'AI Assistant'}
                </span>
              </div>

              <ScrollArea className="flex-1 p-3">
                <div className="space-y-3">
                  <AnimatePresence>
                    {chatMessages.map((msg) => (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[90%] rounded-lg px-3 py-2 text-xs leading-relaxed ${
                            msg.role === 'user'
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted text-foreground'
                          }`}
                        >
                          {msg.content}
                          {isDemo && msg.role === 'assistant' && msg.source && (
                            <div className="mt-1.5"><DemoSampleLabel source={msg.source} /></div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {isTyping && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex justify-start"
                    >
                      <div className="bg-muted rounded-lg px-3 py-2 text-xs text-muted-foreground flex items-center gap-1.5">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Updating draft…
                      </div>
                    </motion.div>
                  )}
                  <div ref={chatEndRef} />
                </div>
              </ScrollArea>

              <Separator />

              <div className="p-3 shrink-0">
                <div className="flex gap-2">
                  <Input
                    placeholder="e.g. Make the summary shorter…"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
                    className="h-8 text-xs bg-background"
                  />
                  <Button
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    onClick={handleSendChat}
                    disabled={!chatInput.trim()}
                  >
                    <Send className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {['Make it shorter', 'Add BVN history', 'Add FATF typology reference', 'Cite CBN circular BSD/DIR/PUB/LAB/019/002', 'Translate narrative to Hausa (for internal memo)', 'Formal NFIU language'].map((s) => (
                    <button
                      key={s}
                      onClick={() => {
                        setChatInput(s);
                      }}
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
      </SheetContent>
    </Sheet>
    {isDemo && <BookDemoSheet open={bookOpen} onOpenChange={setBookOpen} />}
    </>
  );
}
