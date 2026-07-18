import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, ArrowRight, Sparkles, AlertTriangle, Settings, Info, Crown, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCBNRate } from '@/hooks/useCBNRate';

type BillingCycle = 'monthly' | 'annual';

interface Tier {
  name: string;
  audience: string;
  monthlyPrice: number | null;
  usdApprox?: number; // monthly USD approx
  priceDisplay?: (cycle: BillingCycle) => { primary: string; sub?: string; note?: string; annualNote?: string; usd?: string };
  popular?: boolean;
  accent?: 'primary' | 'teal';
  badge?: string;
  features: string[];
  highlightFeatures?: string[];
  limits?: string[];
  onboardingFee?: string;
  trial?: string;
  offer?: string;
  ctaLabel: string;
  ctaMessage?: string;
  calcBox?: string;
}

const formatNGN = (n: number) =>
  new Intl.NumberFormat('en-NG', { maximumFractionDigits: 0 }).format(n);

const TIERS: Tier[] = [
  {
    name: 'Essential',
    audience: 'Microfinance Banks · Payment Initiators · Early-stage fintechs',
    monthlyPrice: 550_000,
    usdApprox: 348,
    features: [
      '100 BVN/NIN verification checks per month',
      'Sanctions screening — OFAC, UN, EU, NFIU domestic lists',
      'Transaction monitoring — 10 pre-built Nigerian typology rules',
      'STR and CTR data generation in NFIU goAML format',
      'Immutable audit trail — append-only, SHA-256 hashed',
      'CBN roadmap template PDF — branded, submission-ready',
      'Email support — 48-hour response',
      '5 user accounts included',
    ],
    limits: [
      'Maximum 5,000 monitored customers',
      'Additional BVN checks: ₦650 each',
      'Initial database import: ₦500 per record (one-time)',
      'No AI STR co-pilot · No case management workspace',
    ],
    onboardingFee: '₦100,000 onboarding fee — charged at contract signing*',
    trial: '14-day free trial — 50 BVN checks included',
    ctaLabel: 'Start Essential',
  },
  {
    name: 'Starter',
    audience: 'PSPs · Growing fintechs · Mobile Money Operators',
    monthlyPrice: 1_100_000,
    usdApprox: 696,
    features: [
      'Everything in Essential',
      '250 BVN/NIN verification checks per month',
      'PEP registry screening — domestic and international',
      'Transaction monitoring — 20 pre-built rules',
      'Full case management workspace',
      'One-click goAML XML export to NFIU portal',
      'Priority email and WhatsApp support — 24-hour response',
      '10 user accounts included',
    ],
    limits: [
      'Additional BVN checks: ₦600 each',
      'Database import: ₦450 per record',
    ],
    onboardingFee: '₦200,000 onboarding fee — charged at contract signing*',
    trial: '14-day free trial',
    ctaLabel: 'Start Starter',
  },
  {
    name: 'Growth',
    audience: 'Tier-3 Banks · Larger PSPs · MMOs',
    monthlyPrice: 2_800_000,
    usdApprox: 1772,
    popular: true,
    accent: 'primary',
    features: ['Everything in Starter'],
    highlightFeatures: [
      '600 BVN/NIN verification checks per month',
      'AI STR Co-Pilot — from 3 hours to 11 minutes per report',
      'Adverse media scanner — Nigerian press sources included',
      'No-code rule sandbox — test before deploying',
      'CBN model validation KPI reporting',
      'Regulatory change alerts — CBN circular monitoring',
      'Dedicated Slack support channel — 4-hour response',
      '20 user accounts included',
    ],
    limits: [
      'Additional BVN checks: ₦550 each',
      'Database import: ₦400 per record',
    ],
    onboardingFee: '₦350,000 onboarding fee — charged at contract signing*',
    offer: 'First month free for all new annual plan clients — founding client slots remaining',
    ctaLabel: 'Start Growth',
  },
  {
    name: 'IMTO Pack',
    audience: 'International money transfer operators',
    monthlyPrice: null,
    accent: 'teal',
    badge: 'For WorldRemit · LemFi · Sendwave · Ria',
    priceDisplay: (cycle) => ({
      primary: '₦9',
      sub: 'per transaction screened',
      note: 'Minimum billing: ₦3,500,000 per month',
      annualNote: cycle === 'annual' ? '₦7.65 per transaction on annual billing' : undefined,
      usd: '≈ $0.006 per transaction',
    }),
    calcBox: '500,000 transactions/month = ₦4,500,000 · Minimum billing = ₦3,500,000',
    features: ['Everything in Growth'],
    highlightFeatures: [
      '$200 cash-limit smurfing detector — CBN IMTO Guidelines §4.2',
      'Inbound-only and Naira-only settlement validation',
      '24-hour cross-border STR auto-countdown',
      'Phantom payroll network detector — B2P and B2B',
      'Settlement account commingling alerts',
      'Partner bank officer dashboard — 2 partner banks included',
      '1,000 beneficiary verification checks per month',
      'Monthly IMTO compliance report for CBN',
      'Dedicated compliance hotline — 2-hour response',
    ],
    limits: ['Additional beneficiary checks: ₦600 each'],
    onboardingFee: '₦600,000 onboarding fee — charged at contract signing*',
    offer: 'First month free for all new annual plan clients',
    ctaLabel: 'Get IMTO pricing',
    ctaMessage: 'I am interested in the IMTO Pack pricing for [institution name]',
  },
  {
    name: 'Enterprise',
    audience: 'Tier-1 & 2 Banks · DFIs · Conglomerates',
    monthlyPrice: null,
    accent: 'primary',
    badge: 'Custom',
    priceDisplay: () => ({
      primary: 'Custom',
      sub: 'pricing',
      note: 'Based on transaction volume, entity count, and integration complexity',
    }),
    features: ['Everything in Growth + IMTO Pack'],
    highlightFeatures: [
      'Unlimited BVN/NIN & beneficiary verification checks',
      'Dedicated isolated infrastructure (single-tenant AWS)',
      'Custom AI/ML model training on your institution\'s historical data',
      'On-premise or private cloud deployment option',
      'White-label compliance portal with your branding',
      'API-first architecture — full REST + webhook coverage',
      'Quarterly CBN readiness audit by ApexAML consultants',
      'Named account manager + 24/7 compliance hotline',
      'NDPR 2023 & GDPR dual compliance certification support',
      'Custom SLA: 99.99% uptime, 15-minute incident response',
    ],
    limits: ['Minimum contract: 24 months'],
    onboardingFee: 'Custom — scoping workshop included',
    offer: 'Pilot program: 90-day proof-of-concept at 50% of projected annual rate',
    ctaLabel: 'Talk to Sales',
    ctaMessage: "I'm interested in Enterprise pricing for my institution",
  },
];

const SERVICES = [
  {
    name: 'CBN Roadmap Submission',
    price: '₦200,000 one-time',
    desc: 'CBN-formatted, submission-ready by June 10. Free with any annual plan.',
    cta: 'Book service',
  },
  {
    name: 'Onboarding & Integration',
    price: 'From ₦100,000 one-time',
    desc: 'API setup, rule config, and team walkthrough in 5 business days.',
    cta: 'Enquire',
  },
  {
    name: 'Compliance Training',
    price: '₦120,000 per session',
    desc: '2-hour live session on CBN circular requirements and ApexAML workflows.',
    cta: 'Book session',
  },
];

interface Programme {
  name: string;
  price: string;
  timeline: string;
  idealFor: string;
  deliverables: string[];
}

const PROGRAMMES: Programme[] = [
  {
    name: 'Essential Programme',
    price: '₦1,500,000',
    timeline: '10 business days',
    idealFor: 'MFBs and small fintechs',
    deliverables: [
      'Historical customer BVN database import — up to 5,000 records',
      'CBN roadmap alignment — platform configured to match your submitted June 2026 roadmap commitments',
      '1-hour compliance team training session',
      'Signed CBN completion certificate on ApexAML letterhead',
    ],
  },
  {
    name: 'Starter Programme',
    price: '₦3,000,000',
    timeline: '15 business days',
    idealFor: 'PSPs and growing fintechs',
    deliverables: [
      'Everything in Essential Programme',
      'Core banking API integration — our team works alongside your IT team until live',
      '3 to 5 custom detection rules built for your specific transaction channels',
      'PEP registry configuration',
      '30-day hypercare — named contact monitors your alert queue post go-live',
    ],
  },
  {
    name: 'Growth Programme',
    price: '₦6,000,000',
    timeline: '20 business days',
    idealFor: 'Tier-3 banks and larger PSPs',
    deliverables: [
      'Everything in Starter Programme',
      '90-day historical transaction analysis — surfaces missed suspicious patterns from your previous system',
      'Full RBAC configuration mapped to your team structure',
      'AI STR co-pilot calibration to your institution\'s writing style',
      'Formal go-live report — 5 pages, submitted to CBN as implementation evidence',
    ],
  },
  {
    name: 'IMTO Programme',
    price: '₦12,000,000',
    timeline: '25 business days',
    idealFor: 'IMTOs — WorldRemit, LemFi, Sendwave, Ria',
    deliverables: [
      'Everything in Growth Programme',
      'Full IMTO Regulatory Pack configuration — all 6 CBN-specific rules calibrated to your transaction volumes',
      'Settlement account registry — populated with your full correspondent bank list',
      'Partner bank dashboard setup for up to 2 partner banks',
      'One full day onsite in Lagos or Abuja with your compliance, treasury, and IT teams',
      '10-page IMTO compliance report mapping every IMTO CBN obligation to the configured ApexAML feature',
    ],
  },
];

interface Props {
  onBookDemo: (prefilledMessage?: string) => void;
}

export function PricingSection({ onBookDemo }: Props) {
  const [cycle, setCycle] = useState<BillingCycle>('monthly');
  const { rate } = useCBNRate();

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
          {p.note && <p className="text-[11px] text-white/55 mt-1.5">{p.note}</p>}
          {p.annualNote && <p className="text-[11px] text-risk-low mt-1 font-medium">{p.annualNote}</p>}
          {p.usd && <p className="text-[10px] text-white/35 mt-1">{p.usd}</p>}
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
            ₦{formatNGN(shown)}
          </span>
          <span className="text-xs text-white/40 font-medium">/month</span>
        </div>
        {isAnnual ? (
          <p className="text-[11px] text-risk-low mt-1.5 font-medium">
            ₦{formatNGN(annualTotal)} billed annually · 15% off
          </p>
        ) : (
          <p className="text-[11px] text-white/35 mt-1.5">
            or ₦{formatNGN(annualMonthly)}/mo billed annually (save 15%)
          </p>
        )}
        {tier.usdApprox && (
          <p className="text-[10px] text-white/35 mt-1">
            ≈ ${tier.usdApprox.toLocaleString()}/month at ₦{rate}/$1
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

        {/* Founding Client Programme banner */}
        <div className="space-y-2">
          <div
            className="relative rounded-xl border border-white/10 bg-white/[0.03] border-l-2 p-5 md:p-6 flex flex-col md:flex-row gap-6"
            style={{ borderLeftColor: '#D4A843', borderLeftWidth: '2px' }}
          >
            {/* Left */}
            <div className="md:w-3/5 space-y-2.5">
              <div className="flex items-center gap-2.5">
                <Crown className="h-5 w-5" style={{ color: '#D4A843' }} />
                <h3 className="text-white font-semibold" style={{ fontSize: '16px' }}>
                  Founding Client Programme — First 5 implementation clients only
                </h3>
              </div>
              <p className="text-white/60" style={{ fontSize: '13px', lineHeight: 1.7 }}>
                The first 5 institutions to sign any Professional Implementation Programme receive a
                permanent 35% discount on the implementation fee — applied at contract signing and
                carried forward to any future engagements. Also included: direct WhatsApp access to
                the ApexAML founders, your institution's compliance rules pre-configured before
                go-live, and your logo on the ApexAML client reference page.
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() =>
                    onBookDemo(
                      'I am interested in the Founding Client Programme. Please reserve a slot for [institution name].'
                    )
                  }
                  className="inline-flex items-center gap-1.5 text-sm font-medium transition-colors hover:opacity-80"
                  style={{ color: '#D4A843' }}
                >
                  Apply for founding client status <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Right */}
            <div className="md:w-2/5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase tracking-wider text-white/60 font-semibold">
                  Founding client slots
                </span>
                <span className="text-[11px] text-white/50">0 / 5</span>
              </div>
              <div className="h-2 w-full rounded-full bg-white/[0.06] overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: '0%', backgroundColor: '#D4A843' }}
                />
              </div>
              <p className="text-[11px] text-white/50">0 of 5 slots claimed — 5 remaining</p>
              <div className="pt-2 border-t border-white/5 space-y-1 text-[11px] text-white/60">
                <div className="flex justify-between"><span>Essential</span><span><span style={{ color: '#D4A843' }} className="font-semibold">₦975,000</span> <span className="text-white/35 line-through ml-1">₦1,500,000</span></span></div>
                <div className="flex justify-between"><span>Starter</span><span><span style={{ color: '#D4A843' }} className="font-semibold">₦1,950,000</span> <span className="text-white/35 line-through ml-1">₦3,000,000</span></span></div>
                <div className="flex justify-between"><span>Growth</span><span><span style={{ color: '#D4A843' }} className="font-semibold">₦3,900,000</span> <span className="text-white/35 line-through ml-1">₦6,000,000</span></span></div>
                <div className="flex justify-between"><span>IMTO</span><span><span style={{ color: '#D4A843' }} className="font-semibold">₦7,800,000</span> <span className="text-white/35 line-through ml-1">₦12,000,000</span></span></div>
              </div>
            </div>
          </div>
          <p className="text-[11px] text-white/40 text-center md:text-left px-1">
            Founding client discount is permanent — it applies to all future engagements with ApexAML, not just the first implementation.
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
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
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
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-lg font-bold text-white tracking-tight">{tier.name}</h3>
                    {cycle === 'annual' && tier.monthlyPrice != null && (
                      <span className="inline-flex items-center rounded-full bg-risk-low/15 border border-risk-low/40 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-risk-low">
                        Save 15%
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] uppercase tracking-wider text-white/40 font-medium">
                    {tier.audience}
                  </p>
                </div>

                <div className="mt-5 pb-5 border-b border-white/[0.06] min-h-[110px]">
                  {renderPrice(tier)}
                </div>

                {tier.calcBox && (
                  <div className="mt-4 rounded-lg border border-teal-400/20 bg-teal-400/[0.04] px-3 py-2">
                    <p className="text-[10px] uppercase tracking-wider text-teal-300/80 font-semibold mb-1">Example</p>
                    <p className="text-[11px] text-white/70 leading-relaxed">{tier.calcBox}</p>
                  </div>
                )}

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

                {(tier.onboardingFee || tier.trial || tier.offer) && (
                  <div className="mt-4 pt-4 border-t border-white/[0.06] space-y-1.5">
                    {tier.onboardingFee && (
                      <p className="text-[11px] text-white/55">
                        <span className="text-white/40 uppercase tracking-wider text-[9px] font-semibold">Onboarding:</span>{' '}
                        {tier.onboardingFee}
                      </p>
                    )}
                    {tier.trial && (
                      <p className="text-[11px] text-primary font-medium">{tier.trial}</p>
                    )}
                    {tier.offer && (
                      <p className="text-[11px] text-risk-high font-medium leading-snug">{tier.offer}</p>
                    )}
                  </div>
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

        {/* Professional Implementation Programme */}
        <div className="pt-8">
          <div className="border-t border-white/10 pt-10 space-y-6">
            <div className="max-w-3xl mx-auto text-center space-y-3">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-white/60 font-semibold">
                <Settings className="h-3 w-3" />
                Implementation
              </span>
              <h3 className="text-[18px] font-semibold text-white tracking-tight">
                Professional Implementation Programme
              </h3>
              <p className="text-[13px] text-white/55 leading-relaxed">
                A structured delivery engagement with defined phases, deliverables, and sign-off criteria. Produces the CBN completion certificate and go-live documentation your supervisory file requires. Optional but actively recommended for all clients.
              </p>
            </div>

            <div className="max-w-3xl mx-auto flex items-start gap-3 rounded-lg border-l-2 border-l-primary border border-primary/20 bg-primary/[0.06] px-4 py-3">
              <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <p className="text-[12.5px] text-white/75 leading-relaxed">
                The onboarding fee gets the platform live in 5 days. The Implementation Programme configures it specifically to your institution, integrates it with your existing systems, and documents it for your CBN examination file.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-5 pt-2">
              {PROGRAMMES.map((p) => (
                <div
                  key={p.name}
                  className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 flex flex-col gap-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="text-base font-semibold text-white tracking-tight">{p.name}</h4>
                      <p className="text-[11px] uppercase tracking-wider text-white/40 font-medium mt-1">
                        Ideal for: {p.idealFor}
                      </p>
                    </div>
                    <span className="shrink-0 inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-primary whitespace-nowrap">
                      {p.timeline}
                    </span>
                  </div>

                  <div className="flex items-baseline gap-1.5 pb-4 border-b border-white/[0.06]">
                    <span className="text-2xl font-extrabold text-white tabular-nums tracking-tight">{p.price}</span>
                    <span className="text-xs text-white/45 font-medium">(one-time)</span>
                  </div>

                  <ul className="space-y-2.5 flex-1">
                    {p.deliverables.map((d) => (
                      <li key={d} className="flex items-start gap-2 text-[13px] text-white/70 leading-relaxed">
                        <Check className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                        <span>{d}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <p className="text-center text-[12px] text-white/40 max-w-3xl mx-auto leading-relaxed pt-2">
              For comparison: Autogon AI charges ₦31,600,000 for setup alone. Our IMTO Programme at ₦12,000,000 delivers faster implementation, more documentation, and a named onsite session.
            </p>

            <div className="flex justify-center pt-2">
              <Button
                onClick={() => onBookDemo('Professional Implementation Programme enquiry')}
                size="lg"
                className="rounded-lg h-11 px-6 font-semibold text-sm bg-white/[0.06] hover:bg-white/[0.1] text-white border border-white/10 group"
              >
                Enquire about implementation
                <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
              </Button>
            </div>
          </div>
        </div>

        {/* Standalone Services */}
        <div className="pt-4 space-y-6">
          <div className="text-center space-y-3">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] uppercase tracking-[0.15em] text-white/60 font-semibold">
              <Briefcase className="h-3 w-3" /> Services
            </span>
            <h3 className="text-2xl md:text-3xl font-semibold text-white tracking-tight">
              Standalone compliance services
            </h3>
            <p className="text-[13px] text-white/55 max-w-2xl mx-auto leading-relaxed">
              Available to all Nigerian regulated institutions — no ApexAML subscription required. Invoice provided for institutional procurement.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                name: 'CBN Roadmap Co-Authoring',
                price: '₦200,000 (one-time)',
                desc: 'CBN-formatted AML implementation roadmap co-authored with your compliance team. Submission-ready for the CBN Compliance Department. Included free with any annual plan.',
                cta: 'Book service',
                msg: 'CBN Roadmap Co-Authoring enquiry',
              },
              {
                name: 'Examination Readiness Assessment',
                price: 'From ₦800,000',
                desc: 'A structured 2 to 5 day assessment simulating a CBN examination. We test your detection capabilities, review your STR filing records, and produce a formal readiness report with pass or fail rating per CBN standard.',
                cta: 'Enquire',
                msg: 'Examination Readiness Assessment enquiry',
              },
              {
                name: 'AI Model Validation (Independent)',
                price: 'From ₦1,500,000 per annual validation',
                desc: 'Independent validation of your AML AI and ML models as required by CBN Standard 5.5. Covers accuracy, bias testing, performance drift, and fairness audit. Produces the annual validation report your CBN examination file requires.',
                cta: 'Enquire',
                msg: 'AI Model Validation enquiry',
              },
              {
                name: 'Compliance Staff Training',
                price: '₦120,000 per session',
                desc: '2-hour live training for your compliance team covering CBN typologies, STR filing workflow, and NFIU reporting obligations. Delivered virtually or in Lagos. Up to 20 participants.',
                cta: 'Book training',
                msg: 'Compliance Staff Training booking',
              },
              {
                name: 'Board AML Reporting (add-on)',
                price: '₦150,000 per month',
                desc: 'Quarterly auto-generated board AML report pulled from your platform data. Alert trends, STR filing compliance, KYC distribution, and CBN deadline status. Delivered as a branded PDF 48 hours before your board meeting.',
                cta: 'Add to subscription',
                msg: 'Board AML Reporting add-on enquiry',
              },
              {
                name: 'NFIU goAML Filing Support',
                price: '₦20,000 per STR filing',
                desc: 'We generate the goAML XML file and manage the NFIU portal upload on your behalf. Filing confirmation receipt provided. For institutions that detect suspicious activity but lack the technical capacity to produce the correct XML format.',
                cta: 'Enquire',
                msg: 'NFIU goAML Filing Support enquiry',
              },
              {
                name: 'MLRO as a Service',
                price: 'From ₦350,000 per month',
                desc: 'A named, qualified Money Laundering Reporting Officer serves as your designated compliance officer for CBN purposes. Signs off all STR filings, attends board meetings quarterly, and manages your CBN regulatory relationship. For MFBs that need the regulatory requirement fulfilled without a full-time hire.',
                cta: 'Enquire',
                msg: 'MLRO as a Service enquiry',
              },
            ].map((s) => (
              <div
                key={s.name}
                className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-5 flex flex-col gap-3 hover:border-white/[0.14] transition-colors"
              >
                <div>
                  <p className="text-sm font-semibold text-white leading-snug">{s.name}</p>
                  <p className="text-xs text-primary mt-1 font-semibold tabular-nums">{s.price}</p>
                </div>
                <p className="text-xs text-white/55 leading-relaxed flex-1">{s.desc}</p>
                <button
                  type="button"
                  onClick={() => onBookDemo(s.msg)}
                  className="self-start inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
                >
                  {s.cta} <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
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
        <div className="text-center text-[11px] text-white/45 max-w-3xl mx-auto leading-relaxed pt-2 space-y-2">
          <p>
            All prices in Nigerian Naira (NGN), exclusive of 7.5% VAT. ApexAML is VAT-registered with FIRS.
          </p>
          <p>
            Annual billing: 100% upfront. Monthly billing: due within 7 days of invoice. 5% surcharge applies after 15 days.
          </p>
          <p>
            Prices reviewed quarterly based on CBN official rate (currently ₦{rate}/$1). If NGN depreciates more than 15% in any quarter, pricing adjusts proportionally with 30 days notice.
          </p>
          <p>
            Annual prices increase by a maximum of 15% at each renewal date with 60 days advance notice.
          </p>
          <p>
            All onboarding fees charged at contract signing and non-refundable after onboarding commences.
          </p>
        </div>
      </div>
    </section>
  );
}
