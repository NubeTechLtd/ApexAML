import { useEffect, useState } from 'react';
import { Globe2, Clock, AlertOctagon, ArrowUpRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface IncomingAlert {
  id: string;
  origin: string;          // e.g. "WorldRemit UK"
  flag: string;            // emoji
  reference: string;       // overseas reference id
  reason: string;          // short reason
  flaggedAt: number;       // ms timestamp clock started
}

// Mock incoming alerts — clocks set so each demos a different urgency band.
const NOW = () => Date.now();
const MOCK_ALERTS: IncomingAlert[] = [
  {
    id: 'wr-uk-8821',
    origin: 'WorldRemit UK',
    flag: '🇬🇧',
    reference: 'WR-UK-2026-8821',
    reason: 'Smurfing pattern · 47 senders → 1 NG payee',
    flaggedAt: NOW() - 1000 * 60 * 60 * 5.8, // ~18h 12m left
  },
  {
    id: 'tg-eu-1142',
    origin: 'TransferGo Europe',
    flag: '🇩🇪',
    reference: 'TG-EU-2026-1142',
    reason: 'Sanctioned-corridor velocity (Russia adjacency)',
    flaggedAt: NOW() - 1000 * 60 * 60 * 13.2, // ~10h 48m left
  },
  {
    id: 'rmt-ca-0339',
    origin: 'Remitly Canada',
    flag: '🇨🇦',
    reference: 'RMT-CA-2026-0339',
    reason: 'PEP-linked beneficiary · Lagos cash payout',
    flaggedAt: NOW() - 1000 * 60 * 60 * 20.5, // ~3h 30m left → critical
  },
];

interface Remaining {
  expired: boolean;
  hours: number;
  minutes: number;
  seconds: number;
  pctElapsed: number;
}

function calcRemaining(flaggedAt: number): Remaining {
  const deadline = flaggedAt + 1000 * 60 * 60 * 24;
  const diff = deadline - Date.now();
  const totalSpan = 1000 * 60 * 60 * 24;
  const elapsed = totalSpan - Math.max(0, diff);
  const pctElapsed = Math.min(100, Math.max(0, (elapsed / totalSpan) * 100));
  if (diff <= 0) return { expired: true, hours: 0, minutes: 0, seconds: 0, pctElapsed: 100 };
  return {
    expired: false,
    hours: Math.floor(diff / 3_600_000),
    minutes: Math.floor((diff % 3_600_000) / 60000),
    seconds: Math.floor((diff % 60000) / 1000),
    pctElapsed,
  };
}

function CountdownRow({ alert }: { alert: IncomingAlert }) {
  const [remaining, setRemaining] = useState<Remaining>(() => calcRemaining(alert.flaggedAt));

  useEffect(() => {
    const id = window.setInterval(() => setRemaining(calcRemaining(alert.flaggedAt)), 1000);
    return () => window.clearInterval(id);
  }, [alert.flaggedAt]);

  const critical = !remaining.expired && remaining.hours < 4;
  const warning = !critical && !remaining.expired && remaining.hours < 8;

  return (
    <div
      className={cn(
        'rounded-lg border p-3 transition-colors',
        remaining.expired
          ? 'border-destructive/60 bg-destructive/10'
          : critical
            ? 'border-destructive/50 bg-destructive/5'
            : warning
              ? 'border-amber-500/40 bg-amber-500/5'
              : 'border-border bg-card',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-base leading-none" aria-hidden>{alert.flag}</span>
            <p className="text-sm font-semibold truncate">{alert.origin}</p>
            <Badge
              variant="outline"
              className="text-[9px] font-mono px-1.5 py-0 h-4 shrink-0"
            >
              {alert.reference}
            </Badge>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1 leading-snug">
            {alert.reason}
          </p>
        </div>

        <div className="text-right shrink-0">
          <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">
            {remaining.expired ? 'Breached' : 'Remaining'}
          </p>
          {remaining.expired ? (
            <p className="font-mono text-base font-black text-destructive tracking-tight">
              BREACHED
            </p>
          ) : (
            <p
              className={cn(
                'font-mono text-base font-bold tabular-nums leading-tight',
                critical && 'text-destructive animate-pulse',
                warning && 'text-amber-500',
                !critical && !warning && 'text-foreground',
              )}
            >
              {remaining.hours}h {String(remaining.minutes).padStart(2, '0')}m
            </p>
          )}
        </div>
      </div>

      {/* SLA progress bar */}
      <div className="mt-2.5 h-1 rounded-full bg-muted overflow-hidden">
        <div
          className={cn(
            'h-full transition-[width] duration-1000 ease-linear',
            critical || remaining.expired
              ? 'bg-destructive'
              : warning
                ? 'bg-amber-500'
                : 'bg-primary',
          )}
          style={{ width: `${remaining.pctElapsed}%` }}
        />
      </div>
    </div>
  );
}

export function CrossBorder24hTicker() {
  return (
    <Card className="border-destructive/30">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertOctagon className="h-4 w-4 text-destructive" />
              Cross-Border 24h STR Mandate
            </CardTitle>
            <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1.5">
              <Globe2 className="h-3 w-3" />
              CBN requires overseas-flagged alerts filed locally within 24 hours
            </p>
          </div>
          <Badge
            variant="outline"
            className="text-[10px] gap-1 border-destructive/40 text-destructive bg-destructive/5 shrink-0"
          >
            <Clock className="h-3 w-3" />
            Live · {MOCK_ALERTS.length} pending
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {MOCK_ALERTS.map((a) => (
          <CountdownRow key={a.id} alert={a} />
        ))}
        <button
          type="button"
          className="w-full mt-1 flex items-center justify-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors py-1"
        >
          View NFIU goAML queue
          <ArrowUpRight className="h-3 w-3" />
        </button>
      </CardContent>
    </Card>
  );
}
