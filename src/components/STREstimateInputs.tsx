import { useId } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { STR_ESTIMATE_LABEL, useSTRAssumptions, updateSTRAssumption, type STRAssumptions } from '@/lib/strEstimate';

export function STREstimateInputs({ includeCosts = false }: { includeCosts?: boolean }) {
  const values = useSTRAssumptions();
  const id = useId();
  const fields: { key: keyof STRAssumptions; label: string; min: number }[] = [
    { key: 'manualMinutes', label: 'Manual minutes per STR', min: 0 },
    { key: 'assistedMinutes', label: 'Assisted minutes per STR (including review)', min: 0 },
    { key: 'strsPerMonth', label: 'STRs per month', min: 0 },
    ...(includeCosts ? [
      { key: 'monthlySalary' as const, label: 'Monthly analyst salary (NGN)', min: 0 },
      { key: 'workingHours' as const, label: 'Working hours per month', min: 1 },
    ] : []),
  ];
  return <div className="space-y-4">
    <p className="text-sm text-muted-on-dark">{STR_ESTIMATE_LABEL}</p>
    <div className="grid sm:grid-cols-2 gap-4">
      {fields.map(field => <div key={field.key} className="space-y-2 min-w-0">
        <Label htmlFor={`${id}-${field.key}`} className="text-foreground leading-relaxed block">{field.label}</Label>
        <Input id={`${id}-${field.key}`} type="number" min={field.min} step={1} value={values[field.key]}
          onChange={event => updateSTRAssumption(field.key, Number(event.target.value))}
          className="bg-background border-input text-foreground tabular-nums" />
      </div>)}
    </div>
  </div>;
}