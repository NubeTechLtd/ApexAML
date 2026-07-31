import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TRIGGER_LABELS, type RiskScoreEntry } from '@/hooks/useRiskScoreHistory';

const riskColors: Record<string, string> = {
  High: 'bg-[hsl(var(--risk-critical)/0.1)] text-[hsl(var(--risk-critical))] border-[hsl(var(--risk-critical)/0.2)]',
  Medium: 'bg-[hsl(var(--risk-medium)/0.1)] text-[hsl(var(--risk-medium))] border-[hsl(var(--risk-medium)/0.2)]',
  Low: 'bg-[hsl(var(--risk-low)/0.1)] text-[hsl(var(--risk-low))] border-[hsl(var(--risk-low)/0.2)]',
};

function levelFor(score: number): 'High' | 'Medium' | 'Low' {
  if (score >= 70) return 'High';
  if (score >= 40) return 'Medium';
  return 'Low';
}

interface Props {
  score: number;
  /** Most recent scoring event — drives the trend indicator and tooltip. */
  latest: RiskScoreEntry | null;
  /** Risk level from the customer record, used when no scoring event exists. */
  fallbackLevel?: string;
  className?: string;
}

export function DynamicRiskScoreBadge({ score, latest, fallbackLevel, className }: Props) {
  const level = latest ? levelFor(score) : (fallbackLevel ?? levelFor(score));
  const change = latest?.scoreChange ?? null;
  const hasChange = change !== null && change !== 0;

  const trendColor =
    change === null || change === 0
      ? 'text-muted-foreground'
      : change > 0
        ? 'text-[hsl(var(--risk-critical))]'
        : 'text-[hsl(var(--risk-low))]';

  const TrendIcon = change === null || change === 0 ? Minus : change > 0 ? TrendingUp : TrendingDown;

  const changedOn = latest
    ? new Date(latest.createdAt).toLocaleDateString('en-NG', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : null;

  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn('flex items-center gap-2', className)}>
            <Badge variant="outline" className={cn('text-sm px-3 py-1', riskColors[level])}>
              Risk: {level.toUpperCase()} ({score}/100)
            </Badge>
            <span
              className={cn(
                'inline-flex items-center gap-0.5 text-xs font-semibold tabular-nums',
                trendColor,
              )}
              aria-label={
                hasChange
                  ? `Score ${change! > 0 ? 'increased' : 'decreased'} by ${Math.abs(change!)}`
                  : 'Score unchanged'
              }
            >
              <TrendIcon className="h-3.5 w-3.5" />
              {hasChange ? `${change! > 0 ? '+' : '−'}${Math.abs(change!)}` : 'No change'}
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs text-xs leading-relaxed">
          {latest && latest.previousScore !== null ? (
            <>
              Score changed from <strong>{latest.previousScore}</strong> to{' '}
              <strong>{latest.newScore}</strong> on {changedOn} — reason:{' '}
              {TRIGGER_LABELS[latest.triggerType]}.
            </>
          ) : (
            <>Baseline score of {score}/100 — no scoring movement recorded yet.</>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
