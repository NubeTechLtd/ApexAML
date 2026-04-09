import { cn } from '@/lib/utils';
import { ArrowDownLeft, ArrowUpRight, AlertTriangle } from 'lucide-react';
import type { TransactionEvent } from '@/data/mockAlerts';
import { motion } from 'framer-motion';

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(amount);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export function TransactionTimeline({ events }: { events: TransactionEvent[] }) {
  return (
    <div className="relative">
      <div className="absolute left-[19px] top-2 bottom-2 w-px bg-border" />
      <div className="space-y-1">
        {events.map((event, i) => {
          const isCredit = event.type === 'Credit';
          return (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              className="relative flex items-start gap-3 rounded-lg p-2.5 hover:bg-muted/50 transition-colors"
            >
              <div className={cn(
                'relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border',
                isCredit ? 'border-risk-low/30 bg-risk-low/10' : 'border-risk-high/30 bg-risk-high/10'
              )}>
                {isCredit
                  ? <ArrowDownLeft className="h-4 w-4 text-risk-low" />
                  : <ArrowUpRight className="h-4 w-4 text-risk-high" />
                }
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-foreground">{event.type} — {event.channel}</span>
                  <span className={cn('text-sm font-semibold tabular-nums', isCredit ? 'text-risk-low' : 'text-foreground')}>
                    {isCredit ? '+' : '-'}{formatCurrency(event.amount)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">{event.counterparty}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[11px] text-muted-foreground">{formatDate(event.date)}</span>
                  {event.flagReason && (
                    <span className="inline-flex items-center gap-1 rounded bg-risk-high/10 px-1.5 py-0.5 text-[10px] font-medium text-risk-high">
                      <AlertTriangle className="h-2.5 w-2.5" />
                      {event.flagReason}
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
