import { AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { Customer360Data } from '@/data/models/customer360';


function monthsSince(_customer: Customer360Data): number {
  // Mock — derive a deterministic months value from the customer id
  return 3 + (_customer.id % 9);
}

function genericNarrative(c: Customer360Data): string {
  const months = monthsSince(c);
  const entityCount = c.connectedEntities.length;
  const entityLine = entityCount > 0
    ? ` They have ${entityCount} connected ${entityCount === 1 ? 'entity' : 'entities'}, including ${c.connectedEntities[0].label} (${c.connectedEntities[0].type.toLowerCase()}).`
    : '';
  const riskLine = c.riskLevel === 'High'
    ? 'transaction velocity, channel concentration and peer-deviation metrics all sit in the top decile of their KYC tier'
    : c.riskLevel === 'Medium'
      ? 'transaction patterns show moderate deviation from peer baselines for this KYC tier'
      : 'activity is broadly in line with peer baselines, but periodic review remains due';
  return `${c.name} opened this account ${months} months ago with ${c.kycTier} documents. Over the recent monitoring window, ${riskLine}.${entityLine} This profile is reviewed against typologies catalogued in CBN Circular BSD/DIR/PUB/LAB/019/002.`;
}

export function RiskNarrative({ customer }: { customer: Customer360Data }) {
  const narrative = genericNarrative(customer);
  const borderColor =
    customer.riskLevel === 'High'
      ? 'border-l-destructive'
      : customer.riskLevel === 'Medium'
        ? 'border-l-yellow-500'
        : 'border-l-emerald-500';
  const iconColor =
    customer.riskLevel === 'High'
      ? 'text-destructive'
      : customer.riskLevel === 'Medium'
        ? 'text-yellow-600 dark:text-yellow-400'
        : 'text-emerald-600 dark:text-emerald-400';

  return (
    <Card className={cn('border-l-4', borderColor)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <AlertTriangle className={cn('h-5 w-5', iconColor)} />
          Why this customer needs attention
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm leading-relaxed text-foreground/90">{narrative}</p>
      </CardContent>
    </Card>
  );
}
