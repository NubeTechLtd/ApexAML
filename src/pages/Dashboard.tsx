import { useNavigate } from 'react-router-dom';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Bell, AlertTriangle, ShieldCheck, TrendingUp, TrendingDown, Clock, Users, FileText, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { mockAlerts } from '@/data/mockAlerts';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';

const alertsByRisk = [
  { level: 'Critical', count: mockAlerts.filter(a => a.riskLevel === 'Critical').length, color: 'hsl(0, 72%, 51%)' },
  { level: 'High', count: mockAlerts.filter(a => a.riskLevel === 'High').length, color: 'hsl(25, 95%, 53%)' },
  { level: 'Medium', count: mockAlerts.filter(a => a.riskLevel === 'Medium').length, color: 'hsl(45, 93%, 47%)' },
  { level: 'Low', count: mockAlerts.filter(a => a.riskLevel === 'Low').length, color: 'hsl(142, 71%, 45%)' },
];

const weeklyTrend = [
  { day: 'Mon', alerts: 12, resolved: 9 },
  { day: 'Tue', alerts: 8, resolved: 7 },
  { day: 'Wed', alerts: 15, resolved: 11 },
  { day: 'Thu', alerts: 6, resolved: 5 },
  { day: 'Fri', alerts: 10, resolved: 8 },
  { day: 'Sat', alerts: 3, resolved: 3 },
  { day: 'Sun', alerts: 2, resolved: 1 },
];

const volumeTrend = [
  { date: 'Mar 10', volume: 42 },
  { date: 'Mar 17', volume: 38 },
  { date: 'Mar 24', volume: 55 },
  { date: 'Mar 31', volume: 47 },
  { date: 'Apr 07', volume: 56 },
];

const kpiCards = [
  {
    title: 'Open Alerts',
    value: mockAlerts.filter(a => a.status === 'Open').length,
    subtitle: '+3 since yesterday',
    trend: 'up' as const,
    icon: AlertTriangle,
    accent: 'text-[hsl(var(--risk-high))]',
    bg: 'bg-[hsl(var(--risk-high))]/8',
    link: '/?status=Open',
  },
  {
    title: 'Resolved (MTD)',
    value: 142,
    subtitle: '94% resolution rate',
    trend: 'up-good' as const,
    icon: ShieldCheck,
    accent: 'text-[hsl(var(--risk-low))]',
    bg: 'bg-[hsl(var(--risk-low))]/8',
    link: '/?status=Dismissed',
  },
  {
    title: 'Avg. Resolution Time',
    value: '4.2h',
    subtitle: '↓ 18% vs last month',
    trend: 'down-good' as const,
    icon: Clock,
    accent: 'text-primary',
    bg: 'bg-primary/8',
    link: '/?status=Under Review',
  },
  {
    title: 'STRs Filed (MTD)',
    value: 23,
    subtitle: '5 pending review',
    trend: 'neutral' as const,
    icon: FileText,
    accent: 'text-[hsl(var(--risk-medium))]',
    bg: 'bg-[hsl(var(--risk-medium))]/8',
    link: '/?status=Escalated',
  },
];

const topFlagged = mockAlerts
  .sort((a, b) => b.riskScore - a.riskScore)
  .slice(0, 5);

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
              <span className="text-[10px] text-muted-foreground">Last updated: Today, 08:32 WAT</span>
              <button className="relative flex h-8 w-8 items-center justify-center rounded-md hover:bg-muted transition-colors">
                <Bell className="h-4 w-4 text-muted-foreground" />
                <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-[hsl(var(--risk-critical))] animate-pulse" />
              </button>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 p-6 space-y-6 overflow-auto">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {kpiCards.map((kpi) => (
                <Card key={kpi.title} className="border-border bg-card shadow-sm">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{kpi.title}</p>
                        <p className="text-2xl font-bold text-foreground">{kpi.value}</p>
                        <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                          {kpi.trend === 'up' && <ArrowUpRight className="h-3 w-3 text-[hsl(var(--risk-high))]" />}
                          {kpi.trend === 'up-good' && <ArrowUpRight className="h-3 w-3 text-[hsl(var(--risk-low))]" />}
                          {kpi.trend === 'down-good' && <ArrowDownRight className="h-3 w-3 text-[hsl(var(--risk-low))]" />}
                          {kpi.subtitle}
                        </p>
                      </div>
                      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${kpi.bg}`}>
                        <kpi.icon className={`h-5 w-5 ${kpi.accent}`} />
                      </div>
                    </div>
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
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 20%, 90%)" vertical={false} />
                      <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'hsl(215, 14%, 46%)' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: 'hsl(215, 14%, 46%)' }} axisLine={false} tickLine={false} width={28} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(0, 0%, 100%)',
                          border: '1px solid hsl(214, 20%, 90%)',
                          borderRadius: '8px',
                          fontSize: '12px',
                        }}
                      />
                      <Bar dataKey="alerts" fill="hsl(217, 55%, 22%)" radius={[4, 4, 0, 0]} name="Generated" />
                      <Bar dataKey="resolved" fill="hsl(142, 71%, 45%)" radius={[4, 4, 0, 0]} name="Resolved" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Risk Distribution */}
              <Card className="border-border bg-card shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold text-foreground">Alert Risk Distribution</CardTitle>
                  <p className="text-[10px] text-muted-foreground">Active alerts by severity</p>
                </CardHeader>
                <CardContent className="pt-0 flex flex-col items-center">
                  <ResponsiveContainer width="100%" height={160}>
                    <PieChart>
                      <Pie
                        data={alertsByRisk}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={70}
                        dataKey="count"
                        stroke="none"
                      >
                        {alertsByRisk.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(0, 0%, 100%)',
                          border: '1px solid hsl(214, 20%, 90%)',
                          borderRadius: '8px',
                          fontSize: '12px',
                        }}
                        formatter={(value: number, name: string, props: any) => [value, props.payload.level]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex flex-wrap gap-3 mt-1">
                    {alertsByRisk.map((r) => (
                      <div key={r.level} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: r.color }} />
                        {r.level} ({r.count})
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
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
                          <stop offset="0%" stopColor="hsl(217, 55%, 22%)" stopOpacity={0.2} />
                          <stop offset="100%" stopColor="hsl(217, 55%, 22%)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 20%, 90%)" vertical={false} />
                      <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'hsl(215, 14%, 46%)' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: 'hsl(215, 14%, 46%)' }} axisLine={false} tickLine={false} width={28} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(0, 0%, 100%)',
                          border: '1px solid hsl(214, 20%, 90%)',
                          borderRadius: '8px',
                          fontSize: '12px',
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="volume"
                        stroke="hsl(217, 55%, 22%)"
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
