import { useEffect, useState } from 'react';
import { Progress } from '@/components/ui/progress';
import { listCustomerDocuments, normaliseTier, requiredDocsForTier } from '@/lib/kycDocuments';

export function DocumentCompleteness({ customerId, kycTier }: { customerId: string; kycTier: string }) {
  const tier = normaliseTier(kycTier);
  const required = requiredDocsForTier(tier);
  const [have, setHave] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    const req = requiredDocsForTier(tier);
    listCustomerDocuments(customerId)
      .then(docs => {
        if (!active) return;
        const currentTypes = new Set(docs.filter(d => d.is_current).map(d => d.document_type));
        setHave(req.filter(t => currentTypes.has(t)).length);
      })
      .catch(() => active && setHave(null));
    return () => { active = false; };
  }, [customerId, tier]);


  if (have === null) return null;

  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] text-muted-foreground whitespace-nowrap">
        Documents: {have}/{required.length} required for {tier}
      </span>
      <Progress value={(have / required.length) * 100} className="h-1.5 w-24" />
    </div>
  );
}
