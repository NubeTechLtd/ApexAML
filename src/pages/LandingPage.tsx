import { useState, useEffect, useRef } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { Shield, Sparkles, SlidersHorizontal, Lock, ArrowRight, Download, CheckCircle2, Loader2, MessageCircle, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { BookDemoSheet } from '@/components/landing/BookDemoSheet';
import { QuickDemoBar } from '@/components/landing/QuickDemoBar';
import { LeadCaptureForm } from '@/components/landing/LeadCaptureForm';

// ── Helpers ──────────────────────────────────────────────────────────────

function useCountdown(target: Date) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const diff = Math.max(0, target.getTime() - now);
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  const secs = Math.floor((diff % 60000) / 1000);
  return { days, hours, mins, secs };
}

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' as const } },
};

function AnimatedSection({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      variants={{ ...fadeUp, visible: { ...fadeUp.visible, transition: { ...fadeUp.visible.transition, delay } } }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ── Features data ────────────────────────────────────────────────────────

const features = [
  { icon: Shield, title: 'Identity & KYC Ops', desc: 'BVN/NIN verification, PEP screening, and tiered risk scoring — all in one automated pipeline.' },
  { icon: Sparkles, title: 'AI STR Co-Pilot', desc: 'Generative AI drafts NFIU-compliant Suspicious Transaction Reports in seconds, not hours.' },
  { icon: SlidersHorizontal, title: 'No-Code Rules Engine', desc: 'Build, test, and deploy AML detection rules without writing a single line of code.' },
  { icon: Lock, title: 'Immutable Audit Trail', desc: 'Every action timestamped and cryptographically sealed. Always examiner-ready.' },
];

// ── AI Mock Component ────────────────────────────────────────────────────

function AIMockUI() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const timers = [
      setTimeout(() => setStep(1), 800),
      setTimeout(() => setStep(2), 2200),
      setTimeout(() => setStep(3), 3400),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  const lines = [
    { label: 'Analyzing transaction cluster…', done: step >= 1 },
    { label: 'Cross-referencing PEP/sanctions lists…', done: step >= 2 },
    { label: 'Generating NFIU STR narrative…', done: step >= 3 },
  ];

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-5 font-mono text-xs space-y-4 shadow-2xl">
      <div className="flex items-center gap-2 text-primary">
        <Sparkles className="h-4 w-4" />
        <span className="font-semibold tracking-wide uppercase text-[10px]">Sentinel AI Co-Pilot</span>
        <span className="ml-auto rounded-full bg-risk-low/20 text-risk-low px-2 py-0.5 text-[10px]">Live</span>
      </div>
      <div className="h-px bg-white/10" />
      <div className="space-y-3">
        {lines.map((l, i) => (
          <div key={i} className="flex items-center gap-2 text-muted-foreground">
            {l.done ? (
              <CheckCircle2 className="h-3.5 w-3.5 text-risk-low shrink-0" />
            ) : (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-primary shrink-0" />
            )}
            <span className={l.done ? 'text-foreground/80' : 'text-muted-foreground'}>{l.label}</span>
          </div>
        ))}
      </div>
      {step >= 3 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="rounded-lg bg-white/[0.04] border border-white/10 p-3 space-y-2"
        >
          <p className="text-[10px] uppercase tracking-wider text-primary font-semibold">Generated STR Excerpt</p>
          <p className="text-muted-foreground leading-relaxed text-[11px]">
            "Subject <span className="text-foreground">Adewale O.</span> conducted <span className="text-risk-high">47 POS transactions</span> across 
            12 terminals in Lekki within <span className="text-risk-critical">72 hours</span>, totalling ₦14.8M. Pattern consistent with 
            <span className="text-risk-high"> structuring typology T-NG-204</span>. Recommend escalation to NFIU…"
          </p>
        </motion.div>
      )}
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────

export default function LandingPage() {
  const countdown = useCountdown(new Date('2026-06-10T00:00:00'));
  const [demoSheetOpen, setDemoSheetOpen] = useState(false);
  const [quickBarOpen, setQuickBarOpen] = useState(false);
  const [pulseActive, setPulseActive] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const t = setTimeout(() => setPulseActive(false), 10000);
    return () => clearTimeout(t);
  }, []);

  const handleBookDemo = () => {
    setDemoSheetOpen(true);
    setQuickBarOpen(true);
    setPulseActive(false);
    const el = document.getElementById('hero-cta');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const handleDownloadRoadmap = () => {
    const content = `CBN AML COMPLIANCE ROADMAP TEMPLATE
Circular: BSD/DIR/PUB/LAB/019/002
Deadline: June 10, 2026

================================================================
SECTION 1 — INSTITUTION PROFILE
================================================================
Institution Name: ____________________________________________
License Type (DMB/Fintech/PSP/MMO/MFB/IMTO): _________________
Compliance Officer: __________________________________________
NFIU Reporting ID: ___________________________________________

================================================================
SECTION 2 — GAP ASSESSMENT CHECKLIST
================================================================
[ ] Customer Due Diligence (CDD) program documented
[ ] Tiered KYC (T1/T2/T3) operational with BVN/NIN linkage
[ ] PEP and sanctions screening (UN, OFAC, EU, NFIU domestic)
[ ] Transaction monitoring rules covering Nigerian typologies:
    [ ] POS structuring
    [ ] BDC smurfing
    [ ] Crypto P2P layering
    [ ] Cross-border IMTO velocity
[ ] STR/CTR submission workflow to NFIU goAML
[ ] Independent audit trail (immutable, examiner-ready)
[ ] Board-level AML governance reporting

================================================================
SECTION 3 — REMEDIATION TIMELINE (12-WEEK PLAN)
================================================================
Weeks 1-2:   Gap analysis & risk assessment
Weeks 3-5:   Policy & procedure refresh
Weeks 6-9:   Technology deployment & rule tuning
Weeks 10-11: Staff training & UAT
Week 12:     Internal audit & CBN attestation

================================================================
SECTION 4 — SIGN-OFF
================================================================
Compliance Officer: ___________________   Date: _______________
Chief Risk Officer: ___________________   Date: _______________
Managing Director: ____________________   Date: _______________

Generated by Sentinel — sentinel.ng
`;
    const blob = new Blob([content], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'CBN_AML_Roadmap_Template_BSD-019-002.pdf';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({ title: 'Download started', description: 'Your CBN roadmap template is downloading.' });
  };


  return (
    <div className="min-h-screen bg-[hsl(220,25%,6%)] text-foreground overflow-x-hidden">
      {/* ── Navbar ─────────────────────────────────────────────── */}
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-white/[0.06] bg-[hsl(220,25%,6%)]/70 backdrop-blur-xl">
        <div className="mx-auto max-w-6xl flex items-center justify-between px-6 h-16">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <span className="font-bold text-lg tracking-tight text-white">Sentinel</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-white/60">
            {[
              { href: 'features', label: 'Platform' },
              { href: 'ai', label: 'AI Engine' },
              { href: 'trust', label: 'Results' },
            ].map(({ href, label }) => (
              <button
                key={href}
                onClick={() => {
                  const el = document.getElementById(href);
                  if (el) {
                    const top = el.getBoundingClientRect().top + window.scrollY - 80;
                    window.scrollTo({ top, behavior: 'smooth' });
                  }
                }}
                className="hover:text-white transition-colors"
              >
                {label}
              </button>
            ))}
          </div>
          <Button
            size="sm"
            onClick={handleBookDemo}
            className={`bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-xs font-semibold ${pulseActive ? 'ring-2 ring-primary/30 animate-pulse' : ''}`}
          >
            Book Demo
          </Button>
        </div>
      </nav>

      <QuickDemoBar open={quickBarOpen} onClose={() => setQuickBarOpen(false)} />
      <BookDemoSheet open={demoSheetOpen} onOpenChange={setDemoSheetOpen} />

      {/* ── Hero ───────────────────────────────────────────────── */}
      <section className="relative pt-32 pb-20 md:pt-44 md:pb-32 px-6">
        {/* Glow effects */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary/15 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-40 right-1/4 w-[300px] h-[300px] bg-primary/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative mx-auto max-w-4xl text-center space-y-8">
          <AnimatedSection>
            <p className="inline-block rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-medium text-primary tracking-wide uppercase">
              Built for Nigerian Financial Institutions
            </p>
          </AnimatedSection>

          <AnimatedSection delay={0.1}>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.1] text-white">
              The{' '}
              <span className="bg-gradient-to-r from-primary via-[hsl(200,80%,60%)] to-primary bg-clip-text text-transparent drop-shadow-[0_0_30px_hsl(var(--primary)/0.5)]">
                June 2026 CBN Deadline
              </span>{' '}
              is Approaching.
              <br />
              Is Your AML Ready?
            </h1>
          </AnimatedSection>

          <AnimatedSection delay={0.2}>
            <p className="mx-auto max-w-2xl text-base md:text-lg text-white/50 leading-relaxed">
              The first unified Financial Crime Platform built explicitly for Nigeria. Automate KYC, resolve sanctions, and draft NFIU STRs with our AI Co-Pilot.
            </p>
          </AnimatedSection>

          <AnimatedSection delay={0.3}>
            <div id="hero-cta" className="scroll-mt-32 space-y-5">
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button
                  size="lg"
                  onClick={() => setDemoSheetOpen(true)}
                  className="relative bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl text-sm font-semibold px-8 group"
                >
                  Book a 20-min Demo
                  <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-0.5 transition-transform" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={handleDownloadRoadmap}
                  className="rounded-xl bg-transparent border-white/15 text-white/80 hover:bg-white/5 hover:text-white text-sm px-8"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download CBN Roadmap Template (Free)
                </Button>
              </div>
              <a
                href="https://wa.me/2348XXXXXXXX"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-white/40 hover:text-white/70 transition-colors"
              >
                <MessageCircle className="h-3.5 w-3.5" />
                or chat on WhatsApp →
              </a>
              <p className="text-xs text-primary/70 font-medium">
                First month free for CBN roadmap submissions before June 10, 2026.
              </p>
            </div>
          </AnimatedSection>

          {/* Countdown */}
          <AnimatedSection delay={0.4}>
            <div className="pt-6">
              <p className="text-[10px] uppercase tracking-[0.2em] text-white/30 mb-4 font-medium">Time Until CBN Compliance Deadline</p>
              <div className="inline-flex gap-3 sm:gap-5">
                {[
                  { value: countdown.days, label: 'Days' },
                  { value: countdown.hours, label: 'Hours' },
                  { value: countdown.mins, label: 'Mins' },
                  { value: countdown.secs, label: 'Secs' },
                ].map(({ value, label }) => (
                  <div key={label} className="flex flex-col items-center">
                    <div className="w-16 sm:w-20 h-16 sm:h-20 rounded-xl bg-white/[0.04] border border-white/10 backdrop-blur flex items-center justify-center">
                      <span className="text-2xl sm:text-3xl font-bold tabular-nums text-white">{String(value).padStart(2, '0')}</span>
                    </div>
                    <span className="text-[10px] uppercase tracking-wider text-white/30 mt-2">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </AnimatedSection>

          {/* Social Proof Strip */}
          <AnimatedSection delay={0.5}>
            <div className="pt-10 mt-6 border-t border-white/[0.06] space-y-8">
              <div className="flex items-center justify-center gap-4">
                <div className="h-px flex-1 max-w-[80px] bg-white/10" />
                <p className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-medium text-center">
                  Trusted by compliance teams at leading Nigerian financial institutions
                </p>
                <div className="h-px flex-1 max-w-[80px] bg-white/10" />
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
                {['Tier-2 Bank', 'Licensed Fintech', 'Mobile Money Operator', 'Microfinance Bank', 'PSP'].map((label) => (
                  <span
                    key={label}
                    className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-1.5 text-xs font-medium text-white/40"
                  >
                    {label}
                  </span>
                ))}
              </div>

              <blockquote className="mx-auto max-w-2xl border-l-2 border-primary pl-5 text-left">
                <p className="italic text-white/60 leading-relaxed text-sm sm:text-base">
                  "The AI STR co-pilot cut our investigation time from 3 hours to 12 minutes — and the CBN roadmap template passed first review."
                </p>
                <footer className="mt-3 text-[11px] uppercase tracking-wider text-white/35 not-italic">
                  — Head of Compliance, Licensed PSP, Lagos
                </footer>
              </blockquote>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ── Features Grid ──────────────────────────────────────── */}
      <section id="features" className="relative py-24 px-6">
        <div className="mx-auto max-w-6xl space-y-16">
          <AnimatedSection className="text-center space-y-4">
            <p className="text-xs uppercase tracking-[0.2em] text-primary font-semibold">Platform Capabilities</p>
            <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
              Engineered for the Circular<br className="hidden sm:block" /> BSD/DIR/PUB/LAB/019/002
            </h2>
          </AnimatedSection>

          <div className="grid md:grid-cols-2 gap-5">
            {features.map((f, i) => (
              <AnimatedSection key={f.title} delay={i * 0.1}>
                <div className="group relative rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-md p-7 hover:border-primary/40 transition-all duration-500 hover:shadow-[0_0_40px_-10px_hsl(var(--primary)/0.15)]">
                  <div className="flex items-start gap-5">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 text-primary group-hover:bg-primary/20 transition-colors">
                      <f.icon className="h-5 w-5" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="font-semibold text-white text-base">{f.title}</h3>
                      <p className="text-sm text-white/40 leading-relaxed">{f.desc}</p>
                    </div>
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ── AI Advantage ───────────────────────────────────────── */}
      <section id="ai" className="relative py-24 px-6">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/[0.03] to-transparent pointer-events-none" />
        <div className="relative mx-auto max-w-6xl grid lg:grid-cols-2 gap-16 items-center">
          <AnimatedSection className="space-y-6">
            <p className="text-xs uppercase tracking-[0.2em] text-primary font-semibold">The AI Advantage</p>
            <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight leading-tight">
              45-minute investigations,<br /> now in <span className="text-primary">3 minutes</span>.
            </h2>
            <p className="text-white/40 leading-relaxed">
              Generative AI fine-tuned on Nigerian typologies — POS structuring, Crypto P2P layering, BDC smurfing — drafts examiner-ready STR narratives while your analysts focus on real threats.
            </p>
            <ul className="space-y-3 text-sm text-white/50">
              {['Auto-classifies alerts by NFIU category', 'References specific circular clauses', 'Adapts tone for CBN vs. EFCC submissions'].map((t) => (
                <li key={t} className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-risk-low shrink-0" />
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </AnimatedSection>

          <AnimatedSection delay={0.2}>
            <AIMockUI />
          </AnimatedSection>
        </div>
      </section>

      {/* ── Trust & CTA ────────────────────────────────────────── */}
      <section id="trust" className="relative py-24 px-6">
        <div className="mx-auto max-w-6xl space-y-20">
          {/* Metrics */}
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { value: '85%', label: 'Fewer False Positives' },
              { value: '10x', label: 'Faster Resolution' },
              { value: '100%', label: 'Audit Ready' },
            ].map((m, i) => (
              <AnimatedSection key={m.label} delay={i * 0.1}>
                <div className="text-center rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-md p-10 hover:border-primary/30 transition-all duration-500">
                  <p className="text-5xl md:text-6xl font-extrabold bg-gradient-to-b from-white to-white/40 bg-clip-text text-transparent">{m.value}</p>
                  <p className="mt-3 text-sm text-white/40 font-medium">{m.label}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>

          {/* Final CTA */}
          <AnimatedSection className="text-center space-y-8">
            <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
              Protect your license.<br /> Scale with confidence.
            </h2>
            <p className="text-white/40 max-w-lg mx-auto">
              Join the institutions preparing for the June 2026 deadline. Get private access to Sentinel today.
            </p>
            <LeadCaptureForm />
          </AnimatedSection>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────── */}
      <footer className="border-t border-white/[0.06] py-10 px-6">
        <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/25">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            <span className="font-semibold text-white/40">Sentinel</span>
          </div>
          <p>© {new Date().getFullYear()} Sentinel Technologies. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
