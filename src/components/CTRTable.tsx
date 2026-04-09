import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, FileOutput } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

interface CTRTransaction {
  id: string;
  date: string;
  customerName: string;
  accountNumber: string;
  amount: number;
  type: 'cash-in' | 'cash-out';
  branch: string;
  flagReason: string;
  status: 'pending' | 'submitted' | 'reviewed';
}

const mockCTRs: CTRTransaction[] = [
  { id: 'ctr-001', date: '2026-04-09T09:14:00Z', customerName: 'Adebayo Holdings Ltd', accountNumber: '0012345678', amount: 12500000, type: 'cash-in', branch: 'Victoria Island', flagReason: 'Exceeds ₦5M threshold', status: 'pending' },
  { id: 'ctr-002', date: '2026-04-09T08:32:00Z', customerName: 'Musa Ibrahim', accountNumber: '0023456789', amount: 7800000, type: 'cash-out', branch: 'Kano Main', flagReason: 'Exceeds ₦5M threshold', status: 'pending' },
  { id: 'ctr-003', date: '2026-04-09T07:50:00Z', customerName: 'Greenfield Agro Ventures', accountNumber: '0034567890', amount: 5200000, type: 'cash-in', branch: 'Ibadan GRA', flagReason: 'Exceeds ₦5M threshold', status: 'pending' },
  { id: 'ctr-004', date: '2026-04-08T15:22:00Z', customerName: 'Chief Okonkwo & Sons', accountNumber: '0045678901', amount: 9100000, type: 'cash-in', branch: 'Onitsha Market', flagReason: 'Exceeds ₦5M threshold', status: 'submitted' },
  { id: 'ctr-005', date: '2026-04-08T14:10:00Z', customerName: 'Halima Enterprises', accountNumber: '0056789012', amount: 6300000, type: 'cash-out', branch: 'Abuja Central', flagReason: 'Exceeds ₦5M threshold', status: 'submitted' },
  { id: 'ctr-006', date: '2026-04-08T11:45:00Z', customerName: 'Tunde Bakare', accountNumber: '0067890123', amount: 15000000, type: 'cash-in', branch: 'Lagos Marina', flagReason: 'Exceeds ₦5M threshold', status: 'reviewed' },
  { id: 'ctr-007', date: '2026-04-08T10:30:00Z', customerName: 'Plateau Mining Corp', accountNumber: '0078901234', amount: 8400000, type: 'cash-out', branch: 'Jos Main', flagReason: 'Exceeds ₦5M threshold', status: 'pending' },
];

const statusConfig = {
  pending: 'bg-[hsl(var(--risk-medium)/0.12)] text-[hsl(var(--risk-medium))] border-0',
  submitted: 'bg-[hsl(var(--risk-low)/0.12)] text-[hsl(var(--risk-low))] border-0',
  reviewed: 'bg-muted text-muted-foreground border-0',
};

export function CTRTable() {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const filtered = mockCTRs.filter((t) =>
    t.customerName.toLowerCase().includes(search.toLowerCase()) ||
    t.accountNumber.includes(search)
  );

  const pendingFiltered = filtered.filter((t) => t.status === 'pending');
  const allPendingSelected = pendingFiltered.length > 0 && pendingFiltered.every((t) => selected.has(t.id));

  const toggleAll = () => {
    if (allPendingSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(pendingFiltered.map((t) => t.id)));
    }
  };

  const toggle = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelected(next);
  };

  const handleBatch = () => {
    toast({
      title: 'CTR Batch Generated',
      description: `${selected.size} transaction(s) packaged in NFIU CTR format. Ready for goAML upload.`,
    });
    setSelected(new Set());
  };

  const formatNGN = (n: number) => '₦' + n.toLocaleString('en-NG');

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="relative w-64">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input placeholder="Search customer or account…" value={search} onChange={(e) => setSearch(e.target.value)} className="h-8 pl-8 text-xs" />
        </div>
        <Button size="sm" disabled={selected.size === 0} onClick={handleBatch} className="gap-1.5 text-xs">
          <FileOutput className="h-3.5 w-3.5" />
          Generate Daily CTR Batch (NFIU Format)
          {selected.size > 0 && <Badge variant="secondary" className="ml-1 text-[10px] h-4 px-1.5">{selected.size}</Badge>}
        </Button>
      </div>

      <div className="rounded-lg border overflow-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-10">
                <Checkbox checked={allPendingSelected} onCheckedChange={toggleAll} aria-label="Select all pending" />
              </TableHead>
              <TableHead className="text-[10px] uppercase tracking-wider font-semibold">Date</TableHead>
              <TableHead className="text-[10px] uppercase tracking-wider font-semibold">Customer</TableHead>
              <TableHead className="text-[10px] uppercase tracking-wider font-semibold">Account</TableHead>
              <TableHead className="text-[10px] uppercase tracking-wider font-semibold text-right">Amount</TableHead>
              <TableHead className="text-[10px] uppercase tracking-wider font-semibold text-center">Type</TableHead>
              <TableHead className="text-[10px] uppercase tracking-wider font-semibold">Branch</TableHead>
              <TableHead className="text-[10px] uppercase tracking-wider font-semibold text-center">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((t) => (
              <TableRow key={t.id} className={cn(selected.has(t.id) && 'bg-accent')}>
                <TableCell>
                  <Checkbox
                    checked={selected.has(t.id)}
                    onCheckedChange={() => toggle(t.id)}
                    disabled={t.status !== 'pending'}
                    aria-label={`Select ${t.customerName}`}
                  />
                </TableCell>
                <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                  {new Date(t.date).toLocaleString('en-NG', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </TableCell>
                <TableCell className="text-xs font-medium text-foreground">{t.customerName}</TableCell>
                <TableCell className="text-xs font-mono text-muted-foreground">{t.accountNumber}</TableCell>
                <TableCell className="text-xs font-semibold text-foreground text-right">{formatNGN(t.amount)}</TableCell>
                <TableCell className="text-center">
                  <Badge variant="outline" className={cn('text-[10px] border-0 capitalize', t.type === 'cash-in' ? 'bg-[hsl(var(--risk-low)/0.12)] text-[hsl(var(--risk-low))]' : 'bg-[hsl(var(--risk-medium)/0.12)] text-[hsl(var(--risk-medium))]')}>
                    {t.type}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">{t.branch}</TableCell>
                <TableCell className="text-center">
                  <Badge variant="outline" className={cn('text-[10px] font-semibold capitalize', statusConfig[t.status])}>
                    {t.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <p className="text-[10px] text-muted-foreground">Showing transactions exceeding ₦5,000,000 threshold per CBN AML/CFT guidelines. Auto-flagged for CTR filing.</p>
    </div>
  );
}
