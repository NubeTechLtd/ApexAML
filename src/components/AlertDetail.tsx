import { User, CreditCard, ShieldCheck, AlertTriangle, FileWarning, MessageSquare, XCircle } from 'lucide-react';
import type { AlertData } from '@/data/mockAlerts';
import { RiskBadge } from './RiskBadge';
import { TransactionTimeline } from './TransactionTimeline';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(amount);
}

export function AlertDetail({ alert }: { alert: AlertData }) {
  const { toast } = useToast();

  const handleAction = (action: string) => {
    toast({
      title: `${action} — ${alert.id}`,
      description: `Action "${action}" has been recorded for ${alert.customerName}.`,
    });
  };

  return (
    <motion.div
      key={alert.id}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="h-full overflow-y-auto scrollbar-thin"
    >
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold text-foreground">{alert.id}</h2>
              <RiskBadge level={alert.riskLevel} />
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">{alert.alertType} Alert</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Total Flagged</p>
            <p className="text-lg font-bold text-foreground tabular-nums">{formatCurrency(alert.totalFlagged)}</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Alert Summary */}
        <div className="rounded-lg border bg-risk-high/[0.03] border-risk-high/20 p-4">
          <div className="flex gap-2">
            <AlertTriangle className="h-4 w-4 text-risk-high shrink-0 mt-0.5" />
            <p className="text-sm text-foreground leading-relaxed">{alert.summary}</p>
          </div>
        </div>

        {/* Customer Profile */}
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Customer Profile</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: User, label: 'Name', value: alert.customerName },
              { icon: CreditCard, label: 'BVN', value: alert.bvn },
              { icon: ShieldCheck, label: 'KYC Status', value: alert.kycTier },
              { icon: CreditCard, label: 'Account', value: alert.accountNumber },
            ].map((item) => (
              <div key={item.label} className="flex items-start gap-2.5 rounded-lg border bg-card p-3">
                <item.icon className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                <div>
                  <p className="text-[11px] text-muted-foreground">{item.label}</p>
                  <p className="text-sm font-medium text-foreground">{item.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Transaction Timeline */}
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            Transaction Timeline ({alert.transactionTimeline.length} events)
          </h3>
          <TransactionTimeline events={alert.transactionTimeline} />
        </div>

        <Separator />

        {/* Take Action */}
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Take Action</h3>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => handleAction('Dismissed')}
            >
              <XCircle className="h-3.5 w-3.5" />
              Dismiss
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => handleAction('Request Info')}
            >
              <MessageSquare className="h-3.5 w-3.5" />
              Request Info
            </Button>
            <Button
              size="sm"
              className="gap-1.5 bg-risk-critical text-risk-critical-foreground hover:bg-risk-critical/90"
              onClick={() => handleAction('Escalate to STR')}
            >
              <FileWarning className="h-3.5 w-3.5" />
              Escalate to STR
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
