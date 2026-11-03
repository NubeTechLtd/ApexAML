import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { downloadXmlFile } from '@/lib/generateGoAMLXml';
import { toast } from '@/hooks/use-toast';
import { useDataProvider } from '@/data-layer/hooks';
import { useAuditLog } from '@/hooks/useAuditLog';
import type { CTRRow } from './CTRManagement';

const formatNGN = (n: number) => '₦' + Math.round(Number(n)).toLocaleString('en-NG');

export function CTRFiledTable({ rows }: { rows: CTRRow[] }) {
  const provider = useDataProvider();
  const { append } = useAuditLog();
  if (rows.length === 0) {
    return (
      <div className="rounded-lg border p-8 text-center">
        <p className="text-xs text-muted-foreground">No CTRs have been filed yet.</p>
      </div>
    );
  }

  const handleDownload = async (r: CTRRow) => {
    if (!r.goaml_xml || !r.ctr_reference) {
      toast({ title: 'XML unavailable', variant: 'destructive' });
      return;
    }
    const filename = `${r.ctr_reference}.xml`;
    if (provider.kind !== 'demo') {
      // Live: every download of a filed CTR is an export and must be audited first.
      const match = r.goaml_xml.match(/<ProfileVersion>(\d+)<\/ProfileVersion>/);
      const profileVersion = match ? Number(match[1]) : null;
      try {
        await append({
          action: 'CTR_EXPORT', analyst: '', caseId: r.ctr_reference,
          justification: `Filed CTR downloaded as goAML-style XML (draft): ${filename}.${profileVersion != null ? ` Institution profile v${profileVersion}.` : ''}`,
          metadata: { filename, reference: r.ctr_reference, profile_version: profileVersion, export_type: 'CTR' },
        });
      } catch {
        toast({ title: 'Export not completed', description: 'The download could not be recorded in the audit log, so the file was not downloaded. Try again.', variant: 'destructive' });
        return;
      }
    }
    downloadXmlFile(r.goaml_xml, filename);
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
