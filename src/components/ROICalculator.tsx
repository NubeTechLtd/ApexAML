import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BookDemoSheet } from "@/components/landing/BookDemoSheet";
import { STREstimateInputs, STREstimateLabel } from "@/components/STREstimateInputs";
import { calculateSTREstimate, useSTRAssumptions } from "@/lib/strEstimate";
import { PLAN_PRICING, IMPLEMENTATION_PRICE_RANGE } from "@/lib/pricing";

const naira = (value: number) => `₦${Math.round(value).toLocaleString("en-NG")}`;
const hours = (value: number) => value.toLocaleString("en-NG", { maximumFractionDigits: 1 });

export function ROICalculator() {
  const assumptions = useSTRAssumptions();
  const estimate = calculateSTREstimate(assumptions);
  const [demoOpen, setDemoOpen] = useState(false);
  return <section className="py-20 px-6 bg-background" aria-label="STR cost estimate">
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="text-center space-y-3">
        <p className="text-primary text-xs font-semibold uppercase">STR Cost Calculator</p>
        <h2 className="text-3xl font-bold text-foreground">STR writing workload estimate</h2>
      </div>
      <STREstimateInputs includeCosts />
      <STREstimateLabel />
      <div className="grid md:grid-cols-2 gap-8 border-y border-border py-8">
        <div className="space-y-2">
          <h3 className="text-muted-on-dark">Illustrative manual writing cost</h3>
          <p className="text-3xl font-bold text-foreground tabular-nums">{naira(estimate.manualCost)}/month</p>
          <p className="text-muted-on-dark">{hours(estimate.manualHours)} hours/month at {assumptions.manualMinutes} minutes per STR</p>
        </div>
        <div className="space-y-2">
          <h3 className="text-muted-on-dark">Illustrative assisted writing cost</h3>
          <p className="text-3xl font-bold text-primary tabular-nums">{naira(estimate.assistedCost)}/month</p>
          <p className="text-muted-on-dark">{hours(estimate.assistedHours)} hours/month at {assumptions.assistedMinutes} minutes per STR, including analyst review</p>
        </div>
      </div>
      <div className="space-y-3">
        <p className="text-lg text-foreground">Illustrative difference: <strong>{hours(estimate.hoursDifference)} hours</strong> and <strong>{naira(estimate.costDifference)}/month</strong> in writing time valued at the assumed salary.</p>
        <p className="text-sm text-muted-on-dark">Not measured performance, guaranteed savings or a reduction in payroll. Excludes investigation, approval, filing and subscription costs.</p>
        <p className="text-sm text-muted-on-dark">Growth subscription: {naira(PLAN_PRICING.growth)}/month. Implementation programme: {IMPLEMENTATION_PRICE_RANGE.toLowerCase()}</p>
        <Button size="lg" onClick={() => setDemoOpen(true)}>Book a 30-minute walkthrough <ArrowRight className="ml-2 h-4 w-4" /></Button>
      </div>
    </div>
    <BookDemoSheet open={demoOpen} onOpenChange={setDemoOpen}
      prefilledMessage={`Illustrative STR assumptions: ${assumptions.manualMinutes} manual minutes, ${assumptions.assistedMinutes} assisted minutes including review, ${assumptions.strsPerMonth} STRs/month. Not measured results.`} />
  </section>;
}
