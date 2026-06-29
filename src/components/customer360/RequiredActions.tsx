import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import type { Customer360Data } from '@/data/mockCustomer360';

interface ActionItem {
  id: string;
  label: string;
  defaultChecked?: boolean;
  onClick?: () => void;
}

interface Props {
  customer: Customer360Data;
  openAlertCount: number;
}

export function RequiredActions({ customer, openAlertCount }: Props) {
  const navigate = useNavigate();

  const items: ActionItem[] = useMemo(() => {
    if (customer.riskLevel === 'High' && openAlertCount > 0) {
      return [
        { id: 'str', label: 'File an STR with NFIU within 24 hours of suspicion forming', onClick: () => navigate('/alerts') },
        { id: 'entities', label: 'Review all connected entities for related suspicious activity' },
        { id: 'freeze', label: 'Consider account freeze if evidence supports it' },
        { id: 'notes', label: 'Document all investigation steps in the case notes' },
      ];
    }
    if (customer.riskLevel === 'Medium') {
      return [
        { id: 'edd', label: 'Conduct Enhanced Due Diligence (EDD) review' },
        { id: 'kyc', label: 'Request updated KYC documents within 14 days' },
        { id: 'monitor', label: 'Increase monitoring frequency to daily' },
      ];
    }
    // Low
    const nextReview = new Date();
    nextReview.setMonth(nextReview.getMonth() + 6);
    const dateStr = nextReview.toLocaleDateString('en-NG', { day: '2-digit', month: 'short', year: 'numeric' });
    return [
      { id: 'review', label: `Standard periodic review due in ${dateStr}`, defaultChecked: true },
      { id: 'kyc-current', label: 'KYC documents current and verified', defaultChecked: true },
    ];
  }, [customer.riskLevel, openAlertCount, navigate]);

  const [checked, setChecked] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(items.map(i => [i.id, !!i.defaultChecked])),
  );

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <CheckCircle2 className="h-5 w-5 text-primary" />
          What your institution must do
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2.5">
        {items.map(item => {
          const isChecked = checked[item.id];
          return (
            <div key={item.id} className="flex items-start gap-3">
              <Checkbox
                id={`req-${item.id}`}
                checked={isChecked}
                onCheckedChange={(v) => setChecked(prev => ({ ...prev, [item.id]: !!v }))}
                className="mt-0.5"
              />
              <label
                htmlFor={`req-${item.id}`}
                onClick={(e) => {
                  if (item.onClick) {
                    e.preventDefault();
                    item.onClick();
                  }
                }}
                className={cn(
                  'text-sm leading-snug cursor-pointer select-none',
                  isChecked ? 'line-through text-muted-foreground' : 'text-foreground',
                  item.onClick && !isChecked && 'hover:text-primary',
                )}
              >
                {item.label}
              </label>
            </div>
          );
        })}
        <p className="pt-3 mt-3 border-t border-border text-xs text-muted-foreground italic">
          All actions taken are automatically recorded in the immutable audit trail.
        </p>
      </CardContent>
    </Card>
  );
}
