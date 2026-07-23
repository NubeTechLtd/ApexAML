import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, TrendingDown, Sparkles } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { BookDemoSheet } from "@/components/landing/BookDemoSheet";

const MONTHLY_WORKING_HOURS = 160;
const APEX_MINUTES_PER_STR = 11;
const GROWTH_PLAN_COST = 2_800_000;

const formatNaira = (n: number) =>
  `₦${Math.round(n).toLocaleString("en-NG")}`;

export function ROICalculator() {
  const [strs, setStrs] = useState(30);
  const [hoursPerStr, setHoursPerStr] = useState(2.5);
  const [salary, setSalary] = useState(400_000);
  const [demoOpen, setDemoOpen] = useState(false);

  const calc = useMemo(() => {
    const hourlyRate = salary / MONTHLY_WORKING_HOURS;
    const manualHours = strs * hoursPerStr;
    const currentCost = manualHours * hourlyRate;
    const apexHours = strs * (APEX_MINUTES_PER_STR / 60);
    const apexCost = apexHours * hourlyRate;
    const timePct = (manualHours / MONTHLY_WORKING_HOURS) * 100;
    const savings = currentCost - apexCost;
    const timeSaved = manualHours - apexHours;
    return {
      currentCost,
      apexCost,
      manualHours,
      apexHours,
      timePct,
      savings,
      timeSaved,
      paysForItself: savings >= GROWTH_PLAN_COST,
    };
  }, [strs, hoursPerStr, salary]);

  return (
    <section
      className="relative py-20 px-6"
      style={{ backgroundColor: "hsl(220 25% 7%)" }}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/3 w-[420px] h-[420px] bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[360px] h-[360px] bg-amber-500/10 rounded-full blur-[120px]" />
      </div>

      <div className="relative mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10 space-y-3"
        >
          <p className="inline-block rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-primary">
            STR Cost Calculator
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight max-w-3xl mx-auto">
            See what manual STR filing is costing your institution
          </h2>
          <p className="text-sm md:text-base text-white/55 max-w-2xl mx-auto italic">
            Move the sliders — the calculation updates instantly
          </p>
        </motion.div>

        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] backdrop-blur-xl shadow-[0_0_60px_-20px_hsl(var(--primary)/0.3)] overflow-hidden">
          {/* Sliders */}
          <div className="p-7 md:p-9 space-y-8 border-b border-white/[0.06]">
            <SliderRow
              label="How many STRs does your team file per month?"
              value={`${strs} STRs per month`}
              min={5}
              max={200}
              step={5}
              val={strs}
              onChange={setStrs}
              scaleLabels={["5", "100", "200"]}
            />
            <SliderRow
              label="How long does each STR take to write manually?"
              value={`${hoursPerStr} hours per STR`}
              min={1}
              max={5}
              step={0.5}
              val={hoursPerStr}
              onChange={setHoursPerStr}
              scaleLabels={["1h", "3h", "5h"]}
            />
            <SliderRow
              label="Monthly salary of your compliance analyst"
              value={`${formatNaira(salary)}/month`}
              min={150_000}
              max={1_500_000}
              step={50_000}
              val={salary}
              onChange={setSalary}
              scaleLabels={["₦150k", "₦825k", "₦1.5M"]}
            />
          </div>

          {/* Results */}
          <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-white/[0.06]">
            <div className="p-7 md:p-9 space-y-3">
              <p className="text-[10px] uppercase tracking-[0.18em] text-rose-400/80 font-semibold">
                Your current cost
              </p>
              <p className="text-4xl md:text-5xl font-extrabold text-rose-400 tabular-nums drop-shadow-[0_0_18px_rgba(244,63,94,0.35)]">
                {formatNaira(calc.currentCost)}
              </p>
              <p className="text-sm text-white/70">
                {calc.manualHours.toLocaleString("en-NG", {
                  maximumFractionDigits: 1,
                })}{" "}
                hours per month on STR writing
              </p>
              <p className="text-xs text-white/45">
                That is {calc.timePct.toFixed(1)}% of your analyst's working time
              </p>
            </div>

            <div className="p-7 md:p-9 space-y-3 bg-white/[0.015]">
              <p className="text-[10px] uppercase tracking-[0.18em] text-emerald-400/80 font-semibold inline-flex items-center gap-1.5">
                <Sparkles className="h-3 w-3" /> With ApexAML
              </p>
              <p className="text-4xl md:text-5xl font-extrabold text-emerald-400 tabular-nums drop-shadow-[0_0_18px_rgba(52,211,153,0.4)]">
                {formatNaira(calc.apexCost)}
              </p>
              <p className="text-sm text-white/70">
                {calc.apexHours.toLocaleString("en-NG", {
                  maximumFractionDigits: 1,
                })}{" "}
                hours per month — AI co-pilot reduces to 11 minutes per STR
              </p>
              <p className="text-xs text-white/45">
                Time saved:{" "}
                {calc.timeSaved.toLocaleString("en-NG", {
                  maximumFractionDigits: 1,
                })}{" "}
                hours per month
              </p>
            </div>
          </div>

          {/* Savings Banner */}
          <div className="relative border-t border-amber-400/20 bg-gradient-to-br from-amber-500/15 via-amber-500/[0.08] to-transparent p-7 md:p-9">
            <div className="absolute inset-0 bg-amber-400/5 blur-2xl pointer-events-none" />
            <div className="relative flex flex-col md:flex-row md:items-center gap-6 justify-between">
              <div className="flex items-start gap-4 min-w-0">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 border border-amber-400/30 text-amber-300">
                  <TrendingDown className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-base md:text-lg text-white leading-snug">
                    You save{" "}
                    <span className="font-extrabold text-amber-300 tabular-nums">
                      {formatNaira(calc.savings)}
                    </span>{" "}
                    per month on STR writing alone — before accounting for
                    faster investigations, fewer CBN fines, and reduced analyst
                    burnout.
                  </p>
                  <p className="text-xs text-white/55 mt-2">
                    ApexAML Growth Plan costs{" "}
                    {formatNaira(GROWTH_PLAN_COST)}/month. Your estimated STR
                    saving: {formatNaira(calc.savings)}/month.
                  </p>
                  {calc.paysForItself && (
                    <p className="mt-3 text-sm font-bold text-emerald-400">
                      ApexAML pays for itself through STR efficiency alone.
                    </p>
                  )}
                </div>
              </div>

              <Button
                onClick={() => setDemoOpen(true)}
                size="lg"
                className="shrink-0 bg-amber-400 hover:bg-amber-300 text-slate-950 font-semibold shadow-[0_0_28px_-6px_rgba(251,191,36,0.6)]"
              >
                Book a demo to confirm these numbers
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <BookDemoSheet
        open={demoOpen}
        onOpenChange={setDemoOpen}
        prefilledMessage={`STR cost calculator: current ${formatNaira(
          calc.currentCost,
        )}/mo, projected ${formatNaira(
          calc.apexCost,
        )}/mo with ApexAML, monthly saving ${formatNaira(calc.savings)}.`}
      />
    </section>
  );
}

function SliderRow({
  label,
  value,
  min,
  max,
  step,
  val,
  onChange,
  scaleLabels,
}: {
  label: string;
  value: string;
  min: number;
  max: number;
  step: number;
  val: number;
  onChange: (v: number) => void;
  scaleLabels: [string, string, string];
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <label className="text-sm font-medium text-white/80">{label}</label>
        <span className="rounded-md bg-primary/15 border border-primary/25 px-2.5 py-1 text-xs font-bold text-primary tabular-nums">
          {value}
        </span>
      </div>
      <Slider
        value={[val]}
        onValueChange={(v) => onChange(v[0])}
        min={min}
        max={max}
        step={step}
        className="[&_[role=slider]]:bg-primary [&_[role=slider]]:border-primary"
      />
      <div className="flex justify-between text-[10px] text-white/35 font-medium">
        <span>{scaleLabels[0]}</span>
        <span>{scaleLabels[1]}</span>
        <span>{scaleLabels[2]}</span>
      </div>
    </div>
  );
}
