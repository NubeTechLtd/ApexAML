import { useState } from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';
import { mockAlerts, type AlertData } from '@/data/mockAlerts';
import { AlertCard } from './AlertCard';
import { AlertDetail } from './AlertDetail';
import { Input } from '@/components/ui/input';

export function AlertInbox() {
  const [selectedId, setSelectedId] = useState<string>(mockAlerts[0].id);
  const [search, setSearch] = useState('');

  const filtered = mockAlerts.filter((a) =>
    a.customerName.toLowerCase().includes(search.toLowerCase()) ||
    a.id.toLowerCase().includes(search.toLowerCase()) ||
    a.alertType.toLowerCase().includes(search.toLowerCase())
  );

  const selected = mockAlerts.find((a) => a.id === selectedId) || mockAlerts[0];

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
          <p className="text-[11px] text-muted-foreground mt-2">
            {filtered.length} active alert{filtered.length !== 1 ? 's' : ''}
          </p>
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
