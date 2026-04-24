import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertOctagon, Bell, Building2, Banknote } from 'lucide-react';
import { toast } from 'sonner';
import type { Alert } from '@/data/mockAlerts';

/**
 * Commingling alert card — shown when a non-approved entity credits a
 * tagged IMTO Settlement Account. May 2026 CBN Circular violation.
 */
export function CommingleAlertCard({ alert }: { alert: Alert }) {
  const ctx = alert.commingling;
  if (!ctx) return null;

  const handleNotify = () => {
    toast.success('Partner Bank Compliance Officer notified', {
      description: `${ctx.partnerBank} CO informed of suspected commingling on ${ctx.settlementAccountNuban}. A signed acknowledgement is required within 4h.`,
    });
  };

  return (
    <Card className="border-2 border-destructive bg-destructive/5">
      <CardContent className="p-5 space-y-4">
        <div className="flex items-start gap-3">
          <AlertOctagon className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-semibold text-destructive">
                Non-Remittance Credit Detected
              </p>
              <Badge
                variant="outline"
                className="text-[10px] font-semibold bg-destructive/10 text-destructive border-destructive/40"
              >
                Critical
              </Badge>
              <Badge
                variant="outline"
                className="text-[10px] font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/40"
              >
                May 2026 CBN Circular
              </Badge>
            </div>
            <p className="text-xs text-foreground/80 leading-relaxed">
              Potential commingling of operating funds with regulated
              remittance settlement account.{' '}
              <span className="font-medium">
                Partner bank holds joint liability under the May 2026 CBN
                Circular.
              </span>
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-md border bg-card p-3 space-y-1">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Source entity (unapproved)
            </p>
            <p className="text-sm font-semibold text-destructive truncate">
              {ctx.sourceEntity}
            </p>
            <p className="text-[10px] text-muted-foreground">
              Not in approved correspondent list
            </p>
          </div>
          <div className="rounded-md border bg-card p-3 space-y-1">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Credit amount
            </p>
            <p className="text-sm font-semibold text-foreground">
              ₦{ctx.amountNGN.toLocaleString('en-NG')}
            </p>
            <p className="text-[10px] text-muted-foreground">
              {new Date(ctx.creditedAt).toLocaleString('en-NG', {
                day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
              })}
            </p>
          </div>
          <div className="rounded-md border bg-card p-3 space-y-1">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Settlement account
            </p>
            <div className="flex items-center gap-1.5">
              <Banknote className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
              <p className="text-sm font-mono">{ctx.settlementAccountNuban}</p>
            </div>
            <p className="text-[10px] text-muted-foreground">
              {ctx.imtoName} · {ctx.cbnLicenceNumber}
            </p>
          </div>
          <div className="rounded-md border bg-card p-3 space-y-1">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Partner bank
            </p>
            <div className="flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5 text-primary" />
              <p className="text-sm font-semibold">{ctx.partnerBank}</p>
            </div>
            <p className="text-[10px] text-muted-foreground">
              CO: {ctx.partnerBankCO}
            </p>
          </div>
        </div>

        <Button
          onClick={handleNotify}
          className="w-full gap-2"
          variant="destructive"
        >
          <Bell className="h-4 w-4" />
          Notify Partner Bank Compliance Officer
        </Button>
      </CardContent>
    </Card>
  );
}
