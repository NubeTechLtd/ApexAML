import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, ArrowRight, Sparkles, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

type BillingCycle = 'monthly' | 'annual';

interface Tier {
  name: string;
  audience: string;
  monthlyPrice: number | null; // null = custom / per-tx
  priceDisplay?: (cycle: BillingCycle) => { primary: string; sub?: string; note: string };
  popular?: boolean;
  accent?: 'primary' | 'teal';
  badge?: string;
  features: string[];
  highlightFeatures?: string[];
  limits?: string[];
  ctaLabel: string;
  ctaMessage?: string;
}

const formatNaira = (n: number) => {
  if (n >= 1_000_000) return `₦${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`;
  if (n >= 1_000) return `₦${(n / 1_000).toLocaleString('en-US')}k`;
  return `₦${n.toLocaleString('en-US')}`;
};

const TIERS: Tier[] = [
  {
    name: 'Essential',
    audience: 'MFBs · Payment Initiators',
    monthlyPrice: 350_000,
    features: [
      'BVN/NIN verification',
      'Sanctions & PEP screening',
      'Basic transaction monitoring (10 rules)',
      'STR/CTR data generation in goAML format',
      'Immutable audit trail',
      'CBN roadmap template PDF download',
      'Email support',
    ],
    limits: [
      'Max 5,000 monitored customers',
      'Max 50,000 transactions/month',
      'No AI STR co-pilot',
      'No case management workspace',
    ],
    ctaLabel: 'Start with Essential',
  },
  {
    name: 'Starter',
    audience: 'MFBs & small fintechs',
    monthlyPrice: 800_000,
    features: [
      'Everything in Essential',
      'Identity & KYC (BVN/NIN) workspace',
      'Sanctions & PEP screening',
      'Basic transaction monitoring',
      'STR XML export (goAML)',
      'CBN roadmap template',
    ],
    ctaLabel: 'Book Demo',
  },
  {
    name: 'Growth',
    audience: 'PSPs & Tier-3 banks',
    monthlyPrice: 2_200_000,
    popular: true,
    accent: 'primary',
    features: ['Everything in Starter'],
    highlightFeatures: [
      'AI STR Co-Pilot',
      'Adverse media scanning',
      'Regulatory change alerts',
      'No-code rule sandbox',
    ],
    ctaLabel: 'Book Demo',
  },
  {
    name: 'IMTO Pack',
    audience: 'International money transfer operators',
    monthlyPrice: null,
    accent: 'teal',
    badge: 'For WorldRemit · LemFi · Sendwave',
    priceDisplay: () => ({
      primary: '₦7',
      sub: 'per transaction screened',
      note: 'minimum ₦2,500,000/month · e.g. 500,000 tx = ₦3,500,000',
    }),
    features: ['Everything in Growth'],
    highlightFeatures: [
      '$200 Cash-Limit Smurfing Detector',
      'Inbound-only & Naira-only validation',
      '24-hour Cross-Border STR auto-countdown',
      'Phantom Payroll network detector',
      'Settlement Account Commingling alerts (May 2026 CBN Circular)',
      'Partner Bank Officer dashboard (2 partner banks included)',
      'Monthly IMTO CBN compliance report',
    ],
    ctaLabel: 'Get IMTO pricing',
    ctaMessage: "I'm interested in IMTO Pack pricing",
  },
  {
    name: 'Enterprise',
    audience: 'Tier-1/2 banks & MMOs',
    monthlyPrice: null,
    priceDisplay: () => ({ primary: 'Custom', note: 'pricing' }),
    features: ['Everything in Growth'],
    highlightFeatures: [
      'Graph network analysis',
      'Dedicated customer success manager',
      'White-label deployment',
      'NFIU API direct submit',
    ],
    ctaLabel: 'Book Demo',
  },
];

const SERVICES = [
  {
    name: 'CBN Roadmap Submission',
    price: '₦200,000 one-time',
    desc: 'Co-authored, CBN-formatted, ready to submit by June 10. Free with any annual plan.',
    cta: 'Book service',
  },
  {
    name: 'Implementation & Onboarding',
    price: 'From ₦150,000 one-time',
    desc: 'API integration and staff walkthrough in 5 business days.',
    cta: 'Enquire',
  },
  {
    name: 'Compliance Team Training',
    price: '₦120,000 per session',
    desc: '2-hour live session on CBN circular requirements and ApexAML workflow.',
    cta: 'Book training',
  },
];

interface Props {
  onBookDemo: (prefilledMessage?: string) => void;
}

export function PricingSection({ onBookDemo }: Props) {
  const [cycle, setCycle] = useState<BillingCycle>('monthly');

  const renderPrice = (tier: Tier) => {
    if (tier.priceDisplay) {
      const p = tier.priceDisplay(cycle);
      return (
        <>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl md:text-4xl font-extrabold text-white tracking-tight tabular-nums">
              {p.primary}
            </span>
            {p.sub && <span className="text-xs text-white/50 font-medium">{p.sub}</span>}
          </div>
          <p className="text-[11px] text-white/45 mt-1.5">{p.note}</p>
        </>
      );
    }
    if (tier.monthlyPrice == null) return null;
    const monthly = tier.monthlyPrice;
    const annualMonthly = Math.round(monthly * 0.85);
    const isAnnual = cycle === 'annual';
    const shown = isAnnual ? annualMonthly : monthly;
    const annualTotal = annualMonthly * 12;
    return (
      <>
        <div className="flex items-baseline gap-1">
          <span className="text-3xl md:text-4xl font-extrabold text-white tracking-tight tabular-nums">
            {formatNaira(shown)}
          </span>
          <span className="text-xs text-white/40 font-medium">/month, from</span>
        </div>
        {isAnnual && (
          <p className="text-[11px] text-risk-low mt-1.5 font-medium">
            {formatNaira(annualTotal)} billed annually · 15% off
          </p>
        )}
        {!isAnnual && (
          <p className="text-[11px] text-white/30 mt-1.5">
            or {formatNaira(annualMonthly)}/mo billed annually
          </p>
        )}
      </>
    );
  };

  return (
    <section id="pricing" className="relative py-24 px-6">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/[0.02] to-transparent pointer-events-none" />
      <div className="relative mx-auto max-w-7xl space-y-12">
        {/* Heading */}
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <p className="text-xs uppercase tracking-[0.2em] text-primary font-semibold">Pricing</p>
          <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
            One plan for every regulated institution
          </h2>
          <p className="text-white/45 text-sm">
            Less than the cost of a single compliance analyst — without the hiring, training, or attrition risk.
          </p>
        </div>

        {/* Urgency banner */}
        <div className="mx-auto max-w-3xl">
          <div className="relative flex items-start gap-3 rounded-xl border border-risk-high/40 bg-risk-high/10 px-4 py-3 overflow-hidden">
            <span className="absolute inset-0 bg-risk-high/10 animate-pulse pointer-events-none" />
            <AlertTriangle className="relative h-4 w-4 text-risk-high shrink-0 mt-0.5" />
            <p className="relative text-sm text-white/85 leading-relaxed">
              <span className="font-semibold text-risk-high">First month free</span> for institutions
              submitting their CBN roadmap before <span className="font-semibold">10 June 2026</span> —
              applies to all annual plans.
            </p>
          </div>
        </div>

        {/* Billing toggle */}
        <div className="flex justify-center">
          <div className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] p-1">
            <button
              type="button"
              onClick={() => setCycle('monthly')}
              className={`px-5 h-9 rounded-full text-sm font-medium transition-colors ${
                cycle === 'monthly' ? 'bg-white text-slate-950' : 'text-white/60 hover:text-white'
              }`}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setCycle('annual')}
              className={`px-5 h-9 rounded-full text-sm font-medium transition-colors inline-flex items-center gap-2 ${
                cycle === 'annual' ? 'bg-primary text-primary-foreground' : 'text-white/60 hover:text-white'
              }`}
            >
              Annual
              <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                cycle === 'annual' ? 'bg-primary-foreground/15 text-primary-foreground' : 'bg-risk-low/20 text-risk-low'
              }`}>
                Save 15%
              </span>
            </button>
          </div>
        </div>

        {/* Tier grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-5">
          {TIERS.map((tier, i) => {
            const isPopular = !!tier.popular;
            const isTeal = tier.accent === 'teal';
            return (
              <motion.div
                key={tier.name}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.4, delay: i * 0.06, ease: 'easeOut' }}
                className={`relative rounded-2xl backdrop-blur-md p-6 flex flex-col ${
                  isPopular
                    ? 'border-2 border-primary bg-primary/[0.04] shadow-[0_0_60px_-15px_hsl(var(--primary)/0.4)]'
                    : isTeal
                    ? 'border-2 border-teal-400/60 bg-teal-400/[0.04] shadow-[0_0_40px_-15px_rgb(45_212_191/0.5)]'
                    : 'border border-white/[0.08] bg-white/[0.03]'
                }`}
              >
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary text-primary-foreground px-3 py-1 text-[10px] font-bold uppercase tracking-wider shadow-lg">
                      <Sparkles className="h-3 w-3" />
                      Most popular
                    </span>
                  </div>
                )}
                {tier.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-max max-w-[90%]">
                    <span className="inline-flex items-center rounded-full bg-teal-400 text-slate-950 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider shadow-lg whitespace-nowrap">
                      {tier.badge}
                    </span>
                  </div>
                )}

                <div className="space-y-1.5">
                  <h3 className="text-lg font-bold text-white tracking-tight">{tier.name}</h3>
                  <p className="text-[11px] uppercase tracking-wider text-white/40 font-medium">
                    {tier.audience}
                  </p>
                </div>

                <div className="mt-5 pb-5 border-b border-white/[0.06] min-h-[88px]">
                  {renderPrice(tier)}
                </div>

                <ul className="mt-5 space-y-2.5 flex-1">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-[13px] text-white/65">
                      <Check className="h-3.5 w-3.5 text-white/40 shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                  {tier.highlightFeatures?.map((f) => (
                    <li
                      key={f}
                      className={`flex items-start gap-2 text-[13px] font-medium ${
                        isTeal ? 'text-teal-300' : 'text-risk-low'
                      }`}
                    >
                      <Check className={`h-3.5 w-3.5 shrink-0 mt-0.5 ${isTeal ? 'text-teal-300' : 'text-risk-low'}`} />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                {tier.limits && (
                  <ul className="mt-4 pt-4 border-t border-white/[0.06] space-y-1.5">
                    {tier.limits.map((l) => (
                      <li key={l} className="text-[11px] text-white/35 leading-relaxed">
                        · {l}
                      </li>
                    ))}
                  </ul>
                )}

                <Button
                  onClick={() => onBookDemo(tier.ctaMessage)}
                  size="lg"
                  className={`mt-6 w-full rounded-lg h-11 font-semibold text-sm group ${
                    isPopular
                      ? 'bg-primary hover:bg-primary/90 text-primary-foreground'
                      : isTeal
                      ? 'bg-teal-400 hover:bg-teal-300 text-slate-950'
                      : 'bg-white/[0.06] hover:bg-white/[0.1] text-white border border-white/10'
                  }`}
                >
                  {tier.ctaLabel}
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                </Button>
              </motion.div>
            );
          })}
        </div>

        {/* Professional Services */}
        <div className="pt-8 space-y-5">
          <div className="text-center space-y-2">
            <p className="text-[11px] uppercase tracking-[0.2em] text-white/40 font-semibold">
              Professional Services
            </p>
            <h3 className="text-xl md:text-2xl font-semibold text-white tracking-tight">
              Add-on services to accelerate your rollout
            </h3>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {SERVICES.map((s) => (
              <div
                key={s.name}
                className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-5 flex flex-col gap-3"
              >
                <div>
                  <p className="text-sm font-semibold text-white">{s.name}</p>
                  <p className="text-xs text-primary mt-0.5 font-medium tabular-nums">{s.price}</p>
                </div>
                <p className="text-xs text-white/55 leading-relaxed flex-1">{s.desc}</p>
                <Button
                  onClick={() => onBookDemo(`I'd like to ${s.cta.toLowerCase()}: ${s.name}`)}
                  variant="ghost"
                  size="sm"
                  className="self-start text-primary hover:text-primary hover:bg-primary/10 px-2 -ml-2 h-8 text-xs font-semibold"
                >
                  {s.cta} <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Footnote */}
        <p className="text-center text-[11px] text-white/40 max-w-3xl mx-auto leading-relaxed pt-2">
          All prices in Nigerian Naira (NGN). Annual billing charged upfront. Monthly billing available
          without discount. Cancel with 30 days notice. Prices exclude VAT. NDPA 2023 compliant.
        </p>
      </div>
    </section>
  );
}
