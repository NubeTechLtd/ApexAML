import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Network, Fingerprint, ArrowRight, User, Wifi, Banknote } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ConnectedEntity } from '@/data/mockCustomer360';

const entityIcons: Record<string, typeof Network> = {
  'Shared Device ID': Fingerprint,
  'Frequent Transfer Target': ArrowRight,
  'Shared Address': User,
  'Common Beneficiary': Network,
  'Common IP Address': Wifi,
  'Bureau de Change (BDC)': Banknote,
};

export function Customer360Entities({ entities }: { entities: ConnectedEntity[] }) {
  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Network className="h-4 w-4 text-primary" /> Connected Entities
        </CardTitle>
      </CardHeader>
      <CardContent>
        {entities.length === 0 ? (
          <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
            No connected entities detected
          </div>
        ) : (
          <div className="space-y-2">
            {entities.map(entity => {
              const Icon = entityIcons[entity.type] || Network;
              const isBDC = entity.type === 'Bureau de Change (BDC)';
              return (
                <div
                  key={entity.id}
                  className={cn(
                    'rounded-lg border p-3 space-y-1 transition-colors',
                    isBDC
                      ? 'border-destructive/40 bg-destructive/[0.04] hover:bg-destructive/[0.08]'
                      : 'border-border hover:bg-muted/30',
                  )}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        'flex h-7 w-7 shrink-0 items-center justify-center rounded-full',
                        isBDC ? 'bg-destructive/15' : 'bg-primary/10',
                      )}
                    >
                      <Icon className={cn('h-3.5 w-3.5', isBDC ? 'text-destructive' : 'text-primary')} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate">{entity.label}</p>
                      <Badge
                        variant="outline"
                        className={cn(
                          'text-[10px] px-1.5 py-0',
                          isBDC && 'bg-destructive/10 text-destructive border-destructive/30',
                        )}
                      >
                        {entity.type}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground pl-9">{entity.detail}</p>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
