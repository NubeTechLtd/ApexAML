import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { useAuth } from '@/hooks/useAuth';
import { ThemeToggle } from '@/components/ThemeToggle';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { toast } from 'sonner';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Skeleton } from '@/components/ui/skeleton';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  ReferenceLine,
  Cell,
} from 'recharts';
import { useChartTheme } from '@/hooks/useChartTheme';
import {
  Activity,
  CalendarDays,
  Download,
  FileText,
  Loader2,
  LogOut,
  Mail,
  Search,
  ShieldCheck,
  TrendingUp,
  UserPlus,
  Users,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CBN_DEADLINE = new Date('2026-06-10T00:00:00Z');

type RoadmapLead = {
  id: string;
  created_at: string;
  institution_name: string;
  institution_type: string;
  contact_name: string;
  email: string;
  phone: string | null;
  aml_setup: string;
};

type EmailSequence = {
  email: string;
  email_1_sent_at: string | null;
  email_2_sent_at: string | null;
  email_3_sent_at: string | null;
  email_4_sent_at: string | null;
  email_5_sent_at: string | null;
  demo_booked: boolean;
};

type DemoRequest = {
  email: string | null;
  source: string;
  created_at: string;
};

type EmailEvent = { event_type: string; email: string | null; created_at: string };
type PageEvent = { event_name: string; created_at: string };

const TYPE_SHORT: Record<string, string> = {
  'Deposit Money Bank (DMB)': 'DMB',
  Fintech: 'Fintech',
  Neobank: 'Neobank',
  'Payment Service Provider (PSP)': 'PSP',
  'Mobile Money Operator (MMO)': 'MMO',
  'Microfinance Bank (MFB)': 'MFB',
  'International Money Transfer Operator (IMTO)': 'IMTO',
  'Bureau de Change (BDC)': 'BDC',
  'Non-Bank Financial Institution (NBFI)': 'NBFI',
};

const TYPE_COLORS: Record<string, string> = {
  DMB: 'hsl(217, 91%, 60%)',
  Fintech: 'hsl(265, 84%, 65%)',
  Neobank: 'hsl(189, 85%, 55%)',
  PSP: 'hsl(142, 71%, 45%)',
  MMO: 'hsl(38, 92%, 55%)',
  MFB: 'hsl(330, 81%, 60%)',
  IMTO: 'hsl(173, 80%, 40%)',
  BDC: 'hsl(20, 90%, 60%)',
  NBFI: 'hsl(280, 65%, 60%)',
};

const PAGE_SIZE = 15;

function shortType(t: string) {
  return TYPE_SHORT[t] ?? t;
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function csvEscape(v: unknown) {
  const s = v === null || v === undefined ? '' : String(v);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export default function AdminRoadmaps() {
  const { state, email: adminEmail } = useAdminAuth();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const chart = useChartTheme();

  const [leads, setLeads] = useState<RoadmapLead[] | null>(null);
  const [sequences, setSequences] = useState<EmailSequence[]>([]);
  const [demoRequests, setDemoRequests] = useState<DemoRequest[]>([]);
  const [emailEvents, setEmailEvents] = useState<EmailEvent[]>([]);
  const [pageEvents, setPageEvents] = useState<PageEvent[]>([]);

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [demoFilter, setDemoFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [adminSheetOpen, setAdminSheetOpen] = useState(false);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [grantingAdmin, setGrantingAdmin] = useState(false);

  const loadAll = async () => {
    const [l, s, d, ev, pe] = await Promise.all([
      supabase.from('roadmap_leads').select('*').order('created_at', { ascending: false }),
      supabase.from('email_sequences').select('email,email_1_sent_at,email_2_sent_at,email_3_sent_at,email_4_sent_at,email_5_sent_at,demo_booked'),
      supabase.from('demo_requests').select('email,source,created_at').eq('source', 'post_roadmap'),
      supabase.from('email_events').select('event_type,email,created_at'),
      supabase.from('page_events').select('event_name,created_at'),
    ]);
    if (l.data) setLeads(l.data as RoadmapLead[]);
    if (s.data) setSequences(s.data as EmailSequence[]);
    if (d.data) setDemoRequests(d.data as DemoRequest[]);
    if (ev.data) setEmailEvents(ev.data as EmailEvent[]);
    if (pe.data) setPageEvents(pe.data as PageEvent[]);
  };

  useEffect(() => {
    if (state !== 'admin') return;
    loadAll();
    const ch = supabase
      .channel('admin-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'roadmap_leads' }, () => loadAll())
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'demo_requests' }, () => loadAll())
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'email_events' }, () => loadAll())
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [state]);

  const sequencesByEmail = useMemo(() => {
    const m = new Map<string, EmailSequence>();
    sequences.forEach((s) => m.set(s.email.toLowerCase(), s));
    return m;
  }, [sequences]);

  const demoByEmail = useMemo(() => {
    const set = new Set<string>();
    demoRequests.forEach((d) => d.email && set.add(d.email.toLowerCase()));
    sequences.filter((s) => s.demo_booked).forEach((s) => set.add(s.email.toLowerCase()));
    return set;
  }, [demoRequests, sequences]);

  // KPIs
  const totalRoadmaps = leads?.length ?? 0;
  const startOfWeek = useMemo(() => {
    const d = new Date();
    const day = d.getDay();
    const diff = (day + 6) % 7; // Monday-start
    d.setDate(d.getDate() - diff);
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);
  const roadmapsThisWeek = leads?.filter((l) => new Date(l.created_at) >= startOfWeek).length ?? 0;
  const demoCount = demoRequests.length;
  const conversion = totalRoadmaps > 0 ? (demoCount / totalRoadmaps) * 100 : 0;

  // Type breakdown
  const typeData = useMemo(() => {
    const map = new Map<string, number>();
    Object.values(TYPE_SHORT).forEach((t) => map.set(t, 0));
    leads?.forEach((l) => {
      const k = shortType(l.institution_type);
      map.set(k, (map.get(k) ?? 0) + 1);
    });
    return Array.from(map.entries())
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count);
  }, [leads]);

  // Funnel
  const hookViews = pageEvents.filter((e) => e.event_name === 'hook_view').length;
  const formStarted = pageEvents.filter((e) => e.event_name === 'form_started').length;
  const formCompleted = pageEvents.filter((e) => e.event_name === 'form_completed').length;
  const generated = totalRoadmaps;
  const opened = new Set(emailEvents.filter((e) => e.event_type === 'open').map((e) => e.email)).size;
  const booked = demoCount;

  const funnel = [
    { label: 'Hook page views', value: hookViews, tracked: hookViews > 0 },
    { label: 'Form started', value: formStarted, tracked: formStarted > 0 },
    { label: 'Form completed', value: formCompleted, tracked: formCompleted > 0 },
    { label: 'Roadmap generated', value: generated, tracked: true },
    { label: 'Email opened', value: opened, tracked: true },
    { label: 'Demo booked', value: booked, tracked: true },
  ];
  const funnelMax = Math.max(...funnel.map((f) => f.value), 1);

  // Daily trend (30 days)
  const dailyData = useMemo(() => {
    const days: { date: string; label: string; count: number; ts: number }[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      days.push({
        date: d.toISOString().slice(0, 10),
        label: d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
        count: 0,
        ts: d.getTime(),
      });
    }
    leads?.forEach((l) => {
      const key = new Date(l.created_at).toISOString().slice(0, 10);
      const day = days.find((d) => d.date === key);
      if (day) day.count += 1;
    });
    return days;
  }, [leads]);

  const deadlineInRange = dailyData.some((d) => Math.abs(d.ts - CBN_DEADLINE.getTime()) < 24 * 3600 * 1000);

  // Filtered leads
  const filtered = useMemo(() => {
    if (!leads) return [];
    return leads.filter((l) => {
      if (search && !l.institution_name.toLowerCase().includes(search.toLowerCase())) return false;
      if (typeFilter !== 'all' && shortType(l.institution_type) !== typeFilter) return false;
      const isBooked = demoByEmail.has(l.email.toLowerCase());
      if (demoFilter === 'booked' && !isBooked) return false;
      if (demoFilter === 'pending' && isBooked) return false;
      return true;
    });
  }, [leads, search, typeFilter, demoFilter, demoByEmail]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  useEffect(() => setPage(1), [search, typeFilter, demoFilter]);

  const exportCSV = () => {
    const rows = [
      ['Date', 'Institution', 'Type', 'Contact', 'Email', 'Phone', 'AML Setup', 'Demo Booked', 'Email Step'],
      ...filtered.map((l) => {
        const seq = sequencesByEmail.get(l.email.toLowerCase());
        const step = seq
          ? [seq.email_1_sent_at, seq.email_2_sent_at, seq.email_3_sent_at, seq.email_4_sent_at, seq.email_5_sent_at]
              .filter(Boolean).length
          : 0;
        return [
          fmtDate(l.created_at),
          l.institution_name,
          shortType(l.institution_type),
          l.contact_name,
          l.email,
          l.phone ?? '',
          l.aml_setup,
          demoByEmail.has(l.email.toLowerCase()) ? 'Yes' : 'No',
          `${step}/5`,
        ];
      }),
    ];
    const csv = rows.map((r) => r.map(csvEscape).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `zuia_leads_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportFilename = `zuia_leads_${new Date().toISOString().slice(0, 10)}.csv`;

  const handleGrantAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = newAdminEmail.trim().toLowerCase();
    if (!email) return;
    setGrantingAdmin(true);
    const { data, error } = await supabase.functions.invoke('grant-admin-role', {
      body: { email },
    });
    setGrantingAdmin(false);
    if (error || (data && (data as { error?: string }).error)) {
      const msg = (data as { error?: string } | null)?.error ?? error?.message ?? 'Failed to grant admin access.';
      toast.error(msg);
      return;
    }
    toast.success(`${email} now has admin access.`);
    setNewAdminEmail('');
    setAdminSheetOpen(false);
  };

  const handleSignOut = async () => {
    await signOut();
  };

  if (state === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (state === 'forbidden') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="p-8 max-w-md text-center">
          <ShieldCheck className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
          <h1 className="text-lg font-semibold mb-2">Access denied</h1>
          <p className="text-sm text-muted-foreground mb-4">
            Your account ({adminEmail}) doesn't have admin access.
          </p>
          <Button variant="outline" onClick={handleSignOut}>Sign out</Button>
        </Card>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="border-b bg-card/40 backdrop-blur sticky top-0 z-10">
            <div className="px-6 py-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <SidebarTrigger />
                <div className="min-w-0">
                  <h1 className="text-lg font-semibold flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-primary" />
                    Roadmap Analytics
                  </h1>
                  <p className="text-xs text-muted-foreground truncate">
                    CBN AML roadmap lead intelligence — Zuia admin
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[12px] text-muted-foreground hidden sm:inline">
                  {adminEmail}
                </span>
                <Sheet open={adminSheetOpen} onOpenChange={setAdminSheetOpen}>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="sm">
                      <UserPlus className="h-4 w-4 mr-2" />
                      Add admin user
                    </Button>
                  </SheetTrigger>
                  <SheetContent>
                    <SheetHeader>
                      <SheetTitle>Grant admin access</SheetTitle>
                      <SheetDescription>
                        The user must already have a Zuia account. Their email will be promoted to the admin role.
                      </SheetDescription>
                    </SheetHeader>
                    <form onSubmit={handleGrantAdmin} className="space-y-4 py-6">
                      <div className="space-y-1.5">
                        <Label htmlFor="new-admin-email">Email</Label>
                        <Input
                          id="new-admin-email"
                          type="email"
                          required
                          placeholder="teammate@zuia.io"
                          value={newAdminEmail}
                          onChange={(e) => setNewAdminEmail(e.target.value)}
                        />
                      </div>
                      <SheetFooter>
                        <Button type="submit" disabled={grantingAdmin} className="w-full">
                          {grantingAdmin ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Grant admin access'}
                        </Button>
                      </SheetFooter>
                    </form>
                  </SheetContent>
                </Sheet>
                <ThemeToggle />
                <Button variant="ghost" size="sm" onClick={handleSignOut}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign out
                </Button>
              </div>
            </div>
          </header>

          <main className="flex-1 px-6 py-8 space-y-8">
            {/* KPI cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPI icon={<FileText className="h-4 w-4" />} label="Total Roadmaps" value={totalRoadmaps} loading={leads === null} />
          <KPI icon={<CalendarDays className="h-4 w-4" />} label="This Week" value={roadmapsThisWeek} loading={leads === null} />
          <KPI icon={<Users className="h-4 w-4" />} label="Demo Requests" value={demoCount} loading={leads === null} />
          <KPI
            icon={<TrendingUp className="h-4 w-4" />}
            label="Email → Demo"
            value={`${conversion.toFixed(1)}%`}
            loading={leads === null}
          />
        </div>

        {/* Type breakdown + Funnel */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="p-5 lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">Roadmaps by Institution Type</h2>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={typeData} layout="vertical" margin={{ left: 10 }}>
                  <CartesianGrid stroke={chart.gridColor} horizontal={false} />
                  <XAxis type="number" stroke={chart.tickColor} fontSize={12} allowDecimals={false} />
                  <YAxis type="category" dataKey="type" stroke={chart.tickColor} fontSize={12} width={70} />
                  <Tooltip
                    contentStyle={{
                      background: chart.tooltipBg,
                      border: `1px solid ${chart.tooltipBorder}`,
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                    {typeData.map((d) => (
                      <Cell key={d.type} fill={TYPE_COLORS[d.type] ?? chart.barPrimary} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">Conversion Funnel</h2>
              <Mail className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="space-y-2.5">
              {funnel.map((f, i) => {
                const pct = (f.value / funnelMax) * 100;
                const prev = i > 0 ? funnel[i - 1].value : null;
                const drop = prev && prev > 0 ? Math.round(((prev - f.value) / prev) * 100) : null;
                return (
                  <div key={f.label}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-medium">{f.label}</span>
                      <span className="tabular-nums text-muted-foreground">
                        {f.value.toLocaleString()}
                        {drop !== null && drop > 0 && (
                          <span className="ml-2 text-destructive">−{drop}%</span>
                        )}
                      </span>
                    </div>
                    <div className="h-7 rounded-md bg-muted/40 overflow-hidden relative">
                      <div
                        className="h-full bg-primary/80 transition-all"
                        style={{ width: `${Math.max(pct, 2)}%` }}
                      />
                      {!f.tracked && (
                        <span className="absolute inset-0 flex items-center justify-center text-[10px] text-muted-foreground italic">
                          tracking just enabled
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Daily trend */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Daily Roadmaps — Last 30 Days</h2>
            <span className="text-xs text-muted-foreground">CBN deadline: 10 Jun 2026</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyData}>
                <CartesianGrid stroke={chart.gridColor} strokeDasharray="3 3" />
                <XAxis dataKey="label" stroke={chart.tickColor} fontSize={11} />
                <YAxis stroke={chart.tickColor} fontSize={11} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    background: chart.tooltipBg,
                    border: `1px solid ${chart.tooltipBorder}`,
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Line type="monotone" dataKey="count" stroke={chart.areaStroke} strokeWidth={2} dot={false} />
                {deadlineInRange && (
                  <ReferenceLine
                    x={CBN_DEADLINE.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                    stroke="hsl(0, 84%, 60%)"
                    strokeDasharray="4 4"
                    label={{ value: 'CBN deadline', position: 'top', fill: 'hsl(0, 84%, 60%)', fontSize: 11 }}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Lead table */}
        <Card className="p-5">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
            <h2 className="font-semibold">All Roadmap Leads</h2>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="h-4 w-4 absolute left-2.5 top-2.5 text-muted-foreground" />
                <Input
                  className="pl-8 h-9 w-56"
                  placeholder="Search institution…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="h-9 w-32"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  {Object.values(TYPE_SHORT).map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={demoFilter} onValueChange={setDemoFilter}>
                <SelectTrigger className="h-9 w-36"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All leads</SelectItem>
                  <SelectItem value="booked">Demo booked</SelectItem>
                  <SelectItem value="pending">No demo yet</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={exportCSV}>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>

          {leads === null ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10" />)}
            </div>
          ) : (
            <>
              <div className="border rounded-md overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Institution</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead className="text-center">WA</TableHead>
                      <TableHead>AML Setup</TableHead>
                      <TableHead className="text-center">Demo</TableHead>
                      <TableHead className="text-center">Email seq</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paged.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center text-muted-foreground py-8 text-sm">
                          No leads match your filters.
                        </TableCell>
                      </TableRow>
                    )}
                    {paged.map((l) => {
                      const seq = sequencesByEmail.get(l.email.toLowerCase());
                      const step = seq
                        ? [seq.email_1_sent_at, seq.email_2_sent_at, seq.email_3_sent_at, seq.email_4_sent_at, seq.email_5_sent_at]
                            .filter(Boolean).length
                        : 0;
                      const isBooked = demoByEmail.has(l.email.toLowerCase());
                      return (
                        <TableRow key={l.id}>
                          <TableCell className="text-xs whitespace-nowrap">{fmtDate(l.created_at)}</TableCell>
                          <TableCell className="font-medium">{l.institution_name}</TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              style={{
                                borderColor: TYPE_COLORS[shortType(l.institution_type)],
                                color: TYPE_COLORS[shortType(l.institution_type)],
                              }}
                              className="text-[10px]"
                            >
                              {shortType(l.institution_type)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs">{l.contact_name}</TableCell>
                          <TableCell className="text-xs">{l.email}</TableCell>
                          <TableCell className="text-center text-xs">{l.phone ? '✓' : '—'}</TableCell>
                          <TableCell className="text-xs max-w-[180px] truncate" title={l.aml_setup}>
                            {l.aml_setup}
                          </TableCell>
                          <TableCell className="text-center">
                            {isBooked ? (
                              <Badge className="bg-green-500/15 text-green-500 border-green-500/30">Booked</Badge>
                            ) : (
                              <Badge variant="outline" className="text-[10px]">Pending</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-center text-xs tabular-nums">
                            {step}/5
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
              {totalPages > 1 && (
                <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
                  </span>
                  <Pagination className="m-0 w-auto">
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          href="#"
                          onClick={(e) => { e.preventDefault(); setPage((p) => Math.max(1, p - 1)); }}
                        />
                      </PaginationItem>
                      <PaginationItem>
                        <PaginationLink href="#" isActive>{page}</PaginationLink>
                      </PaginationItem>
                      <PaginationItem>
                        <PaginationNext
                          href="#"
                          onClick={(e) => { e.preventDefault(); setPage((p) => Math.min(totalPages, p + 1)); }}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          )}
          </Card>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function KPI({
  icon, label, value, loading,
}: { icon: React.ReactNode; label: string; value: string | number; loading: boolean }) {
  return (
    <Card className="p-5">
      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
        {icon}
        <span className="uppercase tracking-wide">{label}</span>
      </div>
      {loading ? (
        <Skeleton className="h-8 w-20" />
      ) : (
        <div className="text-3xl font-semibold tabular-nums">{value}</div>
      )}
    </Card>
  );
}
