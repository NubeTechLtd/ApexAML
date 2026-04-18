import { motion } from 'framer-motion';
import { Check, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Tier {
  name: string;
  audience: string;
  price: string;
  priceNote: string;
  popular?: boolean;
  features: string[];
  highlightFeatures?: string[]; // features unique to this tier (rendered in primary green)
}

const TIERS: Tier[] = [
  {
    name: 'Starter',
    audience: 'MFBs & small fintechs',
    price: '₦800k',
    priceNote: '/month, from',
    features: [
      'Identity & KYC (BVN/NIN)',
      'Sanctions & PEP screening',
      'Basic transaction monitoring',
      'STR XML export (goAML)',
      'CBN roadmap template',
    ],
  },
  {
    name: 'Growth',
    audience: 'PSPs & Tier-3 banks',
    price: '₦2.2M',
    priceNote: '/month, from',
    popular: true,
    features: [
      'Everything in Starter',
    ],
    highlightFeatures: [
      'AI STR Co-Pilot',
      'Adverse media scanning',
      'Regulatory change alerts',
      'No-code rule sandbox',
    ],
  },
  {
    name: 'Enterprise',
    audience: 'Tier-1/2 banks & MMOs',
    price: 'Custom',
    priceNote: 'pricing',
    features: [
      'Everything in Growth',
    ],
    highlightFeatures: [
      'Graph network analysis',
      'Dedicated customer success manager',
      'White-label deployment',
      'NFIU API direct submit',
    ],
  },
];

interface Props {
  onBookDemo: () => void;
}

export function PricingSection({ onBookDemo }: Props) {
  return (
    <section id="pricing" className="relative py-24 px-6">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/[0.02] to-transparent pointer-events-none" />
      <div className="relative mx-auto max-w-6xl space-y-14">
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

        {/* Tier grid */}
        <div className="grid md:grid-cols-3 gap-5 lg:gap-6">
          {TIERS.map((tier, i) => {
            const isPopular = !!tier.popular;
            return (
              <motion.div
                key={tier.name}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.45, delay: i * 0.08, ease: 'easeOut' }}
                className={`relative rounded-2xl backdrop-blur-md p-7 flex flex-col ${
                  isPopular
                    ? 'border-2 border-primary bg-primary/[0.04] shadow-[0_0_60px_-15px_hsl(var(--primary)/0.4)]'
                    : 'border border-white/[0.08] bg-white/[0.03]'
                }`}
              >
                {/* Popular badge */}
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary text-primary-foreground px-3 py-1 text-[10px] font-bold uppercase tracking-wider shadow-lg">
                      <Sparkles className="h-3 w-3" />
                      Most popular
                    </span>
                  </div>
                )}

                {/* Header */}
                <div className="space-y-1.5">
                  <h3 className="text-lg font-bold text-white tracking-tight">{tier.name}</h3>
                  <p className="text-[11px] uppercase tracking-wider text-white/40 font-medium">
                    {tier.audience}
                  </p>
                </div>

                {/* Price */}
                <div className="mt-5 pb-6 border-b border-white/[0.06]">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl md:text-4xl font-extrabold text-white tracking-tight tabular-nums">
                      {tier.price}
                    </span>
                    <span className="text-xs text-white/40 font-medium">{tier.priceNote}</span>
                  </div>
                </div>

                {/* Features */}
                <ul className="mt-6 space-y-3 flex-1">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-white/65">
                      <Check className="h-4 w-4 text-white/40 shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                  {tier.highlightFeatures?.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-risk-low font-medium">
                      <Check className="h-4 w-4 text-risk-low shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <Button
                  onClick={onBookDemo}
                  size="lg"
                  className={`mt-7 w-full rounded-lg h-11 font-semibold text-sm group ${
                    isPopular
                      ? 'bg-primary hover:bg-primary/90 text-primary-foreground'
                      : 'bg-white/[0.06] hover:bg-white/[0.1] text-white border border-white/10'
                  }`}
                >
                  Book Demo
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                </Button>
              </motion.div>
            );
          })}
        </div>

        {/* Footer note */}
        <p className="text-center text-xs text-white/40 max-w-2xl mx-auto leading-relaxed">
          All prices NGN. Annual billing available with discount.{' '}
          <span className="text-primary/80 font-medium">
            First month free for institutions submitting their CBN roadmap before June 10, 2026.
          </span>
        </p>
      </div>
    </section>
  );
}
