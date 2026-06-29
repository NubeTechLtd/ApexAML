import { AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { Customer360Data } from '@/data/mockCustomer360';

const hardcoded: Record<number, string> = {
  1: 'Adebayo Ogunlesi opened this account 7 months ago with Tier 3 documents. One of their KYC documents has been flagged — the employer letter lists a company whose CAC registration was suspended in 2024. Over the past 30 days they moved ₦14.8M through 47 POS transactions, all structured below the ₦500,000 reporting threshold, with funds round-tripped through Crown BDC Ltd within 1h 37m of an inbound IMTO remittance. They have 4 connected accounts and entities, including a shared device ID with two other Tier 3 accounts and a frequent transfer target receiving ₦9.5M in the same window. This pattern matches POS Round-Tripping combined with BDC layering — financial crime methodologies explicitly flagged in CBN Circular BSD/DIR/PUB/LAB/019/002.',
  8: 'Aisha Yusuf opened this account 4 months ago with Tier 2 documents. Her declared occupation is "student" yet inbound transfers exceed ₦22M across the past 60 days, sourced from 11 distinct payers with no familial or employment relationship on record. Funds are withdrawn within 24 hours via USSD across 3 states, consistent with mule-account layering. She shares a registered address with two other recently onboarded accounts exhibiting identical transaction velocity. This pattern matches USSD Layering and Account-Mule typologies described in CBN Circular BSD/DIR/PUB/LAB/019/002 and NFIU Typology Bulletin 14.',
};

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
  const narrative = hardcoded[customer.id] ?? genericNarrative(customer);
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
