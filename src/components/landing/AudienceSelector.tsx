import { motion } from 'framer-motion';
import { Building2, Zap, CreditCard, Coins, Check } from 'lucide-react';
import { useAudience, AUDIENCES, AudienceKey } from './AudienceContext';

const CARDS: { key: AudienceKey; icon: typeof Building2; tagline: string }[] = [
  { key: 'dmb', icon: Building2, tagline: 'Tier-1 / Tier-2 commercial bank' },
  { key: 'fintech', icon: Zap, tagline: 'Lender, neobank, or wallet' },
  { key: 'psp', icon: CreditCard, tagline: 'Switch, processor, or aggregator' },
  { key: 'mfb', icon: Coins, tagline: 'Microfinance bank, all tiers' },
];

export function AudienceSelector() {
  const { audience, setAudience } = useAudience();

  const handleSelect = (key: AudienceKey) => {
    setAudience(key);
    // Smooth scroll to features
    requestAnimationFrame(() => {
      const el = document.getElementById('features');
      if (el) {
        const top = el.getBoundingClientRect().top + window.scrollY - 80;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  };

  return (
    <section className="relative px-6 pb-12 pt-4">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="text-center space-y-2">
          <p className="text-[10px] uppercase tracking-[0.2em] text-primary font-semibold">Pick your institution type</p>
          <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">
            See Sentinel through your lens
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {CARDS.map(({ key, icon: Icon, tagline }, i) => {
            const profile = AUDIENCES[key];
            const isActive = audience === key;
            return (
              <motion.button
                key={key}
                type="button"
                onClick={() => handleSelect(key)}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                whileHover={{ y: -2 }}
                aria-pressed={isActive}
                className={`group relative text-left rounded-xl border p-4 sm:p-5 transition-all duration-300 ${
                  isActive
                    ? 'border-primary bg-primary/[0.08] shadow-[0_0_30px_-10px_hsl(var(--primary)/0.5)]'
                    : 'border-white/[0.08] bg-white/[0.02] hover:border-primary/40 hover:bg-white/[0.04]'
                }`}
              >
                {isActive && (
                  <span className="absolute top-3 right-3 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Check className="h-3 w-3" strokeWidth={3} />
                  </span>
                )}
                <div className="flex items-start gap-3">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border transition-colors ${
                    isActive
                      ? 'bg-primary/20 border-primary/40 text-primary'
                      : 'bg-primary/10 border-primary/20 text-primary group-hover:bg-primary/15'
                  }`}>
                    <Icon className="h-5 w-5" strokeWidth={1.75} />
                  </div>
                  <div className="space-y-1 min-w-0">
                    <p className="text-base font-bold text-white leading-tight">{profile.shortLabel}</p>
                    <p className="text-[11px] text-white/45 leading-snug">{tagline}</p>
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>

        {audience && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center text-xs text-white/45"
          >
            Showing Sentinel tailored for{' '}
            <span className="text-primary font-semibold">{AUDIENCES[audience].label}</span>.{' '}
            <button
              type="button"
              onClick={() => setAudience(null)}
              className="underline hover:text-white/70"
            >
              Reset
            </button>
          </motion.p>
        )}
      </div>
    </section>
  );
}
