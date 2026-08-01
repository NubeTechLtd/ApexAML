import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CorporateEntity, KybRisk, KybStatus } from '@/data/mockKYB';

interface Props {
  entities: CorporateEntity[];
  selectedId: string | null;
  onSelect: (entity: CorporateEntity) => void;
}

const tabs: { label: string; value: KybStatus | 'All' }[] = [
  { label: 'All', value: 'All' },
  { label: 'Pending', value: 'Pending' },
  { label: 'In Progress', value: 'In Progress' },
  { label: 'Approved', value: 'Approved' },
  { label: 'Rejected', value: 'Rejected' },
];

const statusBadge: Record<KybStatus, string> = {
  Pending: 'bg-muted text-muted-foreground',
  'In Progress': 'bg-[hsl(var(--risk-medium))]/10 text-[hsl(var(--risk-medium))]',
  Approved: 'bg-[hsl(var(--risk-low))]/10 text-[hsl(var(--risk-low))]',
  Rejected: 'bg-destructive/10 text-destructive',
};

const riskBadge: Record<KybRisk, string> = {
  Low: 'bg-[hsl(var(--risk-low))]/10 text-[hsl(var(--risk-low))]',
  Medium: 'bg-[hsl(var(--risk-medium))]/10 text-[hsl(var(--risk-medium))]',
  High: 'bg-destructive/10 text-destructive',
};

export function CorporateQueue({ entities, selectedId, onSelect }: Props) {
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<KybStatus | 'All'>('All');

  const filtered = useMemo(
    () =>
      entities.filter(e => {
        const q = search.toLowerCase();
        const matchesSearch =
          e.companyName.toLowerCase().includes(q) || e.rcNumber.toLowerCase().includes(q);
        return matchesSearch && (tab === 'All' || e.status === tab);
      }),
    [entities, search, tab],
  );

  const counts = useMemo(() => {
    const m: Record<string, number> = { All: entities.length };
    entities.forEach(e => { m[e.status] = (m[e.status] || 0) + 1; });
    return m;
  }, [entities]);

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b bg-card space-y-2.5">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Corporate KYB queue</p>
          <Badge variant="outline" className="text-[10px]">{entities.length} total</Badge>
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search company or RC number…"
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
                tab === t.value ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted/50',
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
          {filtered.map(e => (
            <button
              key={e.id}
              onClick={() => onSelect(e)}
              className={cn(
                'w-full text-left rounded-lg p-3 transition-all border',
                selectedId === e.id
                  ? 'bg-primary/5 border-primary/30 shadow-sm'
                  : 'bg-card border-transparent hover:bg-muted/50 hover:border-border',
              )}
            >
              <div className="flex items-start justify-between gap-2 mb-1">
                <span className="text-sm font-medium text-foreground truncate">{e.companyName}</span>
                <Badge variant="outline" className={cn('text-[9px] px-1.5 py-0 border-0 font-semibold shrink-0', statusBadge[e.status])}>
                  {e.status}
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                <span className="font-mono">{e.rcNumber}</span>
                <span>·</span>
                <Badge variant="outline" className={cn('text-[9px] px-1 py-0 border-0', riskBadge[e.risk])}>
                  {e.risk} risk
                </Badge>
              </div>
              <div className="flex items-center gap-1 mt-2 text-[10px] text-muted-foreground">
                <Clock className="h-3 w-3" />
                {e.daysInQueue} day{e.daysInQueue === 1 ? '' : 's'} in queue
              </div>
            </button>
          ))}
          {filtered.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-8">No corporate customers match your search.</p>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
