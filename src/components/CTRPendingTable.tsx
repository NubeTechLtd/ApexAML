import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { AlertTriangle, FileOutput, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { generateCtrXml, nextCtrReference } from '@/lib/generateCTRXml';
import { CTRReviewSheet } from './CTRReviewSheet';
import type { CTRRow } from './CTRManagement';

const formatNGN = (n: number) => '₦' + Math.round(Number(n)).toLocaleString('en-NG');

function hoursSince(iso: string): number {
  return (Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60);
}

interface Props {
  rows: CTRRow[];
  allRows: CTRRow[];
  onRefresh: () => void;
}

export function CTRPendingTable({ rows, allRows, onRefresh }: Props) {
  const [reviewing, setReviewing] = useState<CTRRow | null>(null);
  const [filingId, setFilingId] = useState<string | null>(null);

  const handleApprove = async (row: CTRRow) => {
    setFilingId(row.id);
    try {
      const ids = Array.isArray(row.transaction_ids)
        ? (row.transaction_ids as unknown as string[])
        : [];
      const { data: txns, error: txErr } = await supabase
        .from('transaction_queue')
        .select('transaction_id, amount, channel, transaction_datetime, counterparty_account, narration, direction')
        .in('transaction_id', ids);
      if (txErr) throw txErr;

      const reference = nextCtrReference(
        allRows.map(r => r.ctr_reference).filter(Boolean) as string[],
      );
      const xml = generateCtrXml(row, (txns ?? []).map(t => ({
        ...t,
        amount: Number(t.amount),
      })), reference);

      const { data: userData } = await supabase.auth.getUser();
      const { error: upErr } = await supabase
        .from('ctr_queue')
        .update({
          status: 'filed',
          ctr_reference: reference,
          filed_at: new Date().toISOString(),
          goaml_xml: xml,
          reviewed_by: userData.user?.id ?? null,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', row.id);
      if (upErr) throw upErr;

      toast({
        title: 'CTR filed',
        description: `${reference} generated in NFIU goAML format. Ready for upload.`,
      });
      onRefresh();
    } catch (e) {
      console.error(e);
      toast({
        title: 'Failed to file CTR',
        description: e instanceof Error ? e.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setFilingId(null);
    }
  };

  if (rows.length === 0) {
    return (
      <div className="rounded-lg border p-8 text-center">
        <p className="text-xs text-muted-foreground">
          No pending CTRs. The daily scan runs at 23:50 WAT and will flag any account whose cash transactions exceed ₦5,000,000.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-lg border overflow-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="text-[10px] uppercase tracking-wider font-semibold">Date</TableHead>
              <TableHead className="text-[10px] uppercase tracking-wider font-semibold">Customer</TableHead>
              <TableHead className="text-[10px] uppercase tracking-wider font-semibold">Account</TableHead>
              <TableHead className="text-[10px] uppercase tracking-wider font-semibold text-right">Total Cash</TableHead>
              <TableHead className="text-[10px] uppercase tracking-wider font-semibold text-center">Txns</TableHead>
              <TableHead className="text-[10px] uppercase tracking-wider font-semibold text-center">Age</TableHead>
              <TableHead className="text-[10px] uppercase tracking-wider font-semibold text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map(r => {
              const age = hoursSince(r.created_at);
              const urgent = age > 48;
              return (
                <TableRow key={r.id}>
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(r.report_date).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </TableCell>
                  <TableCell className="text-xs font-medium text-foreground">{r.customer_name ?? '—'}</TableCell>
                  <TableCell className="text-xs font-mono text-muted-foreground">{r.customer_id}</TableCell>
                  <TableCell className="text-xs font-semibold text-foreground text-right">{formatNGN(Number(r.total_cash_ngn))}</TableCell>
                  <TableCell className="text-xs text-center text-muted-foreground">{r.transaction_count}</TableCell>
                  <TableCell className="text-center">
                    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold ${urgent ? 'text-[hsl(var(--risk-medium))]' : 'text-muted-foreground'}`}>
                      {urgent && <AlertTriangle className="h-3 w-3" />}
                      {Math.round(age)}h
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button size="sm" variant="outline" onClick={() => setReviewing(r)} className="h-7 gap-1 text-xs">
                        <Eye className="h-3 w-3" />
                        Review
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleApprove(r)}
                        disabled={filingId === r.id}
                        className="h-7 gap-1 text-xs"
                      >
                        <FileOutput className="h-3 w-3" />
                        {filingId === r.id ? 'Filing…' : 'Approve & Generate CTR'}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <CTRReviewSheet
        row={reviewing}
        open={!!reviewing}
        onOpenChange={o => !o && setReviewing(null)}
        onApprove={async r => {
          setReviewing(null);
          await handleApprove(r);
        }}
        filing={filingId !== null}
      />
    </>
  );
}

