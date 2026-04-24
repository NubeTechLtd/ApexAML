import { useEffect, useState } from 'react';
import { AlertOctagon, Globe2, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { countryFlagEmoji, type CrossBorderContext } from '@/data/mockAlerts';

interface Props {
  context: CrossBorderContext;
}

interface Remaining {
  expired: boolean;
  hours: number;
  minutes: number;
  seconds: number;
  totalMinutes: number;
}

function calcRemaining(flaggedAtISO: string): Remaining {
  const deadline = new Date(flaggedAtISO).getTime() + 1000 * 60 * 60 * 24;
  const diff = deadline - Date.now();
  if (diff <= 0) {
    return { expired: true, hours: 0, minutes: 0, seconds: 0, totalMinutes: 0 };
  }
  const totalMinutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3_600_000);
  const minutes = Math.floor((diff % 3_600_000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  return { expired: false, hours, minutes, seconds, totalMinutes };
}

export function CrossBorderSLACard({ context }: Props) {
  const [remaining, setRemaining] = useState<Remaining>(() => calcRemaining(context.overseasFlaggedAt));

  useEffect(() => {
    const id = window.setInterval(() => {
      setRemaining(calcRemaining(context.overseasFlaggedAt));
    }, 1000);
    return () => window.clearInterval(id);
  }, [context.overseasFlaggedAt]);

  const isCritical = !remaining.expired && remaining.hours < 4;
  const flaggedDisplay = new Date(context.overseasFlaggedAt).toLocaleString('en-NG', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  return (
    <Card
      className={cn(
        'w-full border-2 border-destructive/60 bg-destructive text-destructive-foreground shadow-lg',
        isCritical && 'animate-pulse'
      )}
      role="alert"
      aria-live="polite"
    >
      <CardContent className="py-4 px-5">
        <div className="flex items-start justify-between gap-6 flex-wrap">
          {/* Left: meta */}
          <div className="space-y-2 min-w-[260px]">
            <div className="flex items-center gap-2">
              <AlertOctagon className="h-4 w-4" />
              <span className="text-[11px] uppercase tracking-wider font-bold">
                Cross-Border SLA · NFIU 24h Filing Clock
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-3xl leading-none" aria-label={`${context.originatingCountry} flag`}>
                {countryFlagEmoji(context.originatingCountry)}
              </span>
              <div className="flex flex-col">
                <span className="text-[10px] uppercase opacity-80 tracking-wider">Overseas Reference</span>
                <span className="font-mono text-lg font-bold tracking-tight">
                  {context.overseasReferenceId}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <Globe2 className="h-3.5 w-3.5 opacity-90" />
              <span className="opacity-90">Flagged by</span>
              <span className="font-semibold">{context.overseasFlaggedBy}</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="bg-destructive-foreground/15 text-destructive-foreground border-destructive-foreground/30 text-[10px]">
                Reason: {context.overseasFlagReason}
              </Badge>
              <span className="text-[11px] opacity-80 inline-flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Clock started {flaggedDisplay}
              </span>
            </div>
          </div>

          {/* Right: countdown */}
          <div className="flex flex-col items-end gap-1 ml-auto">
            <span className="text-[10px] uppercase tracking-wider opacity-80">
              {remaining.expired ? 'Filing deadline breached' : 'Time remaining to file STR'}
            </span>
            {remaining.expired ? (
              <span className="font-mono text-5xl font-black leading-none tracking-tight">
                BREACHED
              </span>
            ) : (
              <div className="flex items-baseline gap-1 font-mono leading-none tabular-nums">
                <span className="text-6xl font-black tracking-tight">
                  {String(remaining.hours).padStart(2, '0')}
                </span>
                <span className="text-2xl font-bold opacity-80">h</span>
                <span className="text-6xl font-black tracking-tight ml-1">
                  {String(remaining.minutes).padStart(2, '0')}
                </span>
                <span className="text-2xl font-bold opacity-80">m</span>
                <span className="text-2xl font-bold opacity-60 ml-1 tabular-nums">
                  {String(remaining.seconds).padStart(2, '0')}s
                </span>
              </div>
            )}
            {isCritical && (
              <span className="text-[11px] font-bold uppercase tracking-wider mt-1">
                ⚠ Under 4 hours — escalate immediately
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
