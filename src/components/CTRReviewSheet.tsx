import { useEffect, useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileOutput, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { CTRRow } from './CTRManagement';

interface TxRow {
  transaction_id: string;
  amount: number;
  channel: string;
  transaction_datetime: string;
  counterparty_account: string | null;
  narration: string | null;
  direction: string;
}

const formatNGN = (n: number) => '₦' + Math.round(Number(n)).toLocaleString('en-NG');

interface Props {
  row: CTRRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApprove: (row: CTRRow) => void | Promise<void>;
  filing: boolean;
}

export function CTRReviewSheet({ row, open, onOpenChange, onApprove, filing }: Props) {
  const [txns, setTxns] = useState<TxRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!row || !open) return;
    const ids = Array.isArray(row.transaction_ids)
      ? (row.transaction_ids as unknown as string[])
      : [];
    if (ids.length === 0) return;
    setLoading(true);
    supabase
      .from('transaction_queue')
      .select('transaction_id, amount, channel, transaction_datetime, counterparty_account, narration, direction')
      .in('transaction_id', ids)
      .order('transaction_datetime', { ascending: true })
      .then(({ data }) => {
        setTxns(
          (data ?? []).map(t => ({
            ...t,
            amount: Number(t.amount),
          })),
        );
        setLoading(false);
      });
  }, [row, open]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-base">Review CTR — {row?.customer_name ?? row?.customer_id}</SheetTitle>
          <SheetDescription className="text-xs">
            {row && (
              <>
                Cash transactions on {new Date(row.report_date).toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' })} exceeding the ₦5,000,000 CBN CTR threshold.
              </>
            )}
          </SheetDescription>
        </SheetHeader>

        {row && (
          <div className="mt-4 space-y-4">
            <div className="grid grid-cols-2 gap-3 rounded-lg border p-3">
              <Field label="Account (NUBAN)" value={row.customer_id} mono />
              <Field label="Customer" value={row.customer_name ?? '—'} />
              <Field label="Total cash" value={formatNGN(Number(row.total_cash_ngn))} highlight />
              <Field label="Transactions" value={String(row.transaction_count)} />
            </div>

            <div>
              <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-2">Transaction breakdown</p>
              {loading ? (
                <div className="flex items-center gap-2 text-xs text-muted-foreground p-4">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Loading transactions…
                </div>
              ) : (
                <div className="rounded-lg border divide-y">
                  {txns.map(t => (
                    <div key={t.transaction_id} className="p-2.5 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-mono truncate">{t.transaction_id}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {new Date(t.transaction_datetime).toLocaleString('en-NG', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          {' · '}
                          {t.channel}
                          {t.counterparty_account && ` · ${t.counterparty_account}`}
                        </p>
                        {t.narration && <p className="text-[10px] text-muted-foreground truncate italic">"{t.narration}"</p>}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant="outline" className="text-[10px] capitalize border-0 bg-muted">
                          {t.direction}
                        </Badge>
                        <span className="text-xs font-semibold whitespace-nowrap">{formatNGN(t.amount)}</span>
                      </div>
                    </div>
                  ))}
                  {txns.length === 0 && (
                    <p className="text-xs text-muted-foreground p-3">No transaction details found.</p>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t">
              <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} className="text-xs">Close</Button>
              <Button
                size="sm"
                disabled={filing}
                onClick={() => row && onApprove(row)}
                className="gap-1.5 text-xs"
              >
                <FileOutput className="h-3.5 w-3.5" />
                Approve & Generate CTR
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function Field({ label, value, mono, highlight }: { label: string; value: string; mono?: boolean; highlight?: boolean }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">{label}</p>
      <p className={`mt-0.5 text-xs ${mono ? 'font-mono' : ''} ${highlight ? 'font-semibold text-foreground' : ''}`}>{value}</p>
    </div>
  );
}
