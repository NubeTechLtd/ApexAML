import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  BarChart, Bar, Cell,
} from 'recharts';
import { useChartTheme } from '@/hooks/useChartTheme';
import { ArrowDownRight, Eye, MousePointerClick, FileText, Send, Users2 } from 'lucide-react';

type PageEvent = {
  session_id: string | null;
  path: string | null;
  event_name: string | null;
  created_at: string;
};

type WindowDays = 7 | 30 | 90;

export default function AdminAnalytics() {
  const chart = useChartTheme();
  const [days, setDays] = useState<WindowDays>(30);
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<PageEvent[]>([]);
  const [leadCount, setLeadCount] = useState(0);
  const [roadmapLeadCount, setRoadmapLeadCount] = useState(0);
  const [demoCount, setDemoCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const since = new Date(Date.now() - days * 86400_000).toISOString();

    (async () => {
      const [ev, ld, rl, dr] = await Promise.all([
        supabase.from('page_events').select('session_id,path,event_name,created_at')
          .gte('created_at', since).order('created_at', { ascending: true }).limit(10000),
        supabase.from('leads').select('id', { count: 'exact', head: true }).gte('created_at', since),
        supabase.from('roadmap_leads').select('id', { count: 'exact', head: true }).gte('created_at', since),
        supabase.from('demo_requests').select('id', { count: 'exact', head: true }).gte('created_at', since),
      ]);
      if (cancelled) return;
      setEvents((ev.data as PageEvent[]) ?? []);
      setLeadCount(ld.count ?? 0);
      setRoadmapLeadCount(rl.count ?? 0);
      setDemoCount(dr.count ?? 0);
      setLoading(false);
    })();

    return () => { cancelled = true; };
  }, [days]);

  const dailyVisitors = useMemo(() => {
    const buckets = new Map<string, Set<string>>();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400_000).toISOString().slice(0, 10);
      buckets.set(d, new Set());
    }
    for (const e of events) {
      const d = e.created_at.slice(0, 10);
      const set = buckets.get(d);
      if (set && e.session_id) set.add(e.session_id);
    }
    return Array.from(buckets.entries()).map(([date, set]) => ({
      date: date.slice(5),
      visitors: set.size,
    }));
  }, [events, days]);

  const totalVisitors = useMemo(() => {
    const s = new Set<string>();
    for (const e of events) if (e.session_id) s.add(e.session_id);
    return s.size;
  }, [events]);

  const topPages = useMemo(() => {
    const counts = new Map<string, number>();
    for (const e of events) {
      const p = e.path || '(unknown)';
      counts.set(p, (counts.get(p) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .map(([path, views]) => ({ path, views }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 8);
  }, [events]);

  const funnel = useMemo(() => {
    const sessionsWith = (pred: (e: PageEvent) => boolean) => {
      const s = new Set<string>();
      for (const e of events) if (e.session_id && pred(e)) s.add(e.session_id);
      return s.size;
    };
    const visitors = totalVisitors;
    const viewedRoadmap = sessionsWith(e => (e.path || '').includes('/roadmap'));
    const hookViewed = sessionsWith(e => e.event_name === 'hook_viewed');
    const formStarted = sessionsWith(e => e.event_name === 'form_started');
    const leads = leadCount + roadmapLeadCount + demoCount;
    return [
      { stage: 'Visitors', count: visitors, icon: Users2 },
      { stage: 'Roadmap page', count: viewedRoadmap, icon: Eye },
      { stage: 'Hook viewed', count: hookViewed, icon: MousePointerClick },
      { stage: 'Form started', count: formStarted, icon: FileText },
      { stage: 'Lead captured', count: leads, icon: Send },
    ];
  }, [events, totalVisitors, leadCount, roadmapLeadCount, demoCount]);

  const totalEvents = events.length;
  const conversionRate = totalVisitors
    ? (((leadCount + roadmapLeadCount + demoCount) / totalVisitors) * 100).toFixed(2)
    : '0.00';

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <header className="flex items-center justify-between border-b border-border px-6 h-14">
            <div className="flex items-center gap-3">
              <SidebarTrigger />
              <div>
                <h1 className="text-sm font-semibold">Visitor Analytics</h1>
                <p className="text-xs text-muted-foreground">Who visited, what they saw, where they converted</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Select value={String(days)} onValueChange={v => setDays(Number(v) as WindowDays)}>
                <SelectTrigger className="w-36 h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="90">Last 90 days</SelectItem>
                </SelectContent>
              </Select>
              <ThemeToggle />
            </div>
          </header>

          <main className="flex-1 p-6 space-y-6 overflow-auto">
            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <KpiCard label="Unique visitors" value={totalVisitors} loading={loading} />
              <KpiCard label="Total page events" value={totalEvents} loading={loading} />
              <KpiCard label="Leads captured" value={leadCount + roadmapLeadCount + demoCount} loading={loading} />
              <KpiCard label="Visitor → Lead rate" value={`${conversionRate}%`} loading={loading} />
            </div>

            {/* Daily visitors */}
            <Card className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-sm font-semibold">Daily unique visitors</h2>
                  <p className="text-xs text-muted-foreground">Distinct sessions per day</p>
                </div>
                <Badge variant="secondary">{days}d window</Badge>
              </div>
              {loading ? (
                <Skeleton className="h-64 w-full" />
              ) : (
                <div className="h-64">
                  <ResponsiveContainer>
                    <LineChart data={dailyVisitors} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={chart.gridColor} />
                      <XAxis dataKey="date" stroke={chart.tickColor} fontSize={11} />
                      <YAxis stroke={chart.tickColor} fontSize={11} allowDecimals={false} />
                      <Tooltip contentStyle={{ background: chart.tooltipBg, border: `1px solid ${chart.gridColor}`, borderRadius: 6 }} />
                      <Line type="monotone" dataKey="visitors" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top pages */}
              <Card className="p-5">
                <h2 className="text-sm font-semibold mb-1">Top pages</h2>
                <p className="text-xs text-muted-foreground mb-4">Ranked by total pageviews</p>
                {loading ? (
                  <Skeleton className="h-64 w-full" />
                ) : topPages.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-8 text-center">No page events yet</p>
                ) : (
                  <div className="h-64">
                    <ResponsiveContainer>
                      <BarChart data={topPages} layout="vertical" margin={{ top: 4, right: 16, left: 16, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={chart.gridColor} horizontal={false} />
                        <XAxis type="number" stroke={chart.tickColor} fontSize={11} />
                        <YAxis type="category" dataKey="path" stroke={chart.tickColor} fontSize={11} width={140} />
                        <Tooltip contentStyle={{ background: chart.tooltipBg, border: `1px solid ${chart.gridColor}`, borderRadius: 6 }} />
                        <Bar dataKey="views" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </Card>

              {/* Conversion funnel */}
              <Card className="p-5">
                <h2 className="text-sm font-semibold mb-1">Conversion funnel</h2>
                <p className="text-xs text-muted-foreground mb-4">Drop-off from visitor to captured lead</p>
                {loading ? (
                  <Skeleton className="h-64 w-full" />
                ) : (
                  <div className="space-y-2">
                    {funnel.map((step, i) => {
                      const prev = i === 0 ? step.count : funnel[i - 1].count;
                      const pct = prev > 0 ? (step.count / prev) * 100 : 0;
                      const width = funnel[0].count > 0 ? (step.count / funnel[0].count) * 100 : 0;
                      const Icon = step.icon;
                      return (
                        <div key={step.stage}>
                          <div className="flex items-center justify-between text-xs mb-1">
                            <div className="flex items-center gap-2 text-foreground">
                              <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                              <span className="font-medium">{step.stage}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono">{step.count.toLocaleString()}</span>
                              {i > 0 && (
                                <span className="text-muted-foreground flex items-center gap-0.5">
                                  <ArrowDownRight className="h-3 w-3" />
                                  {(100 - pct).toFixed(0)}% drop
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="h-8 rounded bg-muted overflow-hidden">
                            <div
                              className="h-full bg-primary/80 transition-all flex items-center justify-end px-2 text-[10px] text-primary-foreground font-mono"
                              style={{ width: `${Math.max(width, 2)}%` }}
                            >
                              {width > 12 ? `${width.toFixed(0)}%` : ''}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>
            </div>

            {/* Lead source breakdown */}
            <Card className="p-5">
              <h2 className="text-sm font-semibold mb-1">Leads by source</h2>
              <p className="text-xs text-muted-foreground mb-4">Where captured leads came from over the window</p>
              {loading ? (
                <Skeleton className="h-40 w-full" />
              ) : (
                <div className="grid grid-cols-3 gap-4">
                  <SourceStat label="Roadmap leads" value={roadmapLeadCount} />
                  <SourceStat label="Contact / Newsletter" value={leadCount} />
                  <SourceStat label="Demo requests" value={demoCount} />
                </div>
              )}
            </Card>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function KpiCard({ label, value, loading }: { label: string; value: number | string; loading: boolean }) {
  return (
    <Card className="p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      {loading ? (
        <Skeleton className="h-7 w-20 mt-2" />
      ) : (
        <p className="text-2xl font-semibold mt-1 font-mono">{typeof value === 'number' ? value.toLocaleString() : value}</p>
      )}
    </Card>
  );
}

function SourceStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="border border-border rounded p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-xl font-semibold mt-1 font-mono">{value.toLocaleString()}</p>
    </div>
  );
}
