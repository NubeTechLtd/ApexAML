import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { STREstimateInputs, STREstimateLabel } from '@/components/STREstimateInputs';
import { calculateSTREstimate, useSTRAssumptions } from '@/lib/strEstimate';
import { PLAN_PRICING, IMPLEMENTATION_PRICE_RANGE, imtoMonthlyCost } from '@/lib/pricing';

const tiers = { Essential: PLAN_PRICING.essential, Starter: PLAN_PRICING.starter, Growth: PLAN_PRICING.growth, IMTO: PLAN_PRICING.imtoMonthlyMinimum };
const naira = (value: number) => `₦${Math.round(value).toLocaleString('en-NG')}`;
export function ROICalculator() {
  const assumptions = useSTRAssumptions();
  const estimate = calculateSTREstimate(assumptions);
  const [plan, setPlan] = useState<keyof typeof tiers>('Starter');
  const [volume, setVolume] = useState(250_000);
  const subscription = plan === 'IMTO' ? imtoMonthlyCost(volume) : tiers[plan];
  return <section className="py-20 px-6 bg-background" aria-label="Subscription and workload estimate">
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="text-center space-y-3">
        <p className="text-xs font-semibold uppercase text-primary">ROI Calculator</p>
        <h2 className="text-3xl font-bold text-foreground">Subscription and STR workload estimate</h2>
      </div>
      <div className="grid lg:grid-cols-2 gap-10">
        <div className="space-y-6">
          <STREstimateInputs includeCosts />
          <div className="space-y-2">
            <Label htmlFor="estimate-plan">Subscription plan</Label>
            <Select value={plan} onValueChange={value => { if (value in tiers) setPlan(value as keyof typeof tiers); }}>
              <SelectTrigger id="estimate-plan"><SelectValue /></SelectTrigger>
              <SelectContent>{Object.keys(tiers).map(tier => <SelectItem key={tier} value={tier}>{tier}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          {plan === 'IMTO' && <div className="space-y-2">
            <Label htmlFor="estimate-volume">Transactions per month</Label>
            <Input id="estimate-volume" type="number" min={0} value={volume} onChange={event => setVolume(Math.max(0, Number(event.target.value) || 0))} />
          </div>}
        </div>
        <div className="space-y-5 border-t lg:border-t-0 lg:border-l border-border pt-6 lg:pt-0 lg:pl-10">
          <STREstimateLabel />
          <h3 className="text-xl font-semibold text-foreground">Illustrative annual comparison</h3>
          <dl className="space-y-5 text-foreground">
            <div><dt className="text-muted-on-dark">Writing-time value difference (before subscription)</dt><dd className="text-2xl font-bold tabular-nums">{naira(estimate.costDifference * 12)}/year</dd></div>
            <div><dt className="text-muted-on-dark">{plan} subscription</dt><dd className="text-2xl font-bold text-primary tabular-nums">{naira(subscription * 12)}/year</dd></div>
            <div><dt className="text-muted-on-dark">Writing-time value difference less subscription</dt><dd className="text-2xl font-bold tabular-nums">{naira(estimate.costDifference * 12 - subscription * 12)}/year</dd></div>
          </dl>
          <p className="text-sm text-muted-on-dark">Formula: (manual minutes − assisted minutes) × STRs/month ÷ 60 × salary ÷ working hours. Annual values multiply by 12.</p>
          <p className="text-sm text-muted-on-dark">Not measured performance or guaranteed financial ROI. Released writing time does not necessarily reduce payroll. No assumed fine avoidance or risk-reduction benefit is included.</p>
          <p className="text-sm text-muted-on-dark">Implementation programme: {IMPLEMENTATION_PRICE_RANGE.toLowerCase()} Implementation and onboarding fees are excluded.</p>
          {plan === 'IMTO' && <p className="text-sm text-muted-on-dark">₦{PLAN_PRICING.imtoPerTransaction}/transaction; {naira(PLAN_PRICING.imtoMonthlyMinimum)} monthly minimum.</p>}
        </div>
      </div>
    </div>
  </section>;
}
