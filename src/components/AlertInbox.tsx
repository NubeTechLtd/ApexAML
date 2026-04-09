import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { mockAlerts, type AlertData, type RiskLevel, type AlertStatus } from '@/data/mockAlerts';
import { AlertCard } from './AlertCard';
import { AlertDetail } from './AlertDetail';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

export function AlertInbox() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedId, setSelectedId] = useState<string>(mockAlerts[0].id);
  const [search, setSearch] = useState('');

  const statusFilter = searchParams.get('status') as AlertStatus | null;
  const riskFilter = searchParams.get('risk') as RiskLevel | null;
  const typeFilter = searchParams.get('type');
  const activeFilter = statusFilter || riskFilter || typeFilter;

  const filtered = useMemo(() => {
    return mockAlerts.filter((a) => {
      const matchesSearch =
        a.customerName.toLowerCase().includes(search.toLowerCase()) ||
        a.id.toLowerCase().includes(search.toLowerCase()) ||
        a.alertType.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = !statusFilter || a.status === statusFilter;
      const matchesRisk = !riskFilter || a.riskLevel === riskFilter;
      const matchesType = !typeFilter || a.alertType === typeFilter;
      return matchesSearch && matchesStatus && matchesRisk && matchesType;
    });
  }, [search, statusFilter, riskFilter, typeFilter]);

  const selected = filtered.find((a) => a.id === selectedId) || filtered[0] || mockAlerts[0];

  const clearFilters = () => setSearchParams({});

  return (
    <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden">
      {/* Left pane - Alert list */}
      <div className="w-[30%] min-w-[300px] border-r flex flex-col bg-surface-sunken">
        <div className="p-3 border-b bg-card">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search alerts..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-8 text-sm bg-background"
              />
            </div>
            <button className="flex h-8 w-8 items-center justify-center rounded-md border bg-background hover:bg-muted transition-colors">
              <SlidersHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <p className="text-[11px] text-muted-foreground">
              {filtered.length} alert{filtered.length !== 1 ? 's' : ''}
            </p>
            {activeFilter && (
              <button
                onClick={clearFilters}
                className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary hover:bg-primary/20 transition-colors"
              >
                {statusFilter || riskFilter || typeFilter}
                <X className="h-2.5 w-2.5" />
              </button>
            )}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto scrollbar-thin p-2 space-y-1">
          {filtered.map((alert) => (
            <AlertCard
              key={alert.id}
              alert={alert}
              isSelected={alert.id === selectedId}
              onClick={() => setSelectedId(alert.id)}
            />
          ))}
        </div>
      </div>

      {/* Right pane - Alert detail */}
      <div className="flex-1 bg-background">
        <AlertDetail alert={selected} />
      </div>
    </div>
  );
}
