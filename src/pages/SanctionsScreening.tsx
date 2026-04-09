import { useState } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { mockSanctionsMatches, type SanctionsMatch } from '@/data/mockSanctions';
import { motion } from 'framer-motion';
import {
  ShieldAlert, ShieldCheck, ShieldX, User, Globe, Calendar,
  CreditCard, Fingerprint, AlertTriangle, CheckCircle2, XCircle, ArrowRight,
} from 'lucide-react';

function scoreColor(score: number) {
  if (score >= 80) return { ring: 'border-destructive', text: 'text-destructive', bg: 'bg-destructive/10' };
  if (score >= 60) return { ring: 'border-[hsl(var(--risk-medium))]', text: 'text-[hsl(var(--risk-medium))]', bg: 'bg-[hsl(var(--risk-medium))]/10' };
  return { ring: 'border-[hsl(var(--risk-low))]', text: 'text-[hsl(var(--risk-low))]', bg: 'bg-[hsl(var(--risk-low))]/10' };
}

function InfoRow({ icon: Icon, label, value }: { icon: typeof User; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2.5 py-2">
      <Icon className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
      <div className="min-w-0">
        <p className="text-[11px] text-muted-foreground">{label}</p>
        <p className="text-sm font-medium text-foreground">{value}</p>
      </div>
    </div>
  );
}

function MatchCard({ match, isSelected, onClick }: { match: SanctionsMatch; isSelected: boolean; onClick: () => void }) {
  const colors = scoreColor(match.matchScore);
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
        <span className="text-xs font-mono text-muted-foreground">{match.id}</span>
        <div className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${colors.bg} ${colors.text}`}>
          {match.matchScore}%
        </div>
      </div>
      <p className="text-sm font-medium text-foreground truncate">{match.internal.name}</p>
      <p className="text-xs text-muted-foreground truncate mt-0.5">vs {match.sanctions.name}</p>
      <div className="flex items-center gap-1.5 mt-2">
        <Badge variant="outline" className="text-[9px] px-1.5 py-0">{match.sanctions.list}</Badge>
        {match.status === 'Pending' && <Badge variant="outline" className="text-[9px] px-1.5 py-0 bg-[hsl(var(--risk-medium))]/10 text-[hsl(var(--risk-medium))] border-[hsl(var(--risk-medium))]/20">Pending</Badge>}
        {match.status === 'Dismissed' && <Badge variant="outline" className="text-[9px] px-1.5 py-0 bg-[hsl(var(--risk-low))]/10 text-[hsl(var(--risk-low))] border-[hsl(var(--risk-low))]/20">Dismissed</Badge>}
        {match.status === 'Confirmed' && <Badge variant="outline" className="text-[9px] px-1.5 py-0 bg-destructive/10 text-destructive border-destructive/20">Confirmed</Badge>}
      </div>
    </button>
  );
}

export default function SanctionsScreening() {
  const { toast } = useToast();
  const [matches, setMatches] = useState(mockSanctionsMatches);
  const [selectedId, setSelectedId] = useState(mockSanctionsMatches[0].id);
  const [analystNotes, setAnalystNotes] = useState('');

  const selected = matches.find((m) => m.id === selectedId) || matches[0];
  const colors = scoreColor(selected.matchScore);

  const handleDismiss = () => {
    if (!analystNotes.trim()) {
      toast({ title: 'Notes Required', description: 'Please add analyst notes before dismissing.', variant: 'destructive' });
      return;
    }
    setMatches((prev) => prev.map((m) => m.id === selected.id ? { ...m, status: 'Dismissed' as const } : m));
    toast({ title: 'False Positive — Dismissed', description: `${selected.id} has been cleared. Notes recorded.` });
    setAnalystNotes('');
  };

  const handleConfirm = () => {
    if (!analystNotes.trim()) {
      toast({ title: 'Notes Required', description: 'Please add analyst notes before escalating.', variant: 'destructive' });
      return;
    }
    setMatches((prev) => prev.map((m) => m.id === selected.id ? { ...m, status: 'Confirmed' as const } : m));
    toast({ title: 'True Match — Frozen & Escalated', description: `${selected.internal.name}'s account has been frozen and an STR has been queued.` });
    setAnalystNotes('');
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-h-0">
          {/* Top bar */}
          <div className="flex items-center justify-between border-b px-6 py-3 bg-card shrink-0">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-primary" />
              <h1 className="text-lg font-bold text-foreground">Sanctions Screening</h1>
              <Badge variant="outline" className="text-[10px] ml-2">
                {matches.filter((m) => m.status === 'Pending').length} pending review
              </Badge>
            </div>
            <ThemeToggle />
          </div>

          <div className="flex flex-1 min-h-0">
            {/* Left pane — Match list */}
            <div className="w-[260px] border-r flex flex-col bg-muted/20 shrink-0">
              <div className="p-3 border-b bg-card">
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Fuzzy Matches</p>
              </div>
              <ScrollArea className="flex-1">
                <div className="p-2 space-y-1">
                  {matches.map((match) => (
                    <MatchCard
                      key={match.id}
                      match={match}
                      isSelected={match.id === selectedId}
                      onClick={() => { setSelectedId(match.id); setAnalystNotes(''); }}
                    />
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* Right pane — Comparison workspace */}
            <ScrollArea className="flex-1">
              <div className="p-6 space-y-6">
                <motion.div key={selected.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                  {/* Side-by-side comparison */}
                  <div className="grid grid-cols-[1fr_auto_1fr] gap-0 items-stretch">
                    {/* Internal Profile */}
                    <Card className="rounded-r-none border-r-0">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
                            <User className="h-3.5 w-3.5 text-primary" />
                          </div>
                          Internal Customer Profile
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-0.5">
                        <InfoRow icon={User} label="Full Name" value={selected.internal.name} />
                        <InfoRow icon={Calendar} label="Date of Birth" value={selected.internal.dob} />
                        <InfoRow icon={Globe} label="Nationality" value={selected.internal.nationality} />
                        <InfoRow icon={Globe} label="Location" value={selected.internal.location} />
                        <Separator className="my-2" />
                        <InfoRow icon={Fingerprint} label="BVN" value={selected.internal.bvn} />
                        <InfoRow icon={CreditCard} label="Account" value={selected.internal.accountNumber} />
                        <InfoRow icon={ShieldCheck} label="KYC Tier" value={selected.internal.kycTier} />
                      </CardContent>
                    </Card>

                    {/* Center — Match Score */}
                    <div className="flex flex-col items-center justify-center px-5 border-y bg-muted/20 relative">
                      {/* Dashed connector lines */}
                      <div className="absolute left-0 top-1/2 w-5 border-t border-dashed border-border" />
                      <div className="absolute right-0 top-1/2 w-5 border-t border-dashed border-border" />

                      <div className={`flex flex-col items-center justify-center h-24 w-24 rounded-full border-4 ${colors.ring} ${colors.bg} shadow-sm`}>
                        <span className={`text-2xl font-bold tabular-nums ${colors.text}`}>{selected.matchScore}%</span>
                        <span className="text-[9px] font-medium text-muted-foreground uppercase tracking-wider">Match</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-2 text-center max-w-[100px]">Fuzzy Name Confidence</p>

                      {/* Highlighted differences */}
                      <div className="mt-4 space-y-1.5 text-center">
                        {selected.internal.name !== selected.sanctions.name && (
                          <Badge variant="outline" className="text-[9px] bg-destructive/5 text-destructive border-destructive/20">
                            Name Variance
                          </Badge>
                        )}
                        {selected.internal.dob !== selected.sanctions.dob && (
                          <Badge variant="outline" className="text-[9px] bg-[hsl(var(--risk-medium))]/10 text-[hsl(var(--risk-medium))] border-[hsl(var(--risk-medium))]/20 block">
                            DOB Mismatch
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Sanctions Match */}
                    <Card className="rounded-l-none border-l-0 border-destructive/20 bg-destructive/[0.02]">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-destructive/10">
                            <ShieldX className="h-3.5 w-3.5 text-destructive" />
                          </div>
                          Sanctions List Match
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-0.5">
                        <InfoRow icon={User} label="Listed Name" value={selected.sanctions.name} />
                        <InfoRow icon={Calendar} label="Date of Birth" value={selected.sanctions.dob} />
                        <InfoRow icon={Globe} label="Nationality" value={selected.sanctions.nationality} />
                        <Separator className="my-2" />
                        <InfoRow icon={ShieldAlert} label="Sanctions List" value={selected.sanctions.list} />
                        <InfoRow icon={Fingerprint} label="List ID" value={selected.sanctions.listId} />
                        <InfoRow icon={AlertTriangle} label="Reason" value={selected.sanctions.reason} />
                        <InfoRow icon={Calendar} label="Date Added" value={selected.sanctions.dateAdded} />
                        <div className="pt-2">
                          <p className="text-[11px] text-muted-foreground mb-1">Known Aliases</p>
                          <div className="flex flex-wrap gap-1">
                            {selected.sanctions.aliases.map((alias) => (
                              <Badge key={alias} variant="outline" className="text-[10px] font-normal">{alias}</Badge>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </motion.div>

                <Separator />

                {/* Analyst Notes */}
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="space-y-3">
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-semibold text-foreground">Analyst Notes</label>
                    <Badge variant="outline" className="text-[9px] text-destructive border-destructive/20">Mandatory</Badge>
                  </div>
                  <Textarea
                    placeholder="Document your analysis rationale. Include evidence supporting your decision (e.g., DOB mismatch, different nationality, verified identity documents)…"
                    value={analystNotes}
                    onChange={(e) => setAnalystNotes(e.target.value)}
                    className="min-h-[120px] bg-card shadow-sm text-sm"
                  />
                </motion.div>

                {/* Action Buttons */}
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="grid grid-cols-2 gap-4"
                >
                  <Button
                    size="lg"
                    onClick={handleDismiss}
                    disabled={selected.status !== 'Pending'}
                    className="h-16 text-base font-semibold gap-3 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm border-0 rounded-xl"
                  >
                    <CheckCircle2 className="h-6 w-6" />
                    <div className="text-left">
                      <div>False Positive — Dismiss</div>
                      <div className="text-[11px] font-normal opacity-80">Clear match and archive</div>
                    </div>
                  </Button>
                  <Button
                    size="lg"
                    onClick={handleConfirm}
                    disabled={selected.status !== 'Pending'}
                    className="h-16 text-base font-semibold gap-3 bg-red-600 hover:bg-red-700 text-white shadow-sm border-0 rounded-xl"
                  >
                    <XCircle className="h-6 w-6" />
                    <div className="text-left">
                      <div>True Match — Freeze & Escalate</div>
                      <div className="text-[11px] font-normal opacity-80">Block account and file STR</div>
                    </div>
                  </Button>
                </motion.div>

                {selected.status !== 'Pending' && (
                  <div className="rounded-lg border bg-muted/30 p-4 text-center">
                    <p className="text-sm text-muted-foreground">
                      This match has been resolved as <span className="font-semibold text-foreground">{selected.status}</span>.
                    </p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
}
