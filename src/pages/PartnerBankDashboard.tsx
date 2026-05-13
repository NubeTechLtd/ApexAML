import { useState, useMemo } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { ThemeToggle } from '@/components/ThemeToggle';
import { NotificationBell } from '@/components/NotificationBell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ShieldCheck, Eye, Download, Building2, Banknote, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  mockSettlementAccounts,
  isIMTOSettlement,
  commingleScore,
  approvedVsUnapproved,
  type IMTOSettlementAccount,
} from '@/data/mockSettlementAccounts';
import { CrossBorder24hTicker } from '@/components/imto/CrossBorder24hTicker';
import { InboundSmurfingVisualizer } from '@/components/imto/InboundSmurfingVisualizer';

/* ── Donut chart (no external lib) ────────────────────────────────── */

function Donut({ approved, unapproved, size = 140 }: {
  approved: number; unapproved: number; size?: number;
}) {
  const total = approved + unapproved;
  const radius = size / 2 - 12;
  const circumference = 2 * Math.PI * radius;
  const approvedShare = total === 0 ? 1 : approved / total;
  const approvedLen = approvedShare * circumference;
  const unapprovedLen = circumference - approvedLen;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" strokeWidth="14"
          stroke="hsl(var(--muted))"
        />
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" strokeWidth="14"
          stroke="hsl(173 80% 40%)"
          strokeDasharray={`${approvedLen} ${circumference}`}
        />
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" strokeWidth="14"
          stroke="hsl(var(--destructive))"
          strokeDasharray={`${unapprovedLen} ${circumference}`}
          strokeDashoffset={-approvedLen}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <p className="text-2xl font-bold leading-none">{total}</p>
        <p className="text-[10px] text-muted-foreground mt-0.5">credits / 30d</p>
      </div>
    </div>
  );
}

/* ── Score badge ──────────────────────────────────────────────────── */

function scoreClass(score: number) {
  if (score === 0) return 'text-[hsl(var(--risk-low))] bg-[hsl(var(--risk-low)/0.12)] border-[hsl(var(--risk-low)/0.3)]';
  if (score < 15) return 'text-[hsl(var(--risk-medium))] bg-[hsl(var(--risk-medium)/0.12)] border-[hsl(var(--risk-medium)/0.3)]';
  if (score < 40) return 'text-[hsl(var(--risk-high))] bg-[hsl(var(--risk-high)/0.12)] border-[hsl(var(--risk-high)/0.3)]';
  return 'text-destructive bg-destructive/10 border-destructive/40';
}

function scoreLabel(score: number) {
  if (score === 0) return 'Clean';
  if (score < 15) return 'Watch';
  if (score < 40) return 'Elevated';
  return 'Critical';
}

/* ── Account card ─────────────────────────────────────────────────── */

function AccountCard({ acc, selected, onSelect }: {
  acc: IMTOSettlementAccount;
  selected: boolean;
  onSelect: () => void;
}) {
  const score = commingleScore(acc);
  const stats = approvedVsUnapproved(acc);
  return (
    <Card
      onClick={onSelect}
      className={cn(
        'cursor-pointer transition-all hover:shadow-md',
        selected && 'ring-2 ring-primary',
      )}
    >
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-0.5 min-w-0">
            <div className="flex items-center gap-1.5">
              <Banknote className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
              <p className="text-sm font-semibold truncate">{acc.imtoName}</p>
            </div>
            <p className="text-[11px] font-mono text-muted-foreground">
              {acc.nuban}
            </p>
            <p className="text-[10px] text-muted-foreground">{acc.partnerBank}</p>
          </div>
          <Badge
            variant="outline"
            className={cn('text-[10px] font-bold shrink-0', scoreClass(score))}
          >
            {score} · {scoreLabel(score)}
          </Badge>
        </div>
        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
          <span>
            <span className="text-[hsl(173_80%_40%)]">●</span>{' '}
            {stats.approvedCount} approved
          </span>
          <span>
            <span className="text-destructive">●</span>{' '}
            {stats.unapprovedCount} unapproved
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

/* ── Page ─────────────────────────────────────────────────────────── */

function PartnerBankDashboard() {
  const settlementAccounts = useMemo(
    () => mockSettlementAccounts.filter(isIMTOSettlement),
    [],
  );
  const [selectedId, setSelectedId] = useState(settlementAccounts[0]?.id);
  const selected = settlementAccounts.find(a => a.id === selectedId)!;
  const stats = approvedVsUnapproved(selected);
  const score = commingleScore(selected);

  const totalAccounts = settlementAccounts.length;
  const flaggedCount = settlementAccounts.filter(a => commingleScore(a) > 0).length;

  const handleDownload = () => {
    toast.success('IMTO Settlement Audit Report queued', {
      description:
        'PDF for the selected account will be generated and downloaded — designed for CBN examiner review.',
    });
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-14 flex items-center justify-between border-b px-4 bg-card">
            <div className="flex items-center gap-2">
              <SidebarTrigger />
              <h1 className="text-sm font-semibold text-foreground">
                Partner Bank Dashboard
              </h1>
              <Badge
                variant="outline"
                className="text-[10px] gap-1 bg-muted text-muted-foreground"
              >
                <Eye className="h-3 w-3" /> Read-only · Partner Bank Officer
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <NotificationBell />
            </div>
          </header>

          <main className="flex-1 overflow-y-auto p-6 bg-background space-y-6">
            {/* Top KPIs */}
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">
                      IMTO settlement accounts held
                    </p>
                    <p className="text-xl font-semibold">{totalAccounts}</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                    <AlertCircle className="h-5 w-5 text-destructive" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Accounts with commingling activity
                    </p>
                    <p className={cn(
                      'text-xl font-semibold',
                      flaggedCount > 0 ? 'text-destructive' : 'text-[hsl(var(--risk-low))]',
                    )}>
                      {flaggedCount} / {totalAccounts}
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                    <ShieldCheck className="h-5 w-5 text-[hsl(var(--risk-low))]" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">
                      May 2026 CBN Circular compliance
                    </p>
                    <p className="text-sm font-semibold">
                      Daily score refresh · 06:00 WAT
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-12 gap-4">
              {/* Account list */}
              <div className="col-span-4 space-y-3">
                <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                  Accounts under your custody
                </p>
                {settlementAccounts.map(acc => (
                  <AccountCard
                    key={acc.id}
                    acc={acc}
                    selected={acc.id === selectedId}
                    onSelect={() => setSelectedId(acc.id)}
                  />
                ))}
              </div>

              {/* Detail */}
              <div className="col-span-8 space-y-4">
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <CardTitle className="text-base flex items-center gap-2">
                          <Banknote className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                          {selected.imtoName} · {selected.partnerBank}
                        </CardTitle>
                        <p className="text-xs text-muted-foreground mt-1 font-mono">
                          NUBAN {selected.nuban} · {selected.cbnLicenceNumber}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className={cn('text-xs font-bold', scoreClass(score))}
                      >
                        Commingling Score: {score} / 100
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div className="grid grid-cols-2 gap-6 items-center">
                      <div className="flex justify-center">
                        <Donut
                          approved={stats.approvedCount}
                          unapproved={stats.unapprovedCount}
                        />
                      </div>
                      <div className="space-y-3">
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Last 30 days · credit source breakdown
                        </p>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between rounded-md border p-2.5">
                            <div className="flex items-center gap-2">
                              <span className="h-2.5 w-2.5 rounded-sm bg-[hsl(173_80%_40%)]" />
                              <span className="text-xs font-medium">
                                Approved correspondents
                              </span>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-semibold">
                                {stats.approvedCount}
                              </p>
                              <p className="text-[10px] text-muted-foreground">
                                ₦{stats.approvedValue.toLocaleString('en-NG')}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center justify-between rounded-md border border-destructive/30 bg-destructive/5 p-2.5">
                            <div className="flex items-center gap-2">
                              <span className="h-2.5 w-2.5 rounded-sm bg-destructive" />
                              <span className="text-xs font-medium">
                                Unapproved sources
                              </span>
                            </div>
                            <div className="text-right">
                              <p className={cn(
                                'text-sm font-semibold',
                                stats.unapprovedCount > 0 && 'text-destructive',
                              )}>
                                {stats.unapprovedCount}
                              </p>
                              <p className="text-[10px] text-muted-foreground">
                                ₦{stats.unapprovedValue.toLocaleString('en-NG')}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Approved correspondents list */}
                    <div className="space-y-2">
                      <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                        Approved correspondent banks
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {selected.approvedCorrespondents.map(c => (
                          <Badge
                            key={c}
                            variant="outline"
                            className="text-[10px] font-normal"
                          >
                            {c}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Recent unapproved credits */}
                    {stats.unapprovedCount > 0 && (
                      <div className="space-y-2">
                        <p className="text-[11px] uppercase tracking-wider text-destructive font-semibold">
                          Unapproved credits requiring CBN explanation
                        </p>
                        <div className="rounded-md border border-destructive/30 divide-y">
                          {selected.recentCredits
                            .filter(c => !c.approved)
                            .slice(0, 5)
                            .map(c => (
                              <div
                                key={c.id}
                                className="flex items-center justify-between p-2.5 text-xs"
                              >
                                <div>
                                  <p className="font-medium">{c.sourceEntity}</p>
                                  <p className="text-[10px] text-muted-foreground">
                                    {new Date(c.date).toLocaleString('en-NG', {
                                      day: '2-digit', month: 'short',
                                      hour: '2-digit', minute: '2-digit',
                                    })}
                                  </p>
                                </div>
                                <p className="font-semibold text-destructive">
                                  ₦{c.amountNGN.toLocaleString('en-NG')}
                                </p>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}

                    <Button onClick={handleDownload} className="w-full gap-2">
                      <Download className="h-4 w-4" />
                      Download IMTO Settlement Audit Report (PDF)
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

export default PartnerBankDashboard;
