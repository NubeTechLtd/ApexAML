import { useEffect, useState, useMemo, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, FileCheck, Clock, TrendingUp, Percent } from 'lucide-react';
import { CTRPendingTable } from './CTRPendingTable';
import { CTRFiledTable } from './CTRFiledTable';
import { Skeleton } from '@/components/ui/skeleton';

export type CTRRow = Database['public']['Tables']['ctr_queue']['Row'];

const formatNGN = (n: number) => '₦' + Math.round(n).toLocaleString('en-NG');

function hoursBetween(a: string, b: Date = new Date()): number {
  return (b.getTime() - new Date(a).getTime()) / (1000 * 60 * 60);
}

export function CTRManagement() {
  const [rows, setRows] = useState<CTRRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRows = useCallback(async () => {
    const { data, error } = await supabase
      .from('ctr_queue')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data) setRows(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchRows();
    const channel = supabase
      .channel('ctr-queue-feed')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ctr_queue' }, fetchRows)
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchRows]);

  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const pendingRows = useMemo(() => rows.filter(r => r.status === 'pending_review'), [rows]);
  const filedRows = useMemo(() => rows.filter(r => r.status === 'filed'), [rows]);

  const kpis = useMemo(() => {
    const pendingToday = pendingRows.filter(r => r.report_date === todayStr).length;
    const filedThisMonth = filedRows.filter(r => r.filed_at && new Date(r.filed_at) >= monthStart);
    const totalValueMonth = filedThisMonth.reduce((s, r) => s + Number(r.total_cash_ngn), 0);
    const within72h = filedThisMonth.filter(
      r => r.filed_at && hoursBetween(r.created_at, new Date(r.filed_at)) <= 72,
    ).length;
    const complianceRate = filedThisMonth.length > 0
      ? Math.round((within72h / filedThisMonth.length) * 100)
      : null;
    return {
      pendingToday,
      filedThisMonth: filedThisMonth.length,
      totalValueMonth,
      complianceRate,
    };
  }, [pendingRows, filedRows, todayStr, monthStart]);

  const approachingDeadline = useMemo(
    () => pendingRows.filter(r => hoursBetween(r.created_at) > 48),
    [pendingRows],
  );

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {[0, 1, 2, 3].map(i => <Skeleton key={i} className="h-20" />)}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <KpiCard
          label="CTRs pending review today"
          value={String(kpis.pendingToday)}
          icon={<Clock className="h-3.5 w-3.5" />}
          tone={kpis.pendingToday > 0 ? 'warn' : 'neutral'}
        />
        <KpiCard
          label="CTRs filed this month"
          value={String(kpis.filedThisMonth)}
          icon={<FileCheck className="h-3.5 w-3.5" />}
        />
        <KpiCard
          label="Total value reported this month"
          value={formatNGN(kpis.totalValueMonth)}
          icon={<TrendingUp className="h-3.5 w-3.5" />}
        />
        <KpiCard
          label="Filing compliance rate (72h)"
          value={kpis.complianceRate === null ? '—' : `${kpis.complianceRate}%`}
          icon={<Percent className="h-3.5 w-3.5" />}
          tone={kpis.complianceRate !== null && kpis.complianceRate < 90 ? 'warn' : 'good'}
        />
      </div>

      {approachingDeadline.length > 0 && (
        <div className="flex items-start gap-2 rounded-lg border border-[hsl(var(--risk-medium)/0.3)] bg-[hsl(var(--risk-medium)/0.08)] px-3 py-2.5">
          <AlertTriangle className="h-4 w-4 text-[hsl(var(--risk-medium))] mt-0.5 shrink-0" />
          <div className="text-xs">
            <span className="font-semibold text-[hsl(var(--risk-medium))]">
              {approachingDeadline.length} CTR{approachingDeadline.length !== 1 && 's'} approaching the 72-hour CBN filing deadline
            </span>
            <span className="text-muted-foreground"> — review required.</span>
          </div>
        </div>
      )}

      <Tabs defaultValue="pending" className="space-y-3">
        <TabsList>
          <TabsTrigger value="pending" className="text-xs">
            Pending Review
            {pendingRows.length > 0 && (
              <span className="ml-1.5 rounded bg-[hsl(var(--risk-medium)/0.15)] px-1.5 py-0.5 text-[10px] font-semibold text-[hsl(var(--risk-medium))]">
                {pendingRows.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="filed" className="text-xs">
            Filed CTRs
            {filedRows.length > 0 && (
              <span className="ml-1.5 rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                {filedRows.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="pending">
          <CTRPendingTable rows={pendingRows} allRows={rows} onRefresh={fetchRows} />
        </TabsContent>
        <TabsContent value="filed">
          <CTRFiledTable rows={filedRows} />
        </TabsContent>
      </Tabs>

      <p className="text-[10px] text-muted-foreground">
        Automated daily scan at 23:50 WAT flags any account whose combined cash transactions exceed ₦5,000,000 per CBN AML/CFT guidelines (Circular BSD/DIR/PUB/LAB/019/002). CTRs must be filed with NFIU within 72 hours of detection.
      </p>
    </div>
  );
}

function KpiCard({
  label,
  value,
  icon,
  tone = 'neutral',
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  tone?: 'neutral' | 'warn' | 'good';
}) {
  const toneClass =
    tone === 'warn'
      ? 'text-[hsl(var(--risk-medium))]'
      : tone === 'good'
        ? 'text-[hsl(var(--risk-low))]'
        : 'text-foreground';
  return (
    <Card className="p-3">
      <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        {icon}
        {label}
      </div>
      <p className={`mt-1 text-xl font-semibold ${toneClass}`}>{value}</p>
    </Card>
  );
}
