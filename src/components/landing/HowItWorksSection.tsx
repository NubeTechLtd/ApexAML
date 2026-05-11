import { Plug, SlidersHorizontal, FileText, CheckCircle2 } from 'lucide-react';

const STEPS = [
  {
    icon: Plug,
    title: 'Connect in 48 hours',
    desc: 'ApexAML integrates with your core banking system or Paystack/Flutterwave via REST API. No legacy middleware.',
  },
  {
    icon: SlidersHorizontal,
    title: 'Configure your rules',
    desc: 'Pre-load 8 Nigerian typology rules or build custom rules with our no-code sandbox. Your team sets the thresholds — no vendor involvement needed.',
  },
  {
    icon: FileText,
    title: 'Submit your CBN roadmap',
    desc: 'Use our pre-built template to file your implementation plan to the CBN Compliance Department by June 10. We co-author it with you.',
  },
];

const TIMELINE = [
  { label: 'Week 1', detail: 'API connected', done: true },
  { label: 'Week 2', detail: 'Rules live', done: true },
  { label: 'Week 3', detail: 'First alerts reviewed', current: true },
  { label: 'Day 30', detail: 'CBN roadmap submitted', done: false },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="relative py-24 px-6">
      <div className="mx-auto max-w-6xl space-y-20">
        {/* Header */}
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <p className="text-xs uppercase tracking-[0.2em] text-primary font-semibold">How It Works</p>
          <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
            From integration to CBN attestation in 30 days.
          </h2>
        </div>

        {/* 3-step process */}
        <div className="relative">
          {/* Dashed connector — desktop only, between step circles */}
          <div
            aria-hidden
            className="hidden md:block absolute top-8 left-[16.66%] right-[16.66%] border-t-2 border-dashed border-white/15"
          />

          <div className="relative grid md:grid-cols-3 gap-10 md:gap-6">
            {STEPS.map((s, i) => (
              <div key={s.title} className="text-center space-y-5">
                {/* Step circle with number */}
                <div className="relative inline-flex flex-col items-center">
                  <div className="relative h-16 w-16 rounded-full bg-[hsl(220,25%,8%)] border-2 border-primary/40 flex items-center justify-center shadow-[0_0_0_6px_hsl(220,25%,6%)]">
                    <span className="text-xl font-bold text-primary tabular-nums">{i + 1}</span>
                  </div>
                </div>

                {/* Icon + content */}
                <div className="space-y-3 max-w-xs mx-auto">
                  <div className="flex items-center justify-center gap-2 text-primary">
                    <s.icon className="h-4 w-4" />
                  </div>
                  <h3 className="text-white font-semibold text-lg">{s.title}</h3>
                  <p className="text-sm text-white/50 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Timeline progress bar */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-[0.2em] text-white/50 font-semibold">
              Typical 30-day rollout
            </p>
            <p className="text-[10px] text-white/30 uppercase tracking-wider">
              Live status
            </p>
          </div>

          {/* Progress track */}
          <div className="relative pt-2">
            <div className="absolute top-[18px] left-0 right-0 h-0.5 bg-white/10 rounded-full" />
            <div
              className="absolute top-[18px] left-0 h-0.5 bg-primary rounded-full transition-all"
              style={{ width: '62.5%' }}
            />
            <div className="relative grid grid-cols-2 sm:grid-cols-4 gap-y-6 sm:gap-y-0">
              {TIMELINE.map((t) => {
                const isDone = t.done;
                const isCurrent = t.current;
                return (
                  <div key={t.label} className="flex flex-col items-center text-center px-1">
                    <div
                      className={`h-9 w-9 rounded-full flex items-center justify-center border-2 transition-colors ${
                        isCurrent
                          ? 'bg-primary border-primary text-primary-foreground shadow-[0_0_20px_hsl(var(--primary)/0.5)]'
                          : isDone
                            ? 'bg-primary/20 border-primary/60 text-primary'
                            : 'bg-[hsl(220,25%,8%)] border-white/15 text-white/30'
                      }`}
                    >
                      {isDone ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        <span className="h-2 w-2 rounded-full bg-current" />
                      )}
                    </div>
                    <p
                      className={`mt-3 text-[11px] uppercase tracking-wider font-semibold ${
                        isCurrent ? 'text-primary' : isDone ? 'text-white/70' : 'text-white/40'
                      }`}
                    >
                      {t.label}
                    </p>
                    <p
                      className={`mt-1 text-xs ${
                        isCurrent ? 'text-white/80 font-medium' : 'text-white/40'
                      }`}
                    >
                      {t.detail}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
