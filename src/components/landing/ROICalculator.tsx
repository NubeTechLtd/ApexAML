import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, useInView, useMotionValue, useTransform, animate } from 'framer-motion';
import { TrendingUp, AlertTriangle, Users, Sparkles, Building2, Activity } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// ── Pricing & risk model ──────────────────────────────────────────────────
const ANALYST_SALARY = 5_000_000; // ₦/yr fully loaded
const APEXAML_TIERS: Record<string, { monthly: number; label: string }> = {
  Fintech: { monthly: 1_500_000, label: '₦1.5M / month · Growth tier' },
  DMB: { monthly: 2_000_000, label: '₦2M / month · Enterprise tier' },
  MFB: { monthly: 800_000, label: '₦800k / month · Starter tier' },
  IMTO: { monthly: 1_200_000, label: '₦1.2M / month · Cross-border tier' },
};

// CBN fine exposure model — scales with monthly transaction volume.
// Anchored to recent CBN penalties (₦10M floor, escalating with throughput).
function estimateFineExposure(volume: number, type: string): number {
  const base = 10_000_000;
  const volumeFactor = Math.min(volume / 1000, 5000) * 12_000; // up to ~₦60M
  const typeMultiplier = type === 'DMB' ? 1.6 : type === 'IMTO' ? 1.4 : 1.0;
  return Math.round((base + volumeFactor) * typeMultiplier);
}

// ── Animated number (odometer style) ─────────────────────────────────────
function AnimatedNaira({
  value,
  className = '',
  prefix = '₦',
  suffix = '',
}: {
  value: number;
  className?: string;
  prefix?: string;
  suffix?: string;
}) {
  const mv = useMotionValue(value);
  const display = useTransform(mv, (v) => `${prefix}${formatNaira(v)}${suffix}`);
  const [text, setText] = useState(`${prefix}${formatNaira(value)}${suffix}`);

  useEffect(() => {
    const controls = animate(mv, value, {
      duration: 0.9,
      ease: [0.16, 1, 0.3, 1],
    });
    const unsub = display.on('change', (latest) => setText(latest));
    return () => {
      controls.stop();
      unsub();
    };
  }, [value, mv, display]);

  return <span className={`tabular-nums ${className}`}>{text}</span>;
}

function formatNaira(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k`;
  return Math.round(n).toLocaleString();
}

function formatVolume(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(0)}k`;
  return v.toString();
}

// ── Main component ───────────────────────────────────────────────────────
export function ROICalculator() {
  const ref = useRef<HTMLDivElement | null>(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });

  const [institutionType, setInstitutionType] = useState<string>('Fintech');
  const [volume, setVolume] = useState<number>(250_000);
  const [analysts, setAnalysts] = useState<number>(3);

  const calc = useMemo(() => {
    const fineExposure = estimateFineExposure(volume, institutionType);
    const manualCost = Math.max(0, analysts) * ANALYST_SALARY;
    const tier = APEXAML_TIERS[institutionType] ?? APEXAML_TIERS.Fintech;
    const apexAnnual = tier.monthly * 12;
    // Savings model: replace ~70% of manual work + de-risk fine exposure × 0.4 probability
    const operationalSavings = Math.max(0, manualCost - apexAnnual);
    const riskSavings = Math.round(fineExposure * 0.4);
    const totalSavings = operationalSavings + riskSavings;
    return {
      fineExposure,
      manualCost,
      apexMonthly: tier.monthly,
      apexAnnual,
      tierLabel: tier.label,
      totalSavings,
    };
  }, [institutionType, volume, analysts]);

  return (
    <section className="relative py-20 px-6" style={{ backgroundColor: 'hsl(220 25% 7%)' }}>
      {/* glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-1/3 left-1/4 w-[420px] h-[420px] bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[360px] h-[360px] bg-emerald-500/10 rounded-full blur-[120px]" />
      </div>

      <div ref={ref} className="relative mx-auto max-w-6xl">
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-10 space-y-3"
        >
          <p className="inline-block rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-primary">
            Compliance ROI & Risk Calculator
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
            See your savings in 10 seconds
          </h2>
          <p className="text-sm md:text-base text-white/55 max-w-2xl mx-auto italic">
            Stop paying analysts to do data entry. Start paying them to investigate real crime.
          </p>
        </motion.div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="rounded-2xl border border-white/[0.08] bg-white/[0.025] backdrop-blur-xl shadow-[0_0_60px_-20px_hsl(var(--primary)/0.3)] overflow-hidden"
        >
          <div className="grid lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-white/[0.06]">
            {/* ── INPUTS ─────────────────────────────────────────────── */}
            <div className="p-7 md:p-9 space-y-7">
              <div>
                <p className="text-[10px] uppercase tracking-[0.18em] text-white/40 font-semibold mb-1">
                  Step 1
                </p>
                <h3 className="text-xl font-bold text-white">Your Current State</h3>
              </div>

              {/* Institution Type */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs font-medium text-white/70 uppercase tracking-wider">
                  <Building2 className="h-3.5 w-3.5 text-primary" />
                  Institution Type
                </label>
                <Select value={institutionType} onValueChange={setInstitutionType}>
                  <SelectTrigger className="bg-white/[0.04] border-white/10 text-white h-11 rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Fintech">Fintech / PSP</SelectItem>
                    <SelectItem value="DMB">DMB (Commercial Bank)</SelectItem>
                    <SelectItem value="MFB">Microfinance Bank (MFB)</SelectItem>
                    <SelectItem value="IMTO">IMTO (Cross-Border)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Volume Slider */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-xs font-medium text-white/70 uppercase tracking-wider">
                    <Activity className="h-3.5 w-3.5 text-primary" />
                    Monthly Transaction Volume
                  </label>
                  <span className="rounded-md bg-primary/15 border border-primary/25 px-2.5 py-1 text-xs font-bold text-primary tabular-nums">
                    {formatVolume(volume)}
                  </span>
                </div>
                <Slider
                  value={[volume]}
                  onValueChange={(v) => setVolume(v[0])}
                  min={10_000}
                  max={5_000_000}
                  step={10_000}
                  className="[&_[role=slider]]:bg-primary [&_[role=slider]]:border-primary"
                />
                <div className="flex justify-between text-[10px] text-white/35 font-medium">
                  <span>10k</span>
                  <span>1M</span>
                  <span>5M</span>
                </div>
              </div>

              {/* Analyst count */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs font-medium text-white/70 uppercase tracking-wider">
                  <Users className="h-3.5 w-3.5 text-primary" />
                  Current Compliance Analysts on Staff
                </label>
                <Input
                  type="number"
                  min={0}
                  max={50}
                  value={analysts}
                  onChange={(e) =>
                    setAnalysts(Math.max(0, Math.min(50, parseInt(e.target.value || '0', 10))))
                  }
                  className="bg-white/[0.04] border-white/10 text-white h-11 rounded-lg tabular-nums text-base"
                />
                <p className="text-[10px] text-white/35">
                  Average loaded cost ₦5M/year per analyst (salary + benefits + tooling)
                </p>
              </div>
            </div>

            {/* ── OUTPUTS ────────────────────────────────────────────── */}
            <div className="p-7 md:p-9 space-y-5 bg-white/[0.015]">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.18em] text-primary/80 font-semibold mb-1">
                    Step 2 · Live
                  </p>
                  <h3 className="text-xl font-bold text-white">The ApexAML Impact</h3>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 text-[10px] font-semibold text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Recalculating
                </span>
              </div>

              {/* Fine Exposure */}
              <OutputRow
                icon={<AlertTriangle className="h-4 w-4" />}
                label="Estimated CBN Fine Exposure"
                helper="Based on volume + institution risk profile"
                tone="danger"
              >
                <AnimatedNaira value={calc.fineExposure} className="text-2xl font-extrabold text-rose-400" />
              </OutputRow>

              {/* Manual cost */}
              <OutputRow
                icon={<Users className="h-4 w-4" />}
                label="Manual Compliance Cost"
                helper={`${analysts} analyst${analysts === 1 ? '' : 's'} × ₦5M / year`}
                tone="muted"
              >
                <AnimatedNaira value={calc.manualCost} className="text-xl font-bold text-white/85" />
                <span className="text-xs text-white/45 ml-1">/yr</span>
              </OutputRow>

              {/* ApexAML cost */}
              <OutputRow
                icon={<Sparkles className="h-4 w-4" />}
                label="ApexAML Cost"
                helper={calc.tierLabel}
                tone="primary"
              >
                <AnimatedNaira value={calc.apexAnnual} className="text-xl font-bold text-primary" />
                <span className="text-xs text-white/45 ml-1">/yr</span>
              </OutputRow>

              {/* Savings — hero */}
              <motion.div
                key={institutionType + volume + analysts}
                initial={{ scale: 0.98, opacity: 0.6 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="relative mt-2 rounded-xl border border-emerald-400/30 bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent p-5 overflow-hidden"
              >
                <div className="absolute inset-0 bg-emerald-400/5 blur-2xl pointer-events-none" />
                <div className="relative flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15 border border-emerald-400/30 text-emerald-400">
                    <TrendingUp className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] uppercase tracking-[0.16em] text-emerald-400/80 font-semibold mb-1">
                      Total Annual Savings
                    </p>
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <AnimatedNaira
                        value={calc.totalSavings}
                        className="text-3xl md:text-4xl font-extrabold text-emerald-400 drop-shadow-[0_0_18px_rgba(52,211,153,0.45)]"
                      />
                      <span className="text-xs text-emerald-400/70 font-medium">/ year</span>
                    </div>
                    <p className="text-[11px] text-white/45 mt-1.5 leading-relaxed">
                      Operational savings + de-risked CBN fine exposure (40% probability adjusted)
                    </p>
                  </div>
                </div>
              </motion.div>

              <p className="text-[10px] text-white/30 leading-relaxed pt-1">
                Indicative figures. Actual ROI confirmed during your scoping call.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function OutputRow({
  icon,
  label,
  helper,
  tone,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  helper: string;
  tone: 'danger' | 'muted' | 'primary';
  children: React.ReactNode;
}) {
  const toneRing =
    tone === 'danger'
      ? 'border-rose-500/15 bg-rose-500/[0.03]'
      : tone === 'primary'
        ? 'border-primary/15 bg-primary/[0.03]'
        : 'border-white/[0.06] bg-white/[0.015]';
  const iconTone =
    tone === 'danger' ? 'text-rose-400 bg-rose-500/10' : tone === 'primary' ? 'text-primary bg-primary/10' : 'text-white/50 bg-white/5';

  return (
    <div className={`flex items-center justify-between gap-4 rounded-lg border ${toneRing} p-3.5`}>
      <div className="flex items-center gap-3 min-w-0">
        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${iconTone}`}>
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold text-white/80 leading-tight">{label}</p>
          <p className="text-[10px] text-white/40 mt-0.5 truncate">{helper}</p>
        </div>
      </div>
      <div className="text-right shrink-0">{children}</div>
    </div>
  );
}
