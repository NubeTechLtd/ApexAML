import { useState, useCallback, useMemo } from 'react';
import { useZoneNavigate } from '@/hooks/useZone';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { ThemeToggle } from '@/components/ThemeToggle';
import { AlertTriangle, ShieldCheck, TrendingUp, TrendingDown, Clock, Users, FileText, ArrowUpRight, ArrowDownRight, RefreshCw, Loader2 } from 'lucide-react';
import { useChartTheme } from '@/hooks/useChartTheme';
import { NotificationBell } from '@/components/NotificationBell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { AlertData } from '@/data/models/legacyAlerts';
import { useDemoDataset } from '@/data-layer/demoDataset';
import { SEED_TRANSACTIONS, SEED_NOW } from '@/data-layer/seed/dataset';
import { DailyBriefing } from '@/components/DailyBriefing';
import { LiveActivityFeed } from '@/components/LiveActivityFeed';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';

function buildDashboard(mockAlerts: AlertData[]) {
const alertsByRisk = [
  { level: 'Critical', count: mockAlerts.filter(a => a.riskLevel === 'Critical').length, color: 'hsl(0, 72%, 51%)' },
  { level: 'High', count: mockAlerts.filter(a => a.riskLevel === 'High').length, color: 'hsl(25, 95%, 53%)' },
  { level: 'Medium', count: mockAlerts.filter(a => a.riskLevel === 'Medium').length, color: 'hsl(45, 93%, 47%)' },
  { level: 'Low', count: mockAlerts.filter(a => a.riskLevel === 'Low').length, color: 'hsl(142, 71%, 45%)' },
];

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const weeklyTrend = Array.from({ length: 7 }, (_, i) => {
  const day = new Date(SEED_NOW - (6 - i) * 86_400_000);
  const key = day.toISOString().slice(0, 10);
  const raised = mockAlerts.filter(a => a.timestamp.slice(0, 10) === key);
  return { day: DAY_NAMES[day.getUTCDay()], alerts: raised.length, resolved: raised.filter(a => a.status === 'Escalated' || a.status === 'Dismissed').length };
});

const volumeTrend = Array.from({ length: 5 }, (_, i) => {
  const end = SEED_NOW - (4 - i) * 7 * 86_400_000;
  const start = end - 7 * 86_400_000;
  const volume = SEED_TRANSACTIONS.filter(t => { const ts = new Date(t.date).getTime(); return ts > start && ts <= end && !!t.flagReason; }).length;
  return { date: new Date(end).toLocaleDateString('en-NG', { month: 'short', day: '2-digit' }), volume };
});

const openAlerts = mockAlerts.filter(a => a.status === 'Open').length;
const criticalAlerts = mockAlerts.filter(a => a.riskLevel === 'Critical' && a.status === 'Open').length;
const escalatedAlerts = mockAlerts.filter(a => a.status === 'Escalated').length;

const kpiCards = [
  {
    title: 'Open Alerts',
    value: openAlerts,
    subtitle: `${criticalAlerts} critical alert${criticalAlerts !== 1 ? 's' : ''}`,
    trend: 'up' as const,
    icon: AlertTriangle,
    accent: 'text-[hsl(var(--risk-high))]',
    bg: 'bg-[hsl(var(--risk-high))]/8',
    link: '/alerts?status=Open',
  },
  {
    title: 'Critical Alerts',
    value: criticalAlerts,
    subtitle: `${criticalAlerts} requiring immediate action`,
    trend: 'up' as const,
    icon: AlertTriangle,
    accent: 'text-destructive',
    bg: 'bg-destructive/8',
    link: '/alerts?risk=Critical',
  },
  {
    title: 'Avg. Resolution Time',
    value: '4.2h',
    subtitle: '↓ 18% vs last month',
    trend: 'down-good' as const,
    icon: Clock,
    accent: 'text-primary',
    bg: 'bg-primary/8',
    link: '/alerts?status=Under Review',
  },
  {
    title: 'STRs Filed (MTD)',
    value: escalatedAlerts,
    subtitle: `${escalatedAlerts} escalated cases`,
    trend: 'neutral' as const,
    icon: FileText,
    accent: 'text-[hsl(var(--risk-medium))]',
    bg: 'bg-[hsl(var(--risk-medium))]/8',
    link: '/alerts?status=Escalated',
  },
];

const topFlagged = [...mockAlerts]
  .sort((a, b) => b.riskScore - a.riskScore)
  .slice(0, 5);

return { alertsByRisk, weeklyTrend, volumeTrend, kpiCards, topFlagged };
}

const riskBadgeClass: Record<string, string> = {
  Critical: 'bg-[hsl(var(--risk-critical))]/10 text-[hsl(var(--risk-critical))] border-[hsl(var(--risk-critical))]/20',
  High: 'bg-[hsl(var(--risk-high))]/10 text-[hsl(var(--risk-high))] border-[hsl(var(--risk-high))]/20',
  Medium: 'bg-[hsl(var(--risk-medium))]/10 text-[hsl(var(--risk-medium))] border-[hsl(var(--risk-medium))]/20',
  Low: 'bg-[hsl(var(--risk-low))]/10 text-[hsl(var(--risk-low))] border-[hsl(var(--risk-low))]/20',
};

const statusBadgeClass: Record<string, string> = {
  Open: 'bg-[hsl(var(--risk-high))]/10 text-[hsl(var(--risk-high))]',
  'Under Review': 'bg-[hsl(var(--risk-medium))]/10 text-[hsl(var(--risk-medium))]',
  Escalated: 'bg-[hsl(var(--risk-critical))]/10 text-[hsl(var(--risk-critical))]',
  Dismissed: 'bg-muted text-muted-foreground',
};

export default function Dashboard() {
  const navigate = useZoneNavigate();
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState(() => new Date());
  const chart = useChartTheme();
  const { legacyAlerts } = useDemoDataset();
  const { alertsByRisk, weeklyTrend, volumeTrend, kpiCards, topFlagged } = useMemo(() => buildDashboard(legacyAlerts), [legacyAlerts]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => { setRefreshing(false); setLastRefreshed(new Date()); }, 1200);
  }, []);

  const formattedTime = useMemo(() => {
    return `Today ${lastRefreshed.toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Africa/Lagos' })} WAT`;
  }, [lastRefreshed]);

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="h-14 flex items-center justify-between border-b border-border px-6 bg-card">
            <div className="flex items-center gap-3">
              <SidebarTrigger />
              <div>
                <h1 className="text-sm font-semibold text-foreground">Dashboard</h1>
                <p className="text-[10px] text-muted-foreground">AML Compliance Overview</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-muted-foreground">Last refreshed: {formattedTime}</span>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleRefresh} disabled={refreshing}>
                {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              </Button>
              <ThemeToggle />
              <NotificationBell />
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 p-6 space-y-6 overflow-auto">
            <DailyBriefing />
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {kpiCards.map((kpi) => (
                <Card
                  key={kpi.title}
                  className="border-border bg-card shadow-sm cursor-pointer hover:shadow-md hover:border-primary/20 transition-all group"
                  onClick={() => navigate(kpi.link)}
                >
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{kpi.title}</p>
                        <p className="text-2xl font-bold text-foreground">{kpi.value}</p>
                        <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                          {kpi.trend === 'up' && <ArrowUpRight className="h-3 w-3 text-[hsl(var(--risk-high))]" />}
                          {(kpi.trend as string) === 'up-good' && <ArrowUpRight className="h-3 w-3 text-[hsl(var(--risk-low))]" />}
                          {kpi.trend === 'down-good' && <ArrowDownRight className="h-3 w-3 text-[hsl(var(--risk-low))]" />}
                          {kpi.subtitle}
                        </p>
                      </div>
                      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${kpi.bg}`}>
                        <kpi.icon className={`h-5 w-5 ${kpi.accent}`} />
                      </div>
                    </div>
                    <p className="text-[10px] text-primary/60 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">Click to view →</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Weekly Alert Trend */}
              <Card className="lg:col-span-2 border-border bg-card shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    Weekly Alert Activity
                  </CardTitle>
                  <p className="text-[10px] text-muted-foreground">Alerts generated vs resolved this week</p>
                </CardHeader>
                <CardContent className="pt-0">
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={weeklyTrend} barGap={2}>
                      <CartesianGrid strokeDasharray="3 3" stroke={chart.gridColor} vertical={false} />
                      <XAxis dataKey="day" tick={{ fontSize: 11, fill: chart.tickColor }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: chart.tickColor }} axisLine={false} tickLine={false} width={28} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: chart.tooltipBg,
                          border: `1px solid ${chart.tooltipBorder}`,
                          borderRadius: '8px',
                          fontSize: '12px',
                        }}
                      />
                      <Bar dataKey="alerts" fill={chart.barPrimary} radius={[4, 4, 0, 0]} name="Generated" />
                      <Bar dataKey="resolved" fill={chart.barSuccess} radius={[4, 4, 0, 0]} name="Resolved" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Live Activity Feed */}
              <LiveActivityFeed />
            </div>

            {/* Bottom Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Top Flagged Customers */}
              <Card className="lg:col-span-2 border-border bg-card shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    Top Flagged Customers
                  </CardTitle>
                  <p className="text-[10px] text-muted-foreground">Highest risk scores requiring attention</p>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-0 divide-y divide-border">
                    {topFlagged.map((alert) => (
                      <div key={alert.id} className="flex items-center justify-between py-3 first:pt-1">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-xs font-semibold text-foreground">
                            {alert.customerName.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">{alert.customerName}</p>
                            <p className="text-[10px] text-muted-foreground">{alert.alertType} · {alert.id}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className={riskBadgeClass[alert.riskLevel]}>
                            {alert.riskLevel}
                          </Badge>
                          <Badge variant="outline" className={statusBadgeClass[alert.status]}>
                            {alert.status}
                          </Badge>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-foreground">{alert.riskScore}</p>
                            <p className="text-[9px] text-muted-foreground uppercase">Score</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Alert Volume Trend */}
              <Card className="border-border bg-card shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <TrendingDown className="h-4 w-4 text-muted-foreground" />
                    Alert Volume (5 Weeks)
                  </CardTitle>
                  <p className="text-[10px] text-muted-foreground">Weekly alert generation trend</p>
                </CardHeader>
                <CardContent className="pt-0">
                  <ResponsiveContainer width="100%" height={180}>
                    <AreaChart data={volumeTrend}>
                      <defs>
                        <linearGradient id="volumeGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={chart.areaStroke} stopOpacity={0.2} />
                          <stop offset="100%" stopColor={chart.areaStroke} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={chart.gridColor} vertical={false} />
                      <XAxis dataKey="date" tick={{ fontSize: 10, fill: chart.tickColor }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: chart.tickColor }} axisLine={false} tickLine={false} width={28} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: chart.tooltipBg,
                          border: `1px solid ${chart.tooltipBorder}`,
                          borderRadius: '8px',
                          fontSize: '12px',
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="volume"
                        stroke={chart.areaStroke}
                        strokeWidth={2}
                        fill="url(#volumeGrad)"
                        name="Alerts"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
