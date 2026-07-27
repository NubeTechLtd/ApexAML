import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { downloadXmlFile } from '@/lib/generateGoAMLXml';
import { toast } from '@/hooks/use-toast';
import type { CTRRow } from './CTRManagement';

const formatNGN = (n: number) => '₦' + Math.round(Number(n)).toLocaleString('en-NG');

export function CTRFiledTable({ rows }: { rows: CTRRow[] }) {
  if (rows.length === 0) {
    return (
      <div className="rounded-lg border p-8 text-center">
        <p className="text-xs text-muted-foreground">No CTRs have been filed yet.</p>
      </div>
    );
  }

  const handleDownload = (r: CTRRow) => {
    if (!r.goaml_xml || !r.ctr_reference) {
      toast({ title: 'XML unavailable', variant: 'destructive' });
      return;
    }
    downloadXmlFile(r.goaml_xml, `${r.ctr_reference}.xml`);
  };

  return (
    <div className="rounded-lg border overflow-auto">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="text-[10px] uppercase tracking-wider font-semibold">Reference</TableHead>
            <TableHead className="text-[10px] uppercase tracking-wider font-semibold">Report Date</TableHead>
            <TableHead className="text-[10px] uppercase tracking-wider font-semibold">Filed</TableHead>
            <TableHead className="text-[10px] uppercase tracking-wider font-semibold">Customer</TableHead>
            <TableHead className="text-[10px] uppercase tracking-wider font-semibold">Account</TableHead>
            <TableHead className="text-[10px] uppercase tracking-wider font-semibold text-right">Amount</TableHead>
            <TableHead className="text-[10px] uppercase tracking-wider font-semibold text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map(r => (
            <TableRow key={r.id}>
              <TableCell className="text-xs font-mono font-semibold text-foreground">{r.ctr_reference}</TableCell>
              <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                {new Date(r.report_date).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
              </TableCell>
              <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                {r.filed_at ? new Date(r.filed_at).toLocaleString('en-NG', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}
              </TableCell>
              <TableCell className="text-xs font-medium text-foreground">{r.customer_name ?? '—'}</TableCell>
              <TableCell className="text-xs font-mono text-muted-foreground">{r.customer_id}</TableCell>
              <TableCell className="text-xs font-semibold text-foreground text-right">{formatNGN(Number(r.total_cash_ngn))}</TableCell>
              <TableCell className="text-right">
                <Button size="sm" variant="outline" className="h-7 gap-1 text-xs" onClick={() => handleDownload(r)}>
                  <Download className="h-3 w-3" />
                  Download XML
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
