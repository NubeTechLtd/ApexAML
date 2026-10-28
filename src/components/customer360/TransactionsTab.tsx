import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TrendingUp, Hash, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Customer360Data } from '@/data/models/customer360';
import { channelLabel, transactionsFor } from '@/data-layer/seed/views';

function formatCurrency(amount: number) {
  return '₦' + amount.toLocaleString('en-NG');
}

const CHANNELS = ['POS', 'Mobile', 'USSD', 'ATM', 'Internet Banking', 'Branch', 'IMTO'] as const;

/** The customer's own transactions from the shared sample dataset, newest first. */
function customerTransactions(customer: Customer360Data) {
  return transactionsFor(customer.id).map((t) => ({
    id: t.id,
    date: t.date,
    channel: channelLabel(t.channel),
    amount: t.type === 'Debit' ? -t.amountNGN : t.amountNGN,
    counterparty: t.counterparty,
    balance: t.balanceAfter,
    flag: t.flagReason ?? null,
  }));
}

interface Props {
  customer: Customer360Data;
}

export function TransactionsTab({ customer }: Props) {
  const allTx = useMemo(() => customerTransactions(customer), [customer]);
  const [activeChannels, setActiveChannels] = useState<Set<string>>(new Set());

  const filtered = activeChannels.size === 0 ? allTx : allTx.filter(tx => activeChannels.has(tx.channel));

  const volume30d = useMemo(() => allTx.filter(tx => Date.now() - new Date(tx.date).getTime() <= 30 * 86_400_000).reduce((s, tx) => s + Math.abs(tx.amount), 0), [allTx]);
  const flaggedCount = useMemo(() => allTx.filter(tx => tx.flag).length, [allTx]);
  const flaggedPct = allTx.length > 0 ? Math.round((flaggedCount / allTx.length) * 100) : 0;

  const toggleChannel = (ch: string) => {
    setActiveChannels(prev => {
      const next = new Set(prev);
      if (next.has(ch)) next.delete(ch); else next.add(ch);
      return next;
    });
  };

  return (
    <div className="space-y-4">
      {/* Metric Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4 pb-3 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">Total Volume (30d)</p>
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
              <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">Transactions Count</p>
              <p className="text-lg font-bold text-foreground">{allTx.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[hsl(var(--risk-critical)/0.1)]">
              <AlertTriangle className="h-5 w-5 text-[hsl(var(--risk-critical))]" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">Flagged %</p>
              <p className="text-lg font-bold text-foreground">{flaggedPct}%</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Channel filter chips */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-muted-foreground font-medium">Channel:</span>
        {CHANNELS.map(ch => (
          <button
            key={ch}
            onClick={() => toggleChannel(ch)}
            className={cn(
              'inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium border transition-colors',
              activeChannels.has(ch)
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-card text-muted-foreground border-border hover:border-primary/40'
            )}
          >
            {ch}
          </button>
        ))}
        {activeChannels.size > 0 && (
          <button onClick={() => setActiveChannels(new Set())} className="text-[11px] text-primary hover:underline">
            Clear
          </button>
        )}
      </div>

      {/* Transaction Table */}
      <Card>
        <CardContent className="pt-4">
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="text-xs">Date</TableHead>
                  <TableHead className="text-xs">Channel</TableHead>
                  <TableHead className="text-xs text-right">Amount (₦)</TableHead>
                  <TableHead className="text-xs">Counterparty</TableHead>
                  <TableHead className="text-xs text-right">Running Balance</TableHead>
                  <TableHead className="text-xs">Risk Flag</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(tx => (
                  <TableRow key={tx.id}>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(tx.date).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px] font-normal">{tx.channel}</Badge>
                    </TableCell>
                    <TableCell className={cn('text-sm text-right font-mono font-medium', tx.amount < 0 ? 'text-[hsl(var(--risk-critical))]' : 'text-[hsl(var(--risk-low))]')}>
                      {tx.amount < 0 ? '-' : '+'}{formatCurrency(Math.abs(tx.amount))}
                    </TableCell>
                    <TableCell className="text-xs text-foreground truncate max-w-[160px]">{tx.counterparty}</TableCell>
                    <TableCell className="text-xs text-right font-mono text-muted-foreground">{formatCurrency(tx.balance)}</TableCell>
                    <TableCell>
                      {tx.flag ? (
                        <Badge variant="outline" className="text-[10px] bg-[hsl(var(--risk-critical)/0.1)] text-[hsl(var(--risk-critical))] border-[hsl(var(--risk-critical)/0.2)]">
                          {tx.flag}
                        </Badge>
                      ) : (
                        <span className="text-[10px] text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
