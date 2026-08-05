import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Users, Clock } from 'lucide-react';

interface PeerMetric {
  label: string;
  unit: string;
  customerValue: number;
  peerAverage: number;
  peerMin: number;
  peerMax: number;
  percentile: number;
  format?: (v: number) => string;
}

interface PeerGroupProfile {
  groupSize: number;
  groupLabel: string;
  metrics: PeerMetric[];
  /** 24 values, share of transactions per hour (0-1). */
  customerHours: number[];
  peerHours: number[];
}

const naira = (v: number) =>
  `₦${v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M` : `${Math.round(v / 1000)}k`}`;

const plain = (v: number) => String(Math.round(v));

/** Normalised hourly distribution helper — spreads weight across given hours. */
function hourly(weights: Record<number, number>): number[] {
  const arr = Array.from({ length: 24 }, (_, h) => weights[h] ?? 0.5);
  const total = arr.reduce((a, b) => a + b, 0);
  return arr.map((v) => v / total);
}

const peerGroups: Record<string, PeerGroupProfile> = {
  // Adebayo Ogunlesi — the demo outlier
  '1': {
    groupSize: 234,
    groupLabel: 'Tier 3 individual accounts, ₦2M–10M monthly turnover',
    metrics: [
      {
        label: 'Monthly transaction frequency',
        unit: 'transactions/month',
        customerValue: 218,
        peerAverage: 47,
        peerMin: 8,
        peerMax: 240,
        percentile: 97,
        format: plain,
      },
      {
        label: 'Average cash withdrawal amount',
        unit: 'per withdrawal',
        customerValue: 4_250_000,
        peerAverage: 780_000,
        peerMin: 50_000,
        peerMax: 5_000_000,
        percentile: 94,
        format: naira,
      },
      {
        label: 'Average transaction amount',
        unit: 'per transaction',
        customerValue: 1_850_000,
        peerAverage: 940_000,
        peerMin: 60_000,
        peerMax: 3_200_000,
        percentile: 81,
        format: naira,
      },
      {
        label: 'Unique counterparties per month',
        unit: 'counterparties/month',
        customerValue: 63,
        peerAverage: 19,
        peerMin: 3,
        peerMax: 72,
        percentile: 92,
        format: plain,
      },
    ],
    customerHours: hourly({
      22: 9, 23: 12, 0: 14, 1: 13, 2: 11, 3: 8, 4: 7, 5: 6,
      9: 2, 10: 2, 11: 2, 14: 2, 16: 2,
    }),
    peerHours: hourly({
      8: 6, 9: 9, 10: 11, 11: 10, 12: 9, 13: 8, 14: 9, 15: 8, 16: 7, 17: 6, 18: 4, 19: 3,
      22: 1, 23: 1, 0: 1, 1: 0.5, 2: 0.5, 3: 0.5, 4: 0.5, 5: 0.5,
    }),
  },
};

const defaultProfiles: Record<string, PeerGroupProfile> = {
  'Tier 1': {
    groupSize: 3241,
    groupLabel: 'Tier 1 individual accounts, under ₦500k monthly turnover',
    metrics: [
      { label: 'Monthly transaction frequency', unit: 'transactions/month', customerValue: 21, peerAverage: 18, peerMin: 2, peerMax: 60, percentile: 58, format: plain },
      { label: 'Average transaction amount', unit: 'per transaction', customerValue: 62_000, peerAverage: 48_000, peerMin: 5_000, peerMax: 190_000, percentile: 64, format: naira },
      { label: 'Unique counterparties per month', unit: 'counterparties/month', customerValue: 7, peerAverage: 6, peerMin: 1, peerMax: 24, percentile: 55, format: plain },
      { label: 'Average cash withdrawal amount', unit: 'per withdrawal', customerValue: 35_000, peerAverage: 40_000, peerMin: 5_000, peerMax: 150_000, percentile: 44, format: naira },
    ],
    customerHours: hourly({ 8: 5, 9: 7, 12: 8, 13: 7, 16: 6, 18: 5, 20: 3 }),
    peerHours: hourly({ 8: 6, 9: 8, 10: 9, 12: 9, 14: 8, 16: 7, 18: 5, 20: 3 }),
  },
  'Tier 2': {
    groupSize: 847,
    groupLabel: 'Tier 2 individual accounts, ₦500k–2M monthly turnover',
    metrics: [
      { label: 'Monthly transaction frequency', unit: 'transactions/month', customerValue: 54, peerAverage: 38, peerMin: 6, peerMax: 130, percentile: 72, format: plain },
      { label: 'Average transaction amount', unit: 'per transaction', customerValue: 410_000, peerAverage: 320_000, peerMin: 20_000, peerMax: 1_100_000, percentile: 68, format: naira },
      { label: 'Unique counterparties per month', unit: 'counterparties/month', customerValue: 16, peerAverage: 13, peerMin: 2, peerMax: 48, percentile: 61, format: plain },
      { label: 'Average cash withdrawal amount', unit: 'per withdrawal', customerValue: 240_000, peerAverage: 260_000, peerMin: 20_000, peerMax: 900_000, percentile: 47, format: naira },
    ],
    customerHours: hourly({ 8: 5, 9: 8, 11: 9, 13: 8, 15: 7, 17: 6, 19: 4, 22: 2 }),
    peerHours: hourly({ 8: 6, 9: 9, 11: 10, 13: 9, 15: 8, 17: 6, 19: 4, 22: 1 }),
  },
  'Tier 3': {
    groupSize: 234,
    groupLabel: 'Tier 3 individual accounts, ₦2M–10M monthly turnover',
    metrics: [
      { label: 'Monthly transaction frequency', unit: 'transactions/month', customerValue: 61, peerAverage: 47, peerMin: 8, peerMax: 240, percentile: 66, format: plain },
      { label: 'Average transaction amount', unit: 'per transaction', customerValue: 1_100_000, peerAverage: 940_000, peerMin: 60_000, peerMax: 3_200_000, percentile: 63, format: naira },
      { label: 'Unique counterparties per month', unit: 'counterparties/month', customerValue: 22, peerAverage: 19, peerMin: 3, peerMax: 72, percentile: 58, format: plain },
      { label: 'Average cash withdrawal amount', unit: 'per withdrawal', customerValue: 690_000, peerAverage: 780_000, peerMin: 50_000, peerMax: 5_000_000, percentile: 45, format: naira },
    ],
    customerHours: hourly({ 8: 5, 9: 8, 11: 9, 14: 8, 16: 7, 18: 5, 21: 3 }),
    peerHours: hourly({ 8: 6, 9: 9, 11: 10, 14: 9, 16: 8, 18: 5, 21: 2 }),
  },
};

const NIGHT_HOURS = [22, 23, 0, 1, 2, 3, 4, 5];

function nightShare(dist: number[]) {
  return NIGHT_HOURS.reduce((sum, h) => sum + dist[h], 0);
}

function MetricBar({ metric }: { metric: PeerMetric }) {
  const fmt = metric.format ?? plain;
  const span = Math.max(metric.peerMax - metric.peerMin, 1);
  const pos = (v: number) =>
    `${Math.min(100, Math.max(0, ((v - metric.peerMin) / span) * 100))}%`;
  const isOutlier = metric.percentile >= 90;

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-sm font-medium text-foreground">{metric.label}</p>
        <Badge
          variant="outline"
          className={
            isOutlier
              ? 'border-destructive/30 bg-destructive/10 text-destructive'
              : 'border-border text-muted-foreground'
          }
        >
          Top {100 - metric.percentile}% of peer group
        </Badge>
      </div>

      <div className="relative h-8">
        <div className="absolute top-3 h-2 w-full rounded-full bg-muted" />
        {/* peer average marker */}
        <div
          className="absolute top-1.5 h-5 w-0.5 bg-muted-foreground/70"
          style={{ left: pos(metric.peerAverage) }}
        />
        {/* customer dot */}
        <div
          className={`absolute top-1.5 h-5 w-5 -translate-x-1/2 rounded-full border-2 border-background ${
            isOutlier ? 'bg-destructive' : 'bg-primary'
          }`}
          style={{ left: pos(metric.customerValue) }}
        />
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span>
          This customer:{' '}
          <span className={`font-semibold ${isOutlier ? 'text-destructive' : 'text-foreground'}`}>
            {fmt(metric.customerValue)}
          </span>{' '}
          {metric.unit}
        </span>
        <span>
          Peer average: <span className="font-medium text-foreground">{fmt(metric.peerAverage)}</span>
        </span>
        <span className="tabular-nums">
          Range {fmt(metric.peerMin)} – {fmt(metric.peerMax)}
        </span>
      </div>
    </div>
  );
}

function HourHeatRow({
  label,
  dist,
  danger,
}: {
  label: string;
  dist: number[];
  danger?: boolean;
}) {
  const max = Math.max(...dist, 0.0001);
  return (
    <div className="flex items-center gap-2">
      <span className="w-24 shrink-0 text-[11px] text-muted-foreground">{label}</span>
      <div className="grid flex-1 grid-cols-24 gap-[2px]" style={{ gridTemplateColumns: 'repeat(24, minmax(0, 1fr))' }}>
        {dist.map((v, h) => {
          const intensity = v / max;
          const night = NIGHT_HOURS.includes(h);
          return (
            <div
              key={h}
              title={`${String(h).padStart(2, '0')}:00 — ${(v * 100).toFixed(1)}% of transactions`}
              className={`h-5 rounded-sm ${danger && night ? 'bg-destructive' : 'bg-primary'}`}
              style={{ opacity: 0.12 + intensity * 0.88 }}
            />
          );
        })}
      </div>
    </div>
  );
}

interface Props {
  customerId: number | string;
  customerName: string;
  kycTier: string;
}

export function PeerGroupAnalysis({ customerId, customerName, kycTier }: Props) {
  const profile = useMemo(
    () =>
      peerGroups[String(customerId)] ??
      defaultProfiles[kycTier] ??
      defaultProfiles['Tier 2'],
    [customerId, kycTier],
  );

  const customerNight = nightShare(profile.customerHours);
  const peerNight = nightShare(profile.peerHours);
  const nightFlag = customerNight >= 0.6 && peerNight <= 0.25;

  const outliers = profile.metrics.filter((m) => m.percentile >= 90);

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-base">
          <Users className="h-4 w-4 text-primary" />
          Peer Group Analysis — {profile.groupSize.toLocaleString()} similar customers
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Comparing against {kycTier} accounts with similar transaction volumes · {profile.groupLabel}
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {outliers.length > 0 && (
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
            <div className="flex gap-2">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
              <p className="text-xs leading-relaxed text-amber-800 dark:text-amber-200">
                <span className="font-semibold">Outlier detected:</span> {customerName}&apos;s{' '}
                {outliers.map((m) => m.label.toLowerCase()).join(' and ')}{' '}
                {outliers.length > 1 ? 'are' : 'is'} significantly higher than the peer group
                average. This may warrant enhanced due diligence.
              </p>
            </div>
          </div>
        )}

        <div className="space-y-5">
          {profile.metrics.map((m) => (
            <MetricBar key={m.label} metric={m} />
          ))}
        </div>

        <div className="space-y-3 border-t border-border pt-4">
          <div className="flex items-center justify-between gap-3">
            <p className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Clock className="h-4 w-4 text-muted-foreground" />
              Transaction time distribution (24h)
            </p>
            {nightFlag && (
              <Badge variant="outline" className="border-destructive/30 bg-destructive/10 text-destructive">
                {Math.round(customerNight * 100)}% overnight vs {Math.round(peerNight * 100)}% peers
              </Badge>
            )}
          </div>

          <div className="space-y-2">
            <HourHeatRow label="This customer" dist={profile.customerHours} danger={nightFlag} />
            <HourHeatRow label="Peer group" dist={profile.peerHours} />
            <div className="flex items-center gap-2">
              <span className="w-24 shrink-0" />
              <div className="flex flex-1 justify-between text-[10px] text-muted-foreground">
                <span>00</span><span>06</span><span>12</span><span>18</span><span>23</span>
              </div>
            </div>
          </div>

          {nightFlag && (
            <p className="text-xs text-destructive">
              {Math.round(customerNight * 100)}% of this customer&apos;s activity occurs between
              22:00 and 06:00, against a peer group average of {Math.round(peerNight * 100)}% —
              consistent with structuring or third-party account use.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
