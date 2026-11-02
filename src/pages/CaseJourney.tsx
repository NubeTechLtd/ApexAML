import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useZoneNavigate } from '@/hooks/useZone';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import { NotificationBell } from '@/components/NotificationBell';
import { AuditBell } from '@/components/AuditBell';
import {
  ArrowLeft,
  AlertTriangle,
  Search,
  FileText,
  CheckCircle2,
  Eye,
  User,
  ShieldAlert,
  Edit3,
  Send,
  Snowflake,
  Bot,
  Lock,
  Download,
  Plus,
  ClipboardList,
  Clock,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import type { Alert } from '@/data/models/alerts';
import { useDemoDataset } from '@/data-layer/demoDataset';
import { useAuditLog, type AuditEntry } from '@/hooks/useAuditLog';
import { SEED_ALERTS } from '@/data-layer/seed/dataset';

const alertCustomerNum = (id: string) => SEED_ALERTS.find((a) => a.id === id)?.customerNum;

type IconType = typeof AlertTriangle;

type CaseEvent = {
  id: string;
  timestamp: string;
  icon: IconType;
  iconColor: string;
  title: string;
  description: string;
  actor: string;
  detail: string;
  attachments?: { name: string; type: string }[];
  data?: Record<string, string>;
  notes?: string;
};

type CaseFile = {
  caseId: string;
  typology: string;
  customerName: string;
  customerId?: string;
  status: 'Open' | 'Under Review' | 'Filed (simulated)' | 'Closed';
  openedAt: string;
  closedAt?: string;
  investigationMinutes: number;
  strFiledAt?: string;
  strDeadlineHours?: number;
  events: CaseEvent[];
};

const fmt = (iso: string) => {
  const d = new Date(iso);
  return `${d.toLocaleDateString('en-GB', { weekday: 'long', day: '2-digit', month: 'short', timeZone: 'Africa/Lagos' })} · ${d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Lagos' })}`;
};

const EVENT_STYLE: Record<string, { icon: IconType; color: string; title: string }> = {
  CASE_UNDER_REVIEW: { icon: Eye, color: 'text-amber-500', title: 'Case taken into review' },
  CASE_INFO_REQUESTED: { icon: Search, color: 'text-amber-500', title: 'Information requested' },
  STR_DRAFT_GENERATED: { icon: FileText, color: 'text-primary', title: 'STR draft created' },
  STR_EDIT: { icon: Edit3, color: 'text-primary', title: 'STR draft edited' },
  STR_FILED: { icon: FileText, color: 'text-primary', title: 'STR prepared' },
  STR_EXPORT: { icon: Send, color: 'text-emerald-500', title: 'STR exported as goAML-style XML (draft)' },
  NFIU_ESCALATION: { icon: ShieldAlert, color: 'text-destructive', title: 'Escalated to MLRO' },
  ACCOUNT_FREEZE: { icon: Snowflake, color: 'text-destructive', title: 'Account frozen' },
  ALERT_DISMISSED: { icon: CheckCircle2, color: 'text-muted-foreground', title: 'Closed as false positive' },
};

/** Builds the case file from the sample alert and every audit entry recorded against it. */
function buildCaseFile(caseId: string, alerts: Alert[], audit: AuditEntry[]): CaseFile | null {
  const alert = alerts.find((a) => a.caseId === caseId || a.id === caseId);
  if (!alert) return null;
  const keys = new Set([alert.caseId, alert.id]);
  const logged = audit.filter((e) => keys.has(e.caseId)).sort((x, y) => x.timestamp.localeCompare(y.timestamp));
  const total = alert.transactions.reduce((sum, t) => sum + t.amountNGN, 0);
  const events: CaseEvent[] = [
    {
      id: 'opened',
      timestamp: fmt(alert.timestamp),
      icon: AlertTriangle,
      iconColor: 'text-destructive',
      title: `${alert.riskLevel} alert fired`,
      description: alert.ruleTriggered,
      actor: 'System',
      detail: alert.description,
      data: {
        'Alert ID': alert.id,
        'Risk Score': `${alert.customerProfile.riskScore}/100`,
        'Transactions': String(alert.transactions.length),
        'Aggregate Value': `₦${total.toLocaleString('en-NG')}`,
      },
    },
    ...logged.map((e, i) => {
      const style = EVENT_STYLE[e.action] ?? { icon: ClipboardList, color: 'text-muted-foreground', title: e.action.toLowerCase().replace(/_/g, ' ') };
      return { id: `ev-${i}`, timestamp: fmt(e.timestamp), icon: style.icon, iconColor: style.color, title: style.title, description: e.justification, actor: e.analyst, detail: e.justification };
    }),
  ];
  const last = logged[logged.length - 1]?.timestamp ?? alert.timestamp;
  const filed = logged.find((e) => e.action === 'STR_EXPORT' || e.action === 'NFIU_ESCALATION');
  const status: CaseFile['status'] = alert.status === 'Escalated' ? 'Filed (simulated)' : alert.status === 'Dismissed' ? 'Closed' : alert.status;
  return {
    caseId: alert.caseId,
    typology: alert.ruleTriggered,
    customerName: alert.customerProfile.fullName,
    customerId: String(alertCustomerNum(alert.id) ?? ''),
    status,
    openedAt: fmt(alert.timestamp),
    closedAt: status === 'Closed' || status === 'Filed (simulated)' ? fmt(last) : undefined,
    investigationMinutes: Math.max(0, Math.round((new Date(last).getTime() - new Date(alert.timestamp).getTime()) / 60_000)),
    strFiledAt: filed ? fmt(filed.timestamp) : undefined,
    strDeadlineHours: 24,
    events,
  };
}

const fallbackCase = (caseId: string): CaseFile => ({
  caseId,
  typology: 'Unknown typology',
  customerName: 'Unknown customer',
  status: 'Open',
  openedAt: '—',
  investigationMinutes: 0,
  events: [
    {
      id: 'g1',
      timestamp: 'Just now',
      icon: AlertTriangle,
      iconColor: 'text-destructive',
      title: 'Case opened',
      description: 'No timeline events have been recorded yet.',
      actor: 'System',
      detail: 'This is a new or unrecognised case file.',
    },
  ],
});

const statusStyles: Record<CaseFile['status'], string> = {
  Open: 'bg-destructive/10 text-destructive border-destructive/20',
  'Under Review': 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  'Filed (simulated)': 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  Closed: 'bg-muted text-muted-foreground border-border',
};

export default function CaseJourney() {
  const { caseId = '' } = useParams<{ caseId: string }>();
  const navigate = useZoneNavigate();

  const { alerts } = useDemoDataset();
  const { entries: auditEntries } = useAuditLog();
  const caseFile = useMemo<CaseFile>(
    () => buildCaseFile(caseId, alerts, auditEntries) ?? fallbackCase(caseId || 'NEW-CASE'),
    [caseId, alerts, auditEntries],
  );

  const [selectedId, setSelectedId] = useState(caseFile.events[0].id);
  const selected = caseFile.events.find((e) => e.id === selectedId) ?? caseFile.events[0];

  const handleExport = () => {
    const lines = [
      `CASE FILE: ${caseFile.caseId}`,
      `Typology: ${caseFile.typology}`,
      `Customer: ${caseFile.customerName}`,
      `Status: ${caseFile.status}`,
      `Opened: ${caseFile.openedAt}`,
      caseFile.closedAt ? `Closed: ${caseFile.closedAt}` : '',
      `Investigation time: ${caseFile.investigationMinutes} minutes`,
      '',
      'TIMELINE:',
      ...caseFile.events.map(
        (e) => `[${e.timestamp}] ${e.title} — ${e.description} (by ${e.actor})`
      ),
    ].filter(Boolean);
    const blob = new Blob([lines.join('\n')], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${caseFile.caseId}_case_file.pdf`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Case file exported', { description: `${caseFile.caseId} ready for CBN examiner review.` });
  };

  const handleNewCase = () => {
    toast.success('New case file created', { description: 'Manual investigation opened for non-alert sources (branch report, customer call, etc.).' });
  };

  const filedWithinDeadline = !!caseFile.strFiledAt;

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <main className="flex-1 overflow-auto">
          {/* Header */}
          <div className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6 py-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate('/workspace')}>
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div className="min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h1 className="text-lg font-bold text-foreground font-mono">{caseFile.caseId}</h1>
                    <Badge variant="outline" className="text-[10px]">{caseFile.typology}</Badge>
                    <span className="text-sm text-muted-foreground">· {caseFile.customerName}</span>
                    <Badge variant="outline" className={`text-[10px] ${statusStyles[caseFile.status]}`}>
                      {caseFile.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Opened {caseFile.openedAt}{caseFile.closedAt ? ` · Closed ${caseFile.closedAt}` : ''}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button variant="outline" size="sm" className="gap-1.5" onClick={handleNewCase}>
                  <Plus className="h-3.5 w-3.5" /> Create new case file
                </Button>
                <Button size="sm" className="gap-1.5" onClick={handleExport}>
                  <Download className="h-3.5 w-3.5" /> Export case file
                </Button>
                <AuditBell />
                <NotificationBell />
                <ThemeToggle />
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="grid grid-cols-1 lg:grid-cols-[2fr_3fr] gap-6 p-6">
            {/* LEFT — Timeline */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <ClipboardList className="h-4 w-4 text-primary" />
                  Case timeline · {caseFile.events.length} events
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <div className="absolute left-[18px] top-2 bottom-2 w-px bg-border" />
                  <div className="space-y-1">
                    {caseFile.events.map((event) => {
                      const Icon = event.icon;
                      const isActive = event.id === selectedId;
                      return (
                        <motion.button
                          key={event.id}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          onClick={() => setSelectedId(event.id)}
                          className={`relative w-full text-left rounded-md pl-12 pr-3 py-2.5 transition-colors ${
                            isActive ? 'bg-accent' : 'hover:bg-muted/50'
                          }`}
                        >
                          <div
                            className={`absolute left-2 top-2.5 h-7 w-7 rounded-full border-2 flex items-center justify-center bg-background ${
                              isActive ? 'border-primary' : 'border-border'
                            }`}
                          >
                            <Icon className={`h-3.5 w-3.5 ${event.iconColor}`} />
                          </div>
                          <div className="space-y-0.5">
                            <p className="text-[10px] font-mono text-muted-foreground">{event.timestamp}</p>
                            <p className="text-xs font-medium text-foreground">{event.title}</p>
                            <p className="text-[11px] text-muted-foreground line-clamp-1">{event.description}</p>
                            <p className="text-[10px] text-muted-foreground/80">{event.actor}</p>
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* RIGHT — Detail */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <selected.icon className={`h-5 w-5 ${selected.iconColor}`} />
                  <CardTitle className="text-base">{selected.title}</CardTitle>
                </div>
                <p className="text-[11px] text-muted-foreground font-mono mt-1">
                  {selected.timestamp} · {selected.actor}
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-foreground leading-relaxed">{selected.detail}</p>

                {selected.data && (
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Data reviewed</p>
                    <div className="rounded-md border border-border divide-y divide-border">
                      {Object.entries(selected.data).map(([k, v]) => (
                        <div key={k} className="flex items-center justify-between px-3 py-2 text-xs">
                          <span className="text-muted-foreground">{k}</span>
                          <span className="font-mono text-foreground">{v}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selected.notes && (
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Analyst notes</p>
                    <div className="rounded-md border-l-2 border-l-amber-500 bg-amber-500/5 px-3 py-2 text-xs text-foreground italic">
                      {selected.notes}
                    </div>
                  </div>
                )}

                {selected.attachments && selected.attachments.length > 0 && (
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Attached documents</p>
                    <div className="space-y-1.5">
                      {selected.attachments.map((att) => (
                        <button
                          key={att.name}
                          onClick={() => toast.success('Document opened', { description: att.name })}
                          className="w-full flex items-center justify-between rounded-md border border-border px-3 py-2 hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <FileText className="h-4 w-4 text-primary shrink-0" />
                            <div className="text-left min-w-0">
                              <p className="text-xs font-medium text-foreground truncate">{att.name}</p>
                              <p className="text-[10px] text-muted-foreground">{att.type}</p>
                            </div>
                          </div>
                          <Download className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Bottom summary bar */}
          <div className="sticky bottom-0 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6 py-3">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Investigation time</p>
                  <p className="font-semibold text-foreground">
                    {Math.floor(caseFile.investigationMinutes / 60)}h {caseFile.investigationMinutes % 60}m
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <ClipboardList className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Actions taken</p>
                  <p className="font-semibold text-foreground">{caseFile.events.length}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-emerald-500" />
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">CBN compliance</p>
                  <p className="font-semibold text-foreground">
                    {filedWithinDeadline ? (
                      <span className="text-emerald-600 dark:text-emerald-400">
                        Exported within 24h ✅
                      </span>
                    ) : (
                      <span className="text-muted-foreground">Not yet exported</span>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">STR XML exported at</p>
                  <p className="font-semibold text-foreground">
                    {caseFile.strFiledAt ?? '—'}
                    {filedWithinDeadline && (
                      <span className="ml-1 text-emerald-600 dark:text-emerald-400 font-normal">
                        (1h 50m within deadline)
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
