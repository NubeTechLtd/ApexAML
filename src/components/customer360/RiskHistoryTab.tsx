import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { RefreshCw, TrendingUp, TrendingDown, Minus, History } from 'lucide-react';
import { useChartTheme } from '@/hooks/useChartTheme';
import {
  TRIGGER_LABELS,
  TRIGGER_SHORT,
  useRiskScoreHistory,
  type RiskTriggerType,
} from '@/hooks/useRiskScoreHistory';
import { toast } from 'sonner';

interface Props {
  customerId: string;
  fallbackScore: number;
  kycTier?: string;
  customerName?: string;
}

const RAISING_TRIGGERS: RiskTriggerType[] = ['ALERT_FIRED', 'STR_FILED', 'SANCTIONS_MATCH'];

function formatMonth(iso: string) {
  return new Date(iso).toLocaleDateString('en-NG', { month: 'short', year: '2-digit' });
}

export function RiskHistoryTab({ customerId, fallbackScore, kycTier, customerName }: Props) {
  const chart = useChartTheme();
  const { history, latest, currentScore, isLive, loading, recalculating, recalculate } =
    useRiskScoreHistory(customerId, { fallbackScore, kycTier, customerName });

  const data = history.map((e) => ({
    label: formatMonth(e.createdAt),
    date: e.createdAt,
    score: e.newScore,
    change: e.scoreChange,
    trigger: e.triggerType,
    reference: e.triggerReference,
  }));

  const handleRecalculate = async () => {
    try {
      await recalculate('MANUAL_REVIEW');
      toast.success('Risk score recalculated');
    } catch {
      toast.error('Could not recalculate risk score');
    }
  };

  const peak = data.length ? Math.max(...data.map((d) => d.score)) : 0;
  const trough = data.length ? Math.min(...data.map((d) => d.score)) : 0;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4 pb-3">
          <div>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <History className="h-4 w-4 text-primary" /> Risk score over the last 12 months
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Each marker is a recalculation event — alerts raised, reports filed to the NFIU, KYC
              upgrades or clean periods.
              {!isLive && !loading && ' Showing modelled trail until the engine records live events.'}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 shrink-0"
            onClick={handleRecalculate}
            disabled={recalculating}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${recalculating ? 'animate-spin' : ''}`} />
            Recalculate
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="rounded-lg border border-border bg-muted/30 p-3">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Current</p>
              <p className="text-lg font-bold tabular-nums text-foreground">{currentScore}/100</p>
            </div>
            <div className="rounded-lg border border-border bg-muted/30 p-3">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">12-month peak</p>
              <p className="text-lg font-bold tabular-nums text-foreground">{peak}</p>
            </div>
            <div className="rounded-lg border border-border bg-muted/30 p-3">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">12-month low</p>
              <p className="text-lg font-bold tabular-nums text-foreground">{trough}</p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={chart.gridColor} vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: chart.tickColor }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fontSize: 11, fill: chart.tickColor }}
                  axisLine={false}
                  tickLine={false}
                />
                <ReferenceLine y={70} stroke="hsl(var(--risk-critical))" strokeDasharray="4 4" />
                <ReferenceLine y={40} stroke="hsl(var(--risk-medium))" strokeDasharray="4 4" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: chart.tooltipBg,
                    border: `1px solid ${chart.tooltipBorder}`,
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  formatter={(value: number) => [`${value}/100`, 'Risk score']}
                  labelFormatter={(_, payload) => {
                    const p = payload?.[0]?.payload;
                    if (!p) return '';
                    return `${new Date(p.date).toLocaleDateString('en-NG', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })} — ${TRIGGER_SHORT[p.trigger as RiskTriggerType]}`;
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke={chart.areaStroke}
                  strokeWidth={2}
                  dot={(props) => {
                    const { cx, cy, payload, index } = props as any;
                    const raising = RAISING_TRIGGERS.includes(payload.trigger);
                    return (
                      <circle
                        key={`dot-${index}`}
                        cx={cx}
                        cy={cy}
                        r={4}
                        fill={
                          raising ? 'hsl(var(--risk-critical))' : 'hsl(var(--risk-low))'
                        }
                        stroke={chart.tooltipBg}
                        strokeWidth={1.5}
                      />
                    );
                  }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Score movement log</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {[...history].reverse().map((e) => {
            const up = (e.scoreChange ?? 0) > 0;
            const flat = (e.scoreChange ?? 0) === 0;
            const Icon = flat ? Minus : up ? TrendingUp : TrendingDown;
            return (
              <div
                key={e.id}
                className="flex items-start justify-between gap-3 rounded-lg border border-border px-3 py-2"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className="text-[10px]">
                      {TRIGGER_SHORT[e.triggerType]}
                    </Badge>
                    {e.triggerReference && (
                      <span className="font-mono text-[10px] text-muted-foreground">
                        {e.triggerReference}
                      </span>
                    )}
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(e.createdAt).toLocaleDateString('en-NG', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Recalculated because {TRIGGER_LABELS[e.triggerType]}.
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {e.previousScore ?? '—'} → <strong className="text-foreground">{e.newScore}</strong>
                  </span>
                  <span
                    className={`inline-flex items-center gap-0.5 text-xs font-semibold tabular-nums ${
                      flat
                        ? 'text-muted-foreground'
                        : up
                          ? 'text-[hsl(var(--risk-critical))]'
                          : 'text-[hsl(var(--risk-low))]'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {flat ? '0' : `${up ? '+' : '−'}${Math.abs(e.scoreChange ?? 0)}`}
                  </span>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
