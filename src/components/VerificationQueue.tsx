import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, Clock, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import type { KYCCustomer } from '@/data/mockKYC';

interface VerificationQueueProps {
  customers: KYCCustomer[];
  selectedId: string | null;
  onSelect: (customer: KYCCustomer) => void;
}

const matchIcon = (status: 'match' | 'mismatch' | 'pending') => {
  if (status === 'match') return <CheckCircle2 className="h-4 w-4 text-[hsl(var(--risk-low))]" />;
  if (status === 'mismatch') return <XCircle className="h-4 w-4 text-[hsl(var(--risk-critical))]" />;
  return <Clock className="h-4 w-4 text-muted-foreground" />;
};

const livenessLabel = (status: 'pass' | 'fail' | 'pending') => {
  const config = {
    pass: { text: 'Pass', cls: 'bg-[hsl(var(--risk-low)/0.12)] text-[hsl(var(--risk-low))] border-0' },
    fail: { text: 'Fail', cls: 'bg-[hsl(var(--risk-critical)/0.12)] text-[hsl(var(--risk-critical))] border-0' },
    pending: { text: 'Pending', cls: 'bg-muted text-muted-foreground border-0' },
  };
  const c = config[status];
  return <Badge variant="outline" className={cn('text-[10px] font-semibold', c.cls)}>{c.text}</Badge>;
};

const riskLabel = (tier: 'low' | 'medium' | 'high') => {
  const config = {
    low: 'bg-[hsl(var(--risk-low)/0.12)] text-[hsl(var(--risk-low))] border-0',
    medium: 'bg-[hsl(var(--risk-medium)/0.12)] text-[hsl(var(--risk-medium))] border-0',
    high: 'bg-[hsl(var(--risk-critical)/0.12)] text-[hsl(var(--risk-critical))] border-0',
  };
  return (
    <Badge variant="outline" className={cn('text-[10px] font-semibold capitalize', config[tier])}>
      {tier}
    </Badge>
  );
};

export function VerificationQueue({ customers, selectedId, onSelect }: VerificationQueueProps) {
  const [search, setSearch] = useState('');
  const filtered = customers.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.bvn.includes(search)
  );

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between gap-3 mb-3">
        <h2 className="text-sm font-semibold text-foreground">Verification Queue</h2>
        <div className="relative w-56">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search name or BVN…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 pl-8 text-xs"
          />
        </div>
      </div>
      <div className="rounded-lg border overflow-auto flex-1">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="text-[10px] uppercase tracking-wider font-semibold">Customer</TableHead>
              <TableHead className="text-[10px] uppercase tracking-wider font-semibold text-center">BVN</TableHead>
              <TableHead className="text-[10px] uppercase tracking-wider font-semibold text-center">NIN</TableHead>
              <TableHead className="text-[10px] uppercase tracking-wider font-semibold text-center">Liveness</TableHead>
              <TableHead className="text-[10px] uppercase tracking-wider font-semibold text-center">Risk Tier</TableHead>
              <TableHead className="text-[10px] uppercase tracking-wider font-semibold">Submitted</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((c) => (
              <TableRow
                key={c.id}
                onClick={() => onSelect(c)}
                className={cn(
                  'cursor-pointer transition-colors',
                  selectedId === c.id ? 'bg-accent' : 'hover:bg-muted/50'
                )}
              >
                <TableCell className="text-xs font-medium text-foreground">{c.name}</TableCell>
                <TableCell className="text-center">{matchIcon(c.bvnMatch)}</TableCell>
                <TableCell className="text-center">{matchIcon(c.ninMatch)}</TableCell>
                <TableCell className="text-center">{livenessLabel(c.livenessCheck)}</TableCell>
                <TableCell className="text-center">{riskLabel(c.riskTier)}</TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {new Date(c.submittedAt).toLocaleString('en-NG', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-xs text-muted-foreground py-8">
                  No customers match your search.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
