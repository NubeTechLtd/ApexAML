import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, ChevronLeft, ChevronRight, ShieldCheck, Server, FileCheck2, Award, Plug } from 'lucide-react';

const INSTITUTION_PILLS = [
  'Licensed PSP',
  'Tier-3 Bank',
  'Mobile Money Operator',
  'Microfinance Bank',
  'Licensed Fintech',
  'Tier-2 Bank',
  'IMTO',
  'BDC Operator',
  'Payment Service Bank',
];

const TESTIMONIALS = [
  {
    initials: 'NA',
    name: 'Ngozi A.',
    title: 'Chief Compliance Officer',
    institution: 'Tier-2 Bank, Lagos',
    quote:
      "Our STR turnaround dropped from a half-day to under 15 minutes. For the first time we're submitting CBN attestations ahead of deadline, not scrambling the night before.",
    rating: 5,
  },
  {
    initials: 'IO',
    name: 'Ibrahim O.',
    title: 'Head of Financial Crime',
    institution: 'Licensed Fintech, Abuja',
    quote:
      "Sentinel's CBN roadmap template got us through first review without a single rework. The AI co-pilot now drafts narratives our examiners actually accept.",
    rating: 5,
  },
  {
    initials: 'CE',
    name: 'Chinwe E.',
    title: 'AML Officer',
    institution: 'PSP, Lagos',
    quote:
      "We replaced three spreadsheets and a legacy queue with one workspace. Our team finally has time to investigate real threats instead of chasing false positives.",
    rating: 5,
  },
];

const TRUST_BADGES = [
  { icon: ShieldCheck, label: 'NDPR Compliant' },
  { icon: Server, label: 'AWS Nigeria Hosted' },
  { icon: FileCheck2, label: 'goAML XML Certified' },
  { icon: Award, label: 'ISO 27001 In Progress' },
  { icon: Plug, label: 'NFIU goAML API Integration' },
];

export function SocialProofSection() {
  const [active, setActive] = useState(0);
  const t = TESTIMONIALS[active];

  return (
    <section className="relative py-24 px-6 border-y border-white/[0.06]">
      <div className="mx-auto max-w-6xl space-y-20">
        {/* ── 1. LOGO BAR ──────────────────────────────── */}
        <div className="space-y-6">
          <p className="text-center text-xs sm:text-sm text-white/50 max-w-2xl mx-auto leading-relaxed">
            Built for institutions regulated under{' '}
            <span className="text-white/70 font-medium">CBN Circular BSD/DIR/PUB/LAB/019/002</span>.
          </p>

          <div
            className="relative overflow-hidden"
            style={{
              maskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)',
              WebkitMaskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)',
            }}
          >
            <div className="flex w-max gap-3 animate-marquee">
              {[...INSTITUTION_PILLS, ...INSTITUTION_PILLS].map((label, i) => (
                <span
                  key={`${label}-${i}`}
                  className="shrink-0 rounded-full border border-primary/20 bg-primary/10 px-5 py-2 text-xs font-medium text-white/60 whitespace-nowrap"
                >
                  {label}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* ── 2. TESTIMONIAL CARDS ──────────────────────── */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-[0.2em] text-primary font-semibold">From the Field</p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label="Previous testimonial"
                onClick={() => setActive((a) => (a - 1 + TESTIMONIALS.length) % TESTIMONIALS.length)}
                className="h-9 w-9 rounded-lg border border-white/10 bg-white/[0.03] text-white/60 hover:text-white hover:bg-white/10 flex items-center justify-center transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                aria-label="Next testimonial"
                onClick={() => setActive((a) => (a + 1) % TESTIMONIALS.length)}
                className="h-9 w-9 rounded-lg border border-white/10 bg-white/[0.03] text-white/60 hover:text-white hover:bg-white/10 flex items-center justify-center transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="relative min-h-[260px] sm:min-h-[220px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={active}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md p-7 sm:p-9"
              >
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 shrink-0 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center text-primary font-semibold text-sm">
                    {t.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                      <span className="text-white font-semibold text-sm">{t.name}</span>
                      <span className="text-white/40 text-xs">— {t.title}</span>
                      <span className="rounded-full bg-primary/15 text-primary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider">
                        Beta Tester
                      </span>
                    </div>
                    <p className="text-[11px] text-white/40 mt-0.5">{t.institution}</p>
                  </div>
                  <div className="hidden sm:flex items-center gap-0.5 shrink-0">
                    {Array.from({ length: t.rating }).map((_, i) => (
                      <Star key={i} className="h-3.5 w-3.5 fill-primary text-primary" />
                    ))}
                  </div>
                </div>

                <blockquote className="mt-5 text-sm sm:text-base text-white/70 leading-relaxed italic">
                  "{t.quote}"
                </blockquote>

                <div className="sm:hidden flex items-center gap-0.5 mt-4">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-primary text-primary" />
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="flex items-center justify-center gap-2">
            {TESTIMONIALS.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Go to testimonial ${i + 1}`}
                onClick={() => setActive(i)}
                className={`h-1.5 rounded-full transition-all ${
                  i === active ? 'w-8 bg-primary' : 'w-1.5 bg-white/20 hover:bg-white/40'
                }`}
              />
            ))}
          </div>
        </div>

        {/* ── 3. TRUST BADGES ROW ──────────────────────── */}
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 pt-4">
          {TRUST_BADGES.map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-2 text-muted-foreground">
              <Icon className="h-3.5 w-3.5" />
              <span className="text-[11px] font-medium tracking-wide">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
