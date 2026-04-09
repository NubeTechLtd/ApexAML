import { cn } from '@/lib/utils';
import { Clock } from 'lucide-react';
import type { AlertData } from '@/data/mockLegacyAlerts';
import { RiskScoreIndicator } from './RiskBadge';

function formatTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diffH = Math.floor((now.getTime() - d.getTime()) / 3600000);
  if (diffH < 1) return 'Just now';
  if (diffH < 24) return `${diffH}h ago`;
  return d.toLocaleDateString('en-NG', { day: 'numeric', month: 'short' });
}

const typeColors: Record<string, string> = {
  Structuring: 'bg-risk-critical/8 text-risk-critical',
  'PEP Match': 'bg-risk-high/8 text-risk-high',
  'Velocity Spike': 'bg-risk-high/8 text-risk-high',
  'Round-Tripping': 'bg-risk-medium/8 text-risk-medium',
  'Threshold Breach': 'bg-risk-medium/8 text-risk-medium',
  'Sanctions Hit': 'bg-risk-critical/8 text-risk-critical',
};

interface AlertCardProps {
  alert: AlertData;
  isSelected: boolean;
  onClick: () => void;
}

export function AlertCard({ alert, isSelected, onClick }: AlertCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left rounded-lg border p-3.5 transition-all duration-150 group',
        isSelected
          ? 'border-primary/30 bg-primary/[0.03] shadow-sm'
          : 'border-transparent bg-card hover:border-border hover:shadow-sm'
      )}
    >
      <div className="flex items-start gap-3">
        <RiskScoreIndicator score={alert.riskScore} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-foreground truncate">{alert.customerName}</h3>
            <span className={cn('shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium', typeColors[alert.alertType] || 'bg-muted text-muted-foreground')}>
              {alert.alertType}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{alert.id}</p>
          <div className="flex items-center gap-1.5 mt-2 text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span className="text-[11px]">{formatTime(alert.timestamp)}</span>
            <span className="text-[11px] ml-auto">₦{(alert.totalFlagged / 1000000).toFixed(1)}M flagged</span>
          </div>
        </div>
      </div>
    </button>
  );
}
