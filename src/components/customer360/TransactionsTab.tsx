import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TrendingUp, Hash, AlertTriangle } from 'lucide-react';
import type { Customer360Data } from '@/data/mockCustomer360';
import { mockLegacyAlerts as mockAlerts } from '@/data/mockLegacyAlerts';

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(amount);
}

interface Props {
  customer: Customer360Data;
}

export function TransactionsTab({ customer }: Props) {
  const customerAlerts = useMemo(
    () => mockAlerts.filter(a => a.customerName.toLowerCase().includes(customer.name.split(' ')[0].toLowerCase())),
    [customer.name]
  );

  const allTx = useMemo(() => {
    return customerAlerts
      .flatMap(a => a.transactionTimeline)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 20);
  }, [customerAlerts]);

  // Metrics
  const volume30d = useMemo(() => allTx.reduce((s, tx) => s + tx.amount, 0), [allTx]);
  const flaggedCount = useMemo(() => allTx.filter(tx => tx.flagReason).length, [allTx]);
  const flaggedPct = allTx.length > 0 ? Math.round((flaggedCount / allTx.length) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4 pb-3 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">Volume (30d)</p>
              <p className="text-lg font-bold text-foreground">{formatCurrency(volume30d)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
              <Hash className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">Tx Count</p>
              <p className="text-lg font-bold text-foreground">{allTx.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">Flagged %</p>
              <p className="text-lg font-bold text-foreground">{flaggedPct}%</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transaction Table */}
      <Card>
        <CardContent className="pt-4">
          {allTx.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Channel</TableHead>
                  <TableHead className="text-right">Amount ₦</TableHead>
                  <TableHead>Counterparty</TableHead>
                  <TableHead>Risk Flag</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allTx.map(tx => (
                  <TableRow key={tx.id}>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(tx.date).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </TableCell>
                    <TableCell className="text-sm">{tx.channel}</TableCell>
                    <TableCell className="text-right font-mono text-sm">{formatCurrency(tx.amount)}</TableCell>
                    <TableCell className="text-sm truncate max-w-[200px]">{tx.counterparty}</TableCell>
                    <TableCell>
                      {tx.flagReason ? (
                        <Badge variant="outline" className="text-[10px] bg-destructive/10 text-destructive border-destructive/20">
                          {tx.flagReason}
                        </Badge>
                      ) : (
                        <span className="text-[10px] text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-muted-foreground py-8 text-center">No transaction history available</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
