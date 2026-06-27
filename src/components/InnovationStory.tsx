import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Brain, Globe, ShieldCheck, FileText, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  onBookDemo?: () => void;
}

function FadeIn({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ duration: 0.6, ease: "easeOut", delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

const CARDS = [
  {
    icon: Brain,
    title: "11 minutes. Not 3 hours.",
    body: "Our AI co-pilot generates a complete NFIU-compliant STR narrative from alert data in 11 minutes. At 50 STRs per month, that is 145 analyst hours saved.",
    badge: "First in Nigeria",
    badgeColor:
      "bg-primary/10 border-primary/30 text-primary",
  },
  {
    icon: Globe,
    title: "The world's only pre-configured IMTO compliance module.",
    body: "Six CBN-specific IMTO obligations — from the $200 cash-limit structuring rule to settlement account commingling detection — pre-built and ready to activate.",
    badge: "IMTO-exclusive",
    badgeColor:
      "bg-[#D4A843]/10 border-[#D4A843]/30 text-[#D4A843]",
  },
  {
    icon: ShieldCheck,
    title: "14 Nigerian typologies. Out of the box.",
    body: "POS round-tripping, USSD layering, BDC smurfing, dormant account activation, salary mule detection. Pre-built as one-click rules with CBN model validation documentation.",
    badge: "CBN-native",
    badgeColor:
      "bg-emerald-500/10 border-emerald-500/30 text-emerald-400",
  },
  {
    icon: FileText,
    title: "One-click STR export in goAML 3.x XML format.",
    body: "Every compliance platform claims goAML integration. We generate the exact XML schema the NFIU portal requires in one click from any alert in the case management workspace.",
    badge: "NFIU-certified format",
    badgeColor:
      "bg-sky-500/10 border-sky-500/30 text-sky-400",
  },
];

export function InnovationStory({ onBookDemo }: Props) {
  return (
    <section id="innovation-story" className="relative py-24 px-6 overflow-hidden">
      <div className="mx-auto max-w-6xl space-y-16">
        {/* Header */}
        <FadeIn>
          <div className="text-center space-y-4 max-w-3xl mx-auto">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">
              Why we built ApexAML
            </span>
            <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight leading-snug">
              Every global AML platform was built for the US or Europe. We built
              the first one that speaks CBN.
            </h2>
            <p className="text-sm md:text-base text-white/50 leading-relaxed">
              After Nigeria exited the FATF grey list in 2025, we saw the gap:
              powerful global platforms that could not handle a NUBAN, could not
              verify a BVN, and had never filed an NFIU goAML report.
            </p>
          </div>
        </FadeIn>

        {/* Cards grid */}
        <div className="grid md:grid-cols-2 gap-5">
          {CARDS.map((card, i) => (
            <FadeIn key={card.title} delay={i * 0.1}>
              <div className="group relative h-full rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-md p-7 hover:border-primary/40 transition-all duration-500 hover:shadow-[0_0_40px_-10px_hsl(var(--primary)/0.15)]">
                <div className="flex items-start gap-5">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 text-primary group-hover:bg-primary/20 transition-colors">
                    <card.icon className="h-5 w-5" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-white text-base leading-snug">
                        {card.title}
                      </h3>
                      <span
                        className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${card.badgeColor}`}
                      >
                        {card.badge}
                      </span>
                    </div>
                    <p className="text-sm text-white/40 leading-relaxed">
                      {card.body}
                    </p>
                  </div>
                </div>
              </div>
            </FadeIn>
          ))}

          {/* Card 5 — full width */}
          <FadeIn delay={0.4} className="md:col-span-2">
            <div className="relative rounded-2xl border border-white/[0.08] p-8 md:p-10 overflow-hidden bg-gradient-to-br from-[#0a0f1c] via-[#0d1220] to-[#0f1525]">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.07] to-transparent pointer-events-none" />
              <div className="relative space-y-5 max-w-3xl">
                <h3 className="text-xl md:text-2xl font-bold text-white leading-snug">
                  This is not a compliance tool. It is the AML infrastructure
                  layer for Nigerian finance.
                </h3>
                <p className="text-sm md:text-base text-white/50 leading-relaxed">
                  Nigeria&apos;s exit from the FATF grey list was a commitment — not
                  a destination. CBN examinations will continue. Transaction
                  volumes will increase. ApexAML is the permanent compliance
                  nervous system: every alert reviewed, every STR filed, every
                  KYC approval, every audit entry.
                </p>
                <Button
                  onClick={onBookDemo}
                  size="lg"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl text-sm font-semibold px-6 group"
                >
                  Book a demo to see it working
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                </Button>
              </div>
            </div>
          </FadeIn>
        </div>

        {/* Founder strip */}
        <FadeIn delay={0.5}>
          <div className="text-center">
            <p className="text-xs md:text-sm text-white/40 leading-relaxed">
              Built by practitioners · Designed around real Nigerian compliance
              workflows · Not adapted from a US or European product
            </p>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
