import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { CheckCircle2, Clock, ArrowRight, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  onBookDemo?: (message?: string) => void;
  onSeePath?: () => void;
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

const MILESTONES = [
  {
    date: "10 June 2026",
    label: "Roadmap submission deadline",
    badge: "Passed",
    body: "All regulated institutions were required to submit an AML implementation roadmap to CBN.",
    status: "past" as const,
  },
  {
    date: "September 2027",
    label: "Full compliance — Deposit Money Banks",
    badge: "15 months away",
    body: "All DMBs must achieve full automated AML compliance. Implementation typically takes 6–9 months. Starting now means arriving on time.",
    status: "active" as const,
  },
  {
    date: "March 2028",
    label: "Full compliance — Fintechs, PSPs, MFBs, IMTOs",
    badge: "21 months away",
    body: "A March 2028 compliance date requires starting no later than September 2027. The window for unhurried implementation is now.",
    status: "upcoming" as const,
  },
];

export function ComplianceRoadmapSection({ onBookDemo, onSeePath }: Props) {
  return (
    <section id="compliance-roadmap" className="relative py-24 px-6 overflow-hidden">
      <div className="mx-auto max-w-6xl space-y-16">
        {/* Header */}
        <FadeIn>
          <div className="text-center space-y-4 max-w-3xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight leading-snug">
              The June 10 deadline was step one. Here is what comes next.
            </h2>
            <p className="text-sm md:text-base text-white/50 leading-relaxed">
              Institutions that submitted their roadmap are now in the
              implementation phase. Full compliance deadlines are staged by institution type.
            </p>
          </div>
        </FadeIn>

        {/* Timeline Cards */}
        <div className="grid md:grid-cols-3 gap-5">
          {MILESTONES.map((m, i) => {
            const isPast = m.status === "past";
            const isActive = m.status === "active";
            const isUpcoming = m.status === "upcoming";

            const borderColor = isPast
              ? "border-white/[0.06]"
              : isActive
                ? "border-[#D4A843]/30"
                : "border-emerald-500/20";
            const bgColor = isPast
              ? "bg-white/[0.02]"
              : isActive
                ? "bg-[#D4A843]/[0.04]"
                : "bg-emerald-500/[0.03]";
            const badgeClasses = isPast
              ? "bg-white/[0.06] border-white/10 text-white/40"
              : isActive
                ? "bg-[#D4A843]/10 border-[#D4A843]/30 text-[#D4A843]"
                : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400";
            const dateColor = isPast
              ? "text-white/30"
              : isActive
                ? "text-[#D4A843]"
                : "text-emerald-400";
            const labelColor = isPast ? "text-white/50" : "text-white";
            const icon = isPast ? (
              <CheckCircle2 className="h-5 w-5 text-white/30" />
            ) : isActive ? (
              <Clock className="h-5 w-5 text-[#D4A843]" />
            ) : (
              <Clock className="h-5 w-5 text-emerald-400" />
            );

            return (
              <FadeIn key={m.label} delay={i * 0.1}>
                <div
                  className={`relative h-full rounded-2xl border ${borderColor} ${bgColor} backdrop-blur-md p-7 transition-all duration-500`}
                >
                  {/* Connector line (desktop only, between cards) */}
                  {i < MILESTONES.length - 1 && (
                    <div className="hidden md:block absolute top-10 -right-5 w-10 h-px bg-white/[0.08]" />
                  )}

                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border ${isPast ? "border-white/10 bg-white/[0.04]" : isActive ? "border-[#D4A843]/30 bg-[#D4A843]/10" : "border-emerald-500/20 bg-emerald-500/10"}`}
                    >
                      {icon}
                    </div>
                    <div>
                      <p className={`text-xs font-mono font-medium ${dateColor}`}>
                        {m.date}
                      </p>
                      <span
                        className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider mt-0.5 ${badgeClasses}`}
                      >
                        {m.badge}
                      </span>
                    </div>
                  </div>

                  <h3 className={`text-sm font-semibold ${labelColor} leading-snug mb-2`}>
                    {m.label}
                  </h3>
                  <p className={`text-sm leading-relaxed ${isPast ? "text-white/30" : "text-white/50"}`}>
                    {m.body}
                  </p>
                </div>
              </FadeIn>
            );
          })}
        </div>

        {/* Urgency Banner */}
        <FadeIn delay={0.3}>
          <div className="rounded-2xl border border-[#D4A843]/20 bg-gradient-to-r from-[#D4A843]/[0.07] to-[#D4A843]/[0.02] backdrop-blur-md p-8 md:p-10">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#D4A843]/10 border border-[#D4A843]/30">
                  <AlertTriangle className="h-5 w-5 text-[#D4A843]" />
                </div>
                <div className="space-y-1">
                  <p className="text-white font-semibold text-sm md:text-base leading-snug">
                    A compliance platform takes 3–6 months to fully implement.
                  </p>
                  <p className="text-white/50 text-sm leading-relaxed">
                    Institutions that wait until 2027 will not meet their deadline.
                  </p>
                </div>
              </div>
              <Button
                onClick={() => onBookDemo?.()}
                size="lg"
                className="shrink-0 bg-[#D4A843] hover:bg-[#D4A843]/90 text-[#0a0f1c] rounded-xl text-sm font-semibold px-6 group"
              >
                Book your implementation demo
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
              </Button>
            </div>
          </div>
        </FadeIn>

        {/* Two Context Columns */}
        <div className="grid md:grid-cols-2 gap-5">
          <FadeIn delay={0.4}>
            <div className="h-full rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-md p-7 hover:border-primary/40 transition-all duration-500">
              <h3 className="text-sm font-semibold text-white leading-snug mb-3">
                For institutions that submitted their roadmap
              </h3>
              <p className="text-sm text-white/40 leading-relaxed mb-5">
                Your June 10 roadmap is a commitment to CBN. ApexAML executes that
                commitment within your technology environment.
              </p>
              <button
                type="button"
                onClick={onSeePath}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary/80 transition-colors group"
              >
                See the implementation path
                <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </FadeIn>

          <FadeIn delay={0.5}>
            <div className="h-full rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-md p-7 hover:border-primary/40 transition-all duration-500">
              <h3 className="text-sm font-semibold text-white leading-snug mb-3">
                For institutions that missed June 10
              </h3>
              <p className="text-sm text-white/40 leading-relaxed mb-5">
                Missing the deadline is an infraction but not licence-ending. The right
                response is a remediation plan within 30 days, combined with immediate
                technology deployment. ApexAML provides both.
              </p>
              <button
                type="button"
                onClick={() =>
                  onBookDemo?.("Remediation consultation request")
                }
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary/80 transition-colors group"
              >
                Book a remediation consultation
                <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}
