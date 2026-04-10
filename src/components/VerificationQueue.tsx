import { useState, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, CheckCircle2, XCircle, Clock, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { KYCCustomer, KYCStatus } from '@/data/mockKYC';

interface VerificationQueueProps {
  customers: KYCCustomer[];
  selectedId: string | null;
  onSelect: (customer: KYCCustomer) => void;
}

const tabs: { label: string; value: KYCStatus | 'All' }[] = [
  { label: 'All', value: 'All' },
  { label: 'Pending', value: 'Pending' },
  { label: 'In Review', value: 'In Review' },
  { label: 'Escalated', value: 'Escalated' },
  { label: 'Verified', value: 'Verified' },
];

const statusBadge: Record<KYCStatus, string> = {
  Pending: 'bg-muted text-muted-foreground',
  'In Review': 'bg-[hsl(var(--risk-medium))]/10 text-[hsl(var(--risk-medium))]',
  Escalated: 'bg-destructive/10 text-destructive',
  Verified: 'bg-[hsl(var(--risk-low))]/10 text-[hsl(var(--risk-low))]',
};

const riskBadge: Record<string, string> = {
  low: 'bg-[hsl(var(--risk-low))]/10 text-[hsl(var(--risk-low))]',
  medium: 'bg-[hsl(var(--risk-medium))]/10 text-[hsl(var(--risk-medium))]',
  high: 'bg-destructive/10 text-destructive',
};

const matchIcon = (status: 'match' | 'mismatch' | 'pending') => {
  if (status === 'match') return <CheckCircle2 className="h-3 w-3 text-[hsl(var(--risk-low))]" />;
  if (status === 'mismatch') return <XCircle className="h-3 w-3 text-destructive" />;
  return <Loader2 className="h-3 w-3 text-muted-foreground animate-spin" />;
};

export function VerificationQueue({ customers, selectedId, onSelect }: VerificationQueueProps) {
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<KYCStatus | 'All'>('All');

  const filtered = useMemo(() => {
    return customers.filter(c => {
      const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) || c.bvn.includes(search);
      const matchesTab = tab === 'All' || c.status === tab;
      return matchesSearch && matchesTab;
    });
  }, [customers, search, tab]);

  const counts = useMemo(() => {
    const m: Record<string, number> = { All: customers.length };
    customers.forEach(c => { m[c.status] = (m[c.status] || 0) + 1; });
    return m;
  }, [customers]);

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b bg-card space-y-2.5">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Verification Queue</p>
          <Badge variant="outline" className="text-[10px]">{customers.length} total</Badge>
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search name or BVN…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="h-8 pl-8 text-xs bg-background"
          />
        </div>
        <div className="flex gap-1 overflow-x-auto">
          {tabs.map(t => (
            <button
              key={t.value}
              onClick={() => setTab(t.value)}
              className={cn(
                'text-[10px] px-2 py-1 rounded-md font-medium transition-colors whitespace-nowrap',
                tab === t.value
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted/50'
              )}
            >
              {t.label}
              <span className="ml-1 opacity-70">{counts[t.value] || 0}</span>
            </button>
          ))}
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {filtered.map(c => (
            <button
              key={c.id}
              onClick={() => onSelect(c)}
              className={cn(
                'w-full text-left rounded-lg p-3 transition-all border',
                selectedId === c.id
                  ? 'bg-primary/5 border-primary/30 shadow-sm'
                  : 'bg-card border-transparent hover:bg-muted/50 hover:border-border'
              )}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-foreground truncate">{c.name}</span>
                <Badge variant="outline" className={cn('text-[9px] px-1.5 py-0 border-0 font-semibold', statusBadge[c.status])}>
                  {c.status}
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                <span className="font-mono">{c.bvn}</span>
                <span>·</span>
                <Badge variant="outline" className={cn('text-[9px] px-1 py-0 border-0 capitalize', riskBadge[c.riskTier])}>
                  {c.riskTier}
                </Badge>
              </div>
              <div className="flex items-center gap-3 mt-2">
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  {matchIcon(c.bvnMatch)} <span>BVN</span>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  {matchIcon(c.ninMatch)} <span>NIN</span>
                </div>
                <span className="text-[10px] text-muted-foreground ml-auto">
                  {new Date(c.submittedAt).toLocaleString('en-NG', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </button>
          ))}
          {filtered.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-8">No customers match your search.</p>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
