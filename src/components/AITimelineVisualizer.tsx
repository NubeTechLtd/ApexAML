import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle,
  UserSearch,
  FileText,
  FileCode2,
  ShieldCheck,
  Loader2,
  Check,
  Play,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const STEP_DURATION = 7000; // 7 seconds per step

const STEPS = [
  {
    label: 'Alert Triggered',
    time: 0.1,
    action: 'Pattern detected: POS Structuring evasion.',
    reason:
      'To instantly flag high-velocity transaction bursts that attempt to evade CBN Tier 1 limits.',
    icon: AlertTriangle,
  },
  {
    label: 'Entity 360 Enrichment',
    time: 0.8,
    action: 'Cross-referencing NIBSS, PEP, and Global Sanctions.',
    reason:
      'To build a comprehensive risk profile and ensure the beneficiary is not on any domestic or international watchlists.',
    icon: UserSearch,
  },
  {
    label: 'AI Narrative Generation',
    time: 1.2,
    action:
      'Subject structured ₦4.8M across 12 POS terminals. Generating report...',
    reason:
      'To transform raw ledger data into a clinical, human-readable context legally required by examiners.',
    icon: FileText,
  },
  {
    label: 'goAML XML Formatting',
    time: 0.4,
    action: 'Converting data to the required NFIU schema.',
    reason:
      'To guarantee zero-error machine readability and prevent NFIU portal rejection.',
    icon: FileCode2,
  },
  {
    label: 'NFIU Secure Submission',
    time: 0.5,
    action: 'Recording the export in an append-only audit trail.',
    reason:
      'To satisfy the reporting mandate and keep a timestamped, attributable record of exactly what was filed.',
    icon: ShieldCheck,
  },
];

export function AITimelineVisualizer() {
  const [activeStep, setActiveStep] = useState(0);
  const [completed, setCompleted] = useState<boolean[]>(
    () => STEPS.map(() => false),
  );
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const hasAutoRunRef = useRef(false);

  const clearTimer = () => {
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  useEffect(() => () => clearTimer(), []);

  const handleRun = () => {
    clearTimer();
    setActiveStep(0);
    setCompleted(STEPS.map(() => false));
    setRunning(true);

    intervalRef.current = window.setInterval(() => {
      setCompleted((prev) => {
        const next = [...prev];
        // Find the current active and mark complete
        const currentIdx = next.findIndex((c) => !c);
        if (currentIdx === -1) {
          clearTimer();
          setRunning(false);
          return prev;
        }
        next[currentIdx] = true;

        if (currentIdx + 1 < STEPS.length) {
          setActiveStep(currentIdx + 1);
        } else {
          clearTimer();
          setRunning(false);
        }
        return next;
      });
    }, STEP_DURATION);
  };

  const handleReset = () => {
    clearTimer();
    setRunning(false);
    setActiveStep(0);
    setCompleted(STEPS.map(() => false));
  };

  useEffect(() => {
    if (!containerRef.current || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasAutoRunRef.current) {
            hasAutoRunRef.current = true;
            handleRun();
            observer.disconnect();
          }
        });
      },
      { threshold: 0.4 },
    );
    observer.observe(containerRef.current);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const current = STEPS[activeStep];
  const isCurrentDone = completed[activeStep];

  return (
    <div ref={containerRef} className="mx-auto max-w-6xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-10">
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-white/50 font-semibold">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          ApexAML Pipeline · Live Simulation
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRun}
            disabled={running}
            className={cn(
              'inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition-colors',
              'bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed',
            )}
          >
            <Play className="h-3.5 w-3.5" />
            {running ? 'Running…' : 'Run AI Pipeline'}
          </button>
          <button
            onClick={handleReset}
            className="inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium text-white/70 border border-white/10 hover:border-white/30 hover:text-white transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </button>
        </div>
      </div>

      {/* Timeline */}
      <div className="relative px-2 py-4">
        {/* Background track */}
        <div className="absolute left-[6%] right-[6%] top-1/2 -translate-y-1/2 h-px bg-white/10" />

        <div className="relative grid grid-cols-5 gap-2">
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            const isDone = completed[i];
            const isActive = i === activeStep && running && !isDone;
            const isUpcoming = !isDone && !isActive;

            return (
              <div key={step.label} className="relative flex flex-col items-center">
                {/* Animated connector to next node */}
                {i < STEPS.length - 1 && (
                  <div className="absolute left-1/2 top-[28px] w-full h-px overflow-hidden">
                    <motion.div
                      key={`conn-${i}-${isDone ? 'done' : isActive ? 'active' : 'idle'}`}
                      initial={{ width: isDone ? '100%' : '0%' }}
                      animate={{
                        width: isDone ? '100%' : isActive ? '100%' : '0%',
                      }}
                      transition={{
                        duration: isActive ? 7 : 0,
                        ease: 'linear',
                      }}
                      className="h-full bg-gradient-to-r from-primary to-primary/50"
                    />
                  </div>
                )}

                {/* Node */}
                <div
                  className={cn(
                    'relative z-10 flex h-14 w-14 items-center justify-center rounded-full border-2 transition-all duration-500',
                    isDone &&
                      'border-emerald-400/60 bg-emerald-500/15 shadow-[0_0_24px_-4px_rgba(16,185,129,0.6)]',
                    isActive &&
                      'border-primary bg-primary/20 shadow-[0_0_28px_-2px_hsl(var(--primary)/0.7)]',
                    isUpcoming && 'border-white/15 bg-white/[0.03]',
                  )}
                >
                  {isDone ? (
                    <Check className="h-5 w-5 text-emerald-400" strokeWidth={3} />
                  ) : isActive ? (
                    <Loader2 className="h-5 w-5 text-primary animate-spin" />
                  ) : (
                    <Icon className="h-5 w-5 text-white/40" />
                  )}
                  {isActive && (
                    <span className="absolute inset-0 rounded-full border-2 border-primary/40 animate-ping" />
                  )}
                </div>

                {/* Label */}
                <p
                  className={cn(
                    'mt-3 text-[11px] font-semibold uppercase tracking-wider text-center leading-tight',
                    isDone && 'text-emerald-300/80',
                    isActive && 'text-white',
                    isUpcoming && 'text-white/40',
                  )}
                >
                  {step.label}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Description card */}
      <div className="mt-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={`card-${activeStep}-${isCurrentDone ? 'done' : 'live'}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35 }}
            className="rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-md p-6 md:p-8"
          >
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-lg',
                    isCurrentDone
                      ? 'bg-emerald-500/15 border border-emerald-400/30'
                      : 'bg-primary/15 border border-primary/30',
                  )}
                >
                  {isCurrentDone ? (
                    <Check className="h-5 w-5 text-emerald-400" strokeWidth={3} />
                  ) : running ? (
                    <Loader2 className="h-5 w-5 text-primary animate-spin" />
                  ) : (
                    <current.icon className="h-5 w-5 text-primary" />
                  )}
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.18em] text-white/40 font-semibold">
                    Step {activeStep + 1} of {STEPS.length}
                  </p>
                  <h3 className="text-lg font-semibold text-white leading-tight">
                    {current.label}
                  </h3>
                </div>
              </div>

              {isCurrentDone ? (
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="inline-flex items-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-300 shadow-[0_0_24px_-6px_rgba(16,185,129,0.6)]"
                >
                  <Check className="h-3.5 w-3.5" strokeWidth={3} />
                  Average ApexAML time: {current.time}s
                </motion.div>
              ) : running ? (
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  AI Processing…
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-white/50">
                  Idle · Awaiting trigger
                </div>
              )}
            </div>

            <div className="mt-6 space-y-3">
              <p className="text-base md:text-lg font-medium text-white leading-snug">
                {current.action}
              </p>
              <p className="text-sm italic text-white/45 leading-relaxed">
                {current.reason}
              </p>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
