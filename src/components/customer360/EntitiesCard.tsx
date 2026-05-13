import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Network, Fingerprint, ArrowRight, User, Wifi, Banknote, Shield } from 'lucide-react';
import { EntityNetworkGraph, type GraphNode } from '@/components/graph/EntityNetworkGraph';
import type { ConnectedEntity } from '@/data/mockCustomer360';

const entityIcons: Record<ConnectedEntity['type'], typeof Network> = {
  'Shared Device ID': Fingerprint,
  'Frequent Transfer Target': ArrowRight,
  'Shared Address': User,
  'Common Beneficiary': Network,
  'Common IP Address': Wifi,
  'Bureau de Change (BDC)': Banknote,
};

// Types we treat as inherently high-risk for the visual glow.
const HIGH_RISK_TYPES = new Set<ConnectedEntity['type']>([
  'Bureau de Change (BDC)',
  'Common IP Address',
]);

interface Props {
  entities: ConnectedEntity[];
  customerName?: string;
}

export function Customer360Entities({ entities, customerName = 'Customer' }: Props) {
  const centerNode: GraphNode = {
    id: 'center',
    label: customerName,
    sublabel: 'Subject of investigation',
    icon: Shield,
  };

  const nodes: GraphNode[] = entities.map((e) => ({
    id: e.id,
    label: e.label,
    sublabel: e.type,
    icon: entityIcons[e.type] ?? Network,
    highRisk: HIGH_RISK_TYPES.has(e.type),
  }));

  return (
    <Card className="h-full">
      <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Network className="h-4 w-4 text-primary" /> Connected Entities
        </CardTitle>
        {entities.length > 0 && (
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
            {entities.length} link{entities.length === 1 ? '' : 's'} ·{' '}
            <span className="text-destructive font-semibold">
              {nodes.filter((n) => n.highRisk).length} high-risk
            </span>
          </span>
        )}
      </CardHeader>
      <CardContent>
        <EntityNetworkGraph
          centerNode={centerNode}
          nodes={nodes}
          height={420}
          emptyState="No connected entities detected"
        />
      </CardContent>
    </Card>
  );
}
