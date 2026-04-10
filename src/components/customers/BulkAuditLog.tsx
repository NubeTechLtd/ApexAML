import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ClipboardList, ShieldAlert, ShieldCheck, Snowflake } from 'lucide-react';

export interface BulkAuditEntry {
  id: string;
  timestamp: string;
  type: 'flag' | 'clear' | 'escalate';
  analyst: string;
  customers: string[];
  justification?: string;
}

const typeConfig = {
  flag: { label: 'Flag for Review', icon: ShieldAlert, badgeClass: 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20' },
  clear: { label: 'Cleared', icon: ShieldCheck, badgeClass: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20' },
  escalate: { label: 'Account Freeze', icon: Snowflake, badgeClass: 'bg-destructive/10 text-destructive border-destructive/20' },
};

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString('en-NG', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function BulkAuditLog({ entries }: { entries: BulkAuditEntry[] }) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs relative">
          <ClipboardList className="h-3 w-3" />
          Audit Log
          {entries.length > 0 && (
            <span className="ml-1 inline-flex items-center justify-center h-4 min-w-[16px] rounded-full bg-primary text-primary-foreground text-[10px] font-bold px-1">
              {entries.length}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[420px] sm:max-w-[420px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            Bulk Action Audit Log
          </SheetTitle>
        </SheetHeader>
        <ScrollArea className="h-[calc(100vh-80px)] mt-4 pr-2">
          {entries.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-12">No bulk actions recorded this session.</p>
          ) : (
            <div className="space-y-3">
              {[...entries].reverse().map(entry => {
                const cfg = typeConfig[entry.type];
                const Icon = cfg.icon;
                return (
                  <div key={entry.id} className="rounded-lg border border-border bg-card p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className={`text-xs gap-1 ${cfg.badgeClass}`}>
                        <Icon className="h-3 w-3" /> {cfg.label}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground font-mono">{formatTime(entry.timestamp)}</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {entry.customers.map(n => (
                        <span key={n} className="text-xs bg-muted/50 rounded px-1.5 py-0.5 text-foreground">{n}</span>
                      ))}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                      <span>Analyst: <span className="font-mono text-foreground">{entry.analyst}</span></span>
                    </div>
                    {entry.justification && (
                      <p className="text-xs text-muted-foreground bg-muted/30 rounded p-2 italic">"{entry.justification}"</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
