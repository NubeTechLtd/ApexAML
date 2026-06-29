import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
  status: 'Open' | 'Under Review' | 'Filed' | 'Closed';
  openedAt: string;
  closedAt?: string;
  investigationMinutes: number;
  strFiledAt?: string;
  strDeadlineHours?: number;
  events: CaseEvent[];
};

const adebayoCase: CaseFile = {
  caseId: 'ALT-2026-0891',
  typology: 'POS Round-Trip Structuring',
  customerName: 'Adebayo Ogunlesi',
  customerId: '1',
  status: 'Filed',
  openedAt: 'Monday 28 Jun · 08:15',
  closedAt: 'Monday 28 Jun · 10:46',
  investigationMinutes: 123,
  strFiledAt: 'Monday 28 Jun · 10:08',
  strDeadlineHours: 24,
  events: [
    {
      id: 'e1',
      timestamp: 'Monday 28 Jun · 08:43',
      icon: AlertTriangle,
      iconColor: 'text-destructive',
      title: 'Critical alert fired',
      description: 'POS Round-Trip rule T-NG-204 triggered on customer activity',
      actor: 'System',
      detail:
        'Rule T-NG-204 detected ₦14.8M withdrawn across 47 POS transactions, each below the ₦500,000 reporting threshold, with mirrored deposits to a connected NUBAN within 6 hours.',
      data: {
        'Rule ID': 'T-NG-204',
        'Risk Score': '92/100',
        'Channel': 'POS Agent Network',
        'Aggregate Value': '₦14,820,500',
        'Transaction Count': '47',
      },
    },
    {
      id: 'e2',
      timestamp: 'Monday 28 Jun · 08:15',
      icon: Eye,
      iconColor: 'text-blue-500',
      title: 'Alert opened for investigation',
      description: 'Chioma Adeyemi (CCO) claimed the alert from the inbox',
      actor: 'Chioma Adeyemi',
      detail: 'Analyst acknowledged the alert and moved it from Open to Under Review.',
    },
    {
      id: 'e3',
      timestamp: 'Monday 28 Jun · 09:02',
      icon: User,
      iconColor: 'text-primary',
      title: 'Customer 360 profile reviewed',
      description: 'Full customer context, KYC, and connected entities inspected',
      actor: 'Chioma Adeyemi',
      detail: 'Reviewed BVN, NIN, KYC tier (Tier 2), 6-axis risk radar, and 4 linked accounts.',
      data: {
        'BVN': '22156****891',
        'KYC Tier': 'Tier 2',
        'Connected Accounts': '4',
        'Avg 30d Volume': '₦18.2M',
      },
    },
    {
      id: 'e4',
      timestamp: 'Monday 28 Jun · 09:18',
      icon: Search,
      iconColor: 'text-blue-500',
      title: 'Sanctions screen run',
      description: 'No OFAC/UN match · NFIU domestic 78% name match found',
      actor: 'System',
      detail:
        'Screened against OFAC SDN, UN consolidated, EU sanctions, and NFIU domestic watchlist. Domestic match at 78% similarity flagged for analyst review.',
      data: {
        'OFAC': 'No match',
        'UN Consolidated': 'No match',
        'EU': 'No match',
        'NFIU Domestic': '78% match (manual review)',
      },
    },
    {
      id: 'e5',
      timestamp: 'Monday 28 Jun · 09:31',
      icon: Edit3,
      iconColor: 'text-amber-500',
      title: 'Case note added',
      description: '"BDC company inactive on CAC since 2022"',
      actor: 'Chioma Adeyemi',
      detail: 'Adverse media confirmed: beneficiary BDC company shows no CAC filings since 2022.',
      notes:
        'Cross-checked beneficiary "GoldStar Exchange Ltd" against CAC public registry. No annual returns since 2022. RC number active but dormant. Flagged for EDD.',
    },
    {
      id: 'e6',
      timestamp: 'Monday 28 Jun · 09:44',
      icon: Bot,
      iconColor: 'text-emerald-500',
      title: 'AI STR Co-Pilot activated',
      description: 'Draft STR generated in 11 minutes',
      actor: 'System',
      detail:
        'ApexAML AI Co-Pilot drafted a full goAML-compliant STR narrative covering subject, transaction pattern, typology, and recommendation.',
      attachments: [{ name: 'STR_DRAFT_ALT2026891.docx', type: 'STR Draft' }],
    },
    {
      id: 'e7',
      timestamp: 'Monday 28 Jun · 09:55',
      icon: Edit3,
      iconColor: 'text-amber-500',
      title: 'STR draft edited',
      description: '1 paragraph updated by analyst',
      actor: 'Chioma Adeyemi',
      detail: 'Analyst refined the "Suspicious Indicators" paragraph to include the CAC dormancy finding.',
      notes:
        'Added: "Beneficiary entity GoldStar Exchange Ltd has filed no annual returns with CAC since 2022, indicating likely shell status."',
    },
    {
      id: 'e8',
      timestamp: 'Monday 28 Jun · 10:02',
      icon: Download,
      iconColor: 'text-blue-500',
      title: 'STR exported in goAML XML',
      description: 'File: STR_ALT2026891_28Jun.xml',
      actor: 'Chioma Adeyemi',
      detail: 'NFIU-schema-validated XML generated with zero errors.',
      attachments: [{ name: 'STR_ALT2026891_28Jun.xml', type: 'goAML XML' }],
    },
    {
      id: 'e9',
      timestamp: 'Monday 28 Jun · 10:08',
      icon: Send,
      iconColor: 'text-emerald-500',
      title: 'NFIU submission confirmed',
      description: 'Reference: STR-2026-0041',
      actor: 'Chioma Adeyemi',
      detail: 'NFIU portal returned a successful submission receipt and immutable audit hash.',
      data: {
        'NFIU Ref': 'STR-2026-0041',
        'Audit Hash': '0x8f3c…a921',
        'Filed Within': '1h 50m of suspicion forming',
      },
    },
    {
      id: 'e10',
      timestamp: 'Monday 28 Jun · 10:45',
      icon: Snowflake,
      iconColor: 'text-blue-500',
      title: 'Account frozen',
      description: 'Case ref FRZ-2026-0089',
      actor: 'Ngozi Okafor (Head of Compliance)',
      detail: 'Account frozen pending NFIU instruction. Customer notification suppressed under tipping-off rules.',
      data: {
        'Freeze Ref': 'FRZ-2026-0089',
        'Approver': 'Ngozi Okafor',
        'Justification': 'Confirmed STR filed; preserve funds pending NFIU direction.',
      },
    },
    {
      id: 'e11',
      timestamp: 'Monday 28 Jun · 10:46',
      icon: Lock,
      iconColor: 'text-muted-foreground',
      title: 'Case closed',
      description: 'Total investigation time: 2h 3m',
      actor: 'Chioma Adeyemi',
      detail: 'Case marked Filed & Closed. All artefacts sealed in immutable audit trail.',
    },
  ],
};

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
  Filed: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  Closed: 'bg-muted text-muted-foreground border-border',
};

export default function CaseJourney() {
  const { caseId = '' } = useParams<{ caseId: string }>();
  const navigate = useNavigate();

  const caseFile = useMemo<CaseFile>(() => {
    if (caseId === 'ALT-2026-0891' || caseId === '1') return adebayoCase;
    return fallbackCase(caseId || 'NEW-CASE');
  }, [caseId]);

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
                        Filed within 24h ✅
                      </span>
                    ) : (
                      <span className="text-muted-foreground">Not yet filed</span>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">STR filed at</p>
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
