import { cn } from '@/lib/utils';
import type { RiskLevel } from '@/data/mockAlerts';

const riskConfig: Record<RiskLevel, { bg: string; text: string; dot: string }> = {
  Critical: { bg: 'bg-risk-critical/10', text: 'text-risk-critical', dot: 'bg-risk-critical' },
  High: { bg: 'bg-risk-high/10', text: 'text-risk-high', dot: 'bg-risk-high' },
  Medium: { bg: 'bg-risk-medium/10', text: 'text-risk-medium', dot: 'bg-risk-medium' },
  Low: { bg: 'bg-risk-low/10', text: 'text-risk-low', dot: 'bg-risk-low' },
};

export function RiskBadge({ level, className }: { level: RiskLevel; className?: string }) {
  const config = riskConfig[level];
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium', config.bg, config.text, className)}>
      <span className={cn('h-1.5 w-1.5 rounded-full', config.dot)} />
      {level}
    </span>
  );
}

export function RiskScoreIndicator({ score }: { score: number }) {
  const getColor = (s: number) => {
    if (s >= 80) return 'text-risk-critical';
    if (s >= 60) return 'text-risk-high';
    if (s >= 40) return 'text-risk-medium';
    return 'text-risk-low';
  };
  const getBg = (s: number) => {
    if (s >= 80) return 'bg-risk-critical';
    if (s >= 60) return 'bg-risk-high';
    if (s >= 40) return 'bg-risk-medium';
    return 'bg-risk-low';
  };

  return (
    <div className="flex flex-col items-center gap-1">
      <span className={cn('text-lg font-bold tabular-nums', getColor(score))}>{score}</span>
      <div className="h-1 w-10 rounded-full bg-muted overflow-hidden">
        <div className={cn('h-full rounded-full transition-all', getBg(score))} style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}
