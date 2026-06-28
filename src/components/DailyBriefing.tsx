import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Clock, Fingerprint, CheckCircle2, ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { mockAlerts } from '@/data/mockAlerts';
import { mockKYCCustomers } from '@/data/mockKYC';

type Item = {
  count: number;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick: () => void;
  borderColor: string;
  iconColor: string;
};

export function DailyBriefing() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const firstName = useMemo(() => {
    const meta = (user?.user_metadata as Record<string, unknown> | undefined) || {};
    const candidate =
      (typeof meta.full_name === 'string' && meta.full_name) ||
      (typeof meta.name === 'string' && meta.name) ||
      (user?.email ? user.email.split('@')[0] : '');
    if (!candidate) return 'Compliance Officer';
    return String(candidate).split(/[\s.]/)[0].replace(/^./, (c) => c.toUpperCase());
  }, [user]);

  const now = new Date();
  const dateStr = now.toLocaleDateString('en-NG', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Africa/Lagos',
  });
  const timeStr = now.toLocaleTimeString('en-NG', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Africa/Lagos',
  });

  const criticalCount = mockAlerts.filter((a) => a.riskLevel === 'Critical' && a.status === 'Open').length;
  const strDueCount = mockAlerts.filter((a) => a.status === 'Escalated').length;
  const kycPendingCount = mockKYCCustomers.filter((c) => c.status === 'Pending' || c.status === 'In Review').length;
  const overdueCount = 0;

  const complianceScore = 78;

  const items: Item[] = [
    {
      count: criticalCount,
      label: `${criticalCount} Critical alert${criticalCount === 1 ? '' : 's'} need your attention`,
      icon: AlertTriangle,
      onClick: () => navigate('/alerts?severity=Critical'),
      borderColor: 'border-l-[hsl(var(--risk-critical))]',
      iconColor: 'text-[hsl(var(--risk-critical))]',
    },
    {
      count: strDueCount,
      label: `${strDueCount} STR filing${strDueCount === 1 ? '' : 's'} due today (CBN 24-hour mandate)`,
      icon: Clock,
      onClick: () => navigate('/alerts?filter=str_pending'),
      borderColor: 'border-l-[hsl(var(--risk-medium))]',
      iconColor: 'text-[hsl(var(--risk-medium))]',
    },
    {
      count: kycPendingCount,
      label: `${kycPendingCount} KYC verification${kycPendingCount === 1 ? '' : 's'} in your queue`,
      icon: Fingerprint,
      onClick: () => navigate('/kyc'),
      borderColor: 'border-l-blue-500',
      iconColor: 'text-blue-500',
    },
    {
      count: overdueCount,
      label: overdueCount === 0 ? 'You are on track ✓' : `${overdueCount} overdue items`,
      icon: CheckCircle2,
      onClick: () => navigate('/alerts?status=Open'),
      borderColor: 'border-l-[hsl(var(--risk-low))]',
      iconColor: 'text-[hsl(var(--risk-low))]',
    },
  ];

  return (
    <Card
      className="relative overflow-hidden border border-border bg-gradient-to-br from-muted/40 to-transparent shadow-sm"
      style={{ borderLeft: '2px solid #D4A843' }}
    >
      <div className="p-6 space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Good morning, {firstName}</h2>
            <p className="text-xs text-muted-foreground">Your daily compliance briefing</p>
          </div>
          <div className="text-xs text-muted-foreground tabular-nums">
            {dateStr} · {timeStr} WAT
          </div>
        </div>

        {/* Priority items 2x2 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {items.map((item, idx) => {
            const Icon = item.icon;
            const isOnTrack = idx === 3 && item.count === 0;
            return (
              <button
                key={idx}
                onClick={item.onClick}
                className={`group flex items-center gap-3 rounded-md border border-border border-l-4 ${item.borderColor} bg-background/60 hover:bg-background transition-colors px-4 py-3 text-left`}
              >
                <Icon className={`h-5 w-5 shrink-0 ${item.iconColor}`} />
                <span
                  className={`text-sm font-medium flex-1 ${
                    isOnTrack ? 'text-[hsl(var(--risk-low))]' : 'text-foreground'
                  }`}
                >
                  {item.label}
                </span>
                <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            );
          })}
        </div>

        {/* CBN Compliance Score */}
        <div className="rounded-md border border-border bg-background/40 p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">CBN Compliance Score</span>
            <span className="text-2xl font-bold text-foreground tabular-nums">
              {complianceScore}<span className="text-sm text-muted-foreground font-normal">/100</span>
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${complianceScore}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            3 capability areas need attention — model validation overdue for 2 rules, adverse media scanner not yet active.
          </p>
          <button
            onClick={() => navigate('/regulatory-reports')}
            className="text-xs font-medium text-primary hover:underline inline-flex items-center gap-1"
          >
            View compliance gaps <ArrowRight className="h-3 w-3" />
          </button>
        </div>
      </div>
    </Card>
  );
}

export default DailyBriefing;
