import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { PrintableRoadmap } from '@/components/PrintableRoadmap';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { Shield, Sparkles, SlidersHorizontal, Lock, ArrowRight, Download, CheckCircle2, Loader2, Menu, X, RotateCcw, ExternalLink, FileText, Clock, Globe, Briefcase, ShieldCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import logo from '@/assets/logo.svg';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { BookDemoSheet } from '@/components/landing/BookDemoSheet';
import { QuickDemoBar } from '@/components/landing/QuickDemoBar';
import { LeadCaptureForm } from '@/components/landing/LeadCaptureForm';
import { SocialProofSection } from '@/components/landing/SocialProofSection';
import { HowItWorksSection } from '@/components/landing/HowItWorksSection';
import { ComparisonSection } from '@/components/landing/ComparisonSection';
import { RoadmapLeadMagnet } from '@/components/landing/RoadmapLeadMagnet';
import { StickyComplianceBar } from '@/components/landing/StickyComplianceBar';
import { FAQSection } from '@/components/landing/FAQSection';
import { PricingSection } from '@/components/landing/PricingSection';
import { WhatsAppFloatingButton } from '@/components/landing/WhatsAppFloatingButton';
import { WhatsAppIcon } from '@/components/landing/WhatsAppIcon';
import { WHATSAPP_URL } from '@/lib/whatsapp';
import { ExitIntentModal } from '@/components/landing/ExitIntentModal';
import { ROICalculator } from '@/components/landing/ROICalculator';
import { AudienceProvider, useAudience } from '@/components/landing/AudienceContext';
import { AudienceSelector } from '@/components/landing/AudienceSelector';
import { Seo } from '@/components/Seo';

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

function AnimatedSection({ children, className = '', delay = 0, once = true }: { children: React.ReactNode; className?: string; delay?: number; once?: boolean }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once, margin: '-60px' });
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

// ── Features data (default — overridden by audience selection) ──────────

const FEATURE_ICONS = [Shield, Sparkles, SlidersHorizontal, Lock];

const defaultFeatures = [
  { title: 'Identity & KYC Ops', desc: 'BVN/NIN verification, PEP screening, and tiered risk scoring — all in one automated pipeline.' },
  { title: 'AI STR Co-Pilot', desc: 'Generative AI drafts NFIU-compliant Suspicious Transaction Reports in seconds, not hours.' },
  { title: 'No-Code Rules Engine', desc: 'Build, test, and deploy AML detection rules without writing a single line of code.' },
  { title: 'Immutable Audit Trail', desc: 'Every action timestamped and cryptographically sealed. Always examiner-ready.' },
];

// ── AI Mock Component ────────────────────────────────────────────────────

function AIMockUI() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const inView = useInView(containerRef, { margin: '-80px' });
  const [step, setStep] = useState(0);
  const [runId, setRunId] = useState(0);

  // Reset & restart timer chain whenever the section comes back into view
  // or the user clicks Replay (runId increments).
  useEffect(() => {
    if (!inView) return;
    setStep(0);
    const timers = [
      setTimeout(() => setStep(1), 800),
      setTimeout(() => setStep(2), 2200),
      setTimeout(() => setStep(3), 3400),
      setTimeout(() => setStep(4), 5000),
    ];
    return () => timers.forEach(clearTimeout);
  }, [inView, runId]);

  const lines = [
    { label: 'Analyzing transaction cluster…', done: step >= 1 },
    { label: 'Cross-referencing PEP/sanctions lists…', done: step >= 2 },
    { label: 'Generating NFIU STR narrative…', done: step >= 3 },
  ];

  return (
    <div ref={containerRef} className="relative rounded-xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-5 font-mono text-xs space-y-4 shadow-2xl">
      <div className="flex items-center gap-2 text-primary">
        <Sparkles className="h-4 w-4" />
        <span className="font-semibold tracking-wide uppercase text-[10px]">ApexAML AI Co-Pilot</span>
        <span className="ml-auto rounded-full bg-risk-low/20 text-risk-low px-2 py-0.5 text-[10px]">Live</span>
        {step >= 4 && (
          <button
            type="button"
            onClick={() => setRunId((r) => r + 1)}
            aria-label="Replay demo"
            className="rounded-md p-1 text-white/40 hover:text-white hover:bg-white/10 transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        )}
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
      {step >= 4 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex items-start gap-2 rounded-lg border border-risk-low/30 bg-risk-low/10 p-3"
        >
          <CheckCircle2 className="h-4 w-4 text-risk-low shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="text-[11px] text-foreground/90">Filing to NFIU goAML portal… <span className="text-risk-low font-semibold">Submitted.</span></p>
            <p className="text-[10px] text-muted-foreground">Reference: <span className="text-foreground/80 font-semibold">STR-2026-0041</span> ✓</p>
          </div>
        </motion.div>
      )}
    </div>
  );
}

// ── Roadmap Generator band (highest-converting offer on landing) ─────────

function RoadmapGeneratorBand() {
  const { days } = useCountdown(new Date('2026-06-10T00:00:00'));

  const handleClick = () => {
    // Fire-and-forget analytics. Failures must never block the navigation.
    supabase
      .from('landing_page_clicks')
      .insert({
        source: 'landing_hero_roadmap',
        event: 'roadmap_cta_click',
        page_path: typeof window !== 'undefined' ? window.location.pathname : null,
        referrer: typeof document !== 'undefined' ? document.referrer || null : null,
      })
      .then(({ error }) => {
        if (error) console.warn('landing_page_clicks insert failed', error);
      });
  };

  const trustChips = ['No credit card', 'Instant download', 'Covers all 10 CBN capability areas'];

  return (
    <section
      id="free-roadmap"
      className="relative py-20 px-6 border-l-4 border-primary"
      style={{ backgroundColor: 'hsl(220 25% 10%)' }}
    >
      <div className="mx-auto max-w-6xl">
        <div className="grid lg:grid-cols-5 gap-10 lg:gap-12 items-center">
          {/* Left 60% */}
          <AnimatedSection className="lg:col-span-3 space-y-6">
            <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-primary/10 ring-1 ring-primary/20">
              <FileText className="h-8 w-8 text-primary" strokeWidth={1.75} />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight leading-tight">
              Free: generate your CBN AML roadmap in 60 seconds
            </h2>
            <p className="text-base md:text-lg text-white/60 leading-relaxed max-w-2xl">
              Pre-formatted for Circular BSD/DIR/PUB/LAB/019/002. Tailored to your institution
              type and deadline. Used by 50+ compliance teams. Emailed instantly.
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              {trustChips.map((chip) => (
                <span
                  key={chip}
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-white/70"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 text-risk-low" />
                  {chip}
                </span>
              ))}
            </div>
            <blockquote className="border-l-2 border-primary/40 pl-4 mt-6 text-sm text-white/50 italic">
              "Took 90 seconds. Submitted to CBN the same afternoon."
              <span className="block not-italic text-xs text-white/35 mt-1">
                — CCO, Tier-3 Fintech, Abuja
              </span>
            </blockquote>
          </AnimatedSection>

          {/* Right 40% */}
          <AnimatedSection delay={0.15} className="lg:col-span-2">
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-md p-6 md:p-8 space-y-5">
              <Button
                asChild
                size="lg"
                className="w-full h-14 text-base font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-shadow"
              >
                <Link
                  to="/roadmap?utm_source=landing_page&utm_campaign=roadmap_cta"
                  data-event="roadmap_cta_click"
                  onClick={handleClick}
                >
                  Generate your roadmap
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>

              <div className="flex items-center justify-center gap-2 text-sm text-white/70 bg-primary/5 border border-primary/15 rounded-lg py-3 px-4">
                <Clock className="h-4 w-4 text-primary" />
                <span className="tabular-nums font-semibold text-white">{days}</span>
                <span className="text-white/60">days until the CBN deadline</span>
              </div>

              <p className="text-xs text-center text-white/40 leading-relaxed">
                or scroll down to enter your email for a demo call.
              </p>
            </div>
          </AnimatedSection>
        </div>
      </div>
    </section>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────

const FAQ_FOR_SCHEMA: Array<{ q: string; a: string }> = [
  {
    q: 'Does ApexAML satisfy the June 2026 CBN circular requirements?',
    a: 'Yes. ApexAML covers all 10 capability areas mandated by Circular BSD/DIR/PUB/LAB/019/002, including tiered CDD with BVN/NIN, EDD, PEP and sanctions screening, beneficial-owner identification, transaction monitoring with Nigerian typologies, NFIU goAML STR/CTR submission, immutable audit trail, AML/CFT training and 5-year examiner-ready record retention.',
  },
  {
    q: 'Where is our data stored — is it in Nigeria?',
    a: 'ApexAML is hosted on AWS af-south-1 (Cape Town) — the closest AWS region with data-residency guarantees acceptable under the Nigeria Data Protection Act 2023. PII never crosses borders without your written instruction, and we sign a DPA at contract signing.',
  },
  {
    q: 'How long does integration take?',
    a: '48 hours for API-first fintechs (Paystack, Flutterwave, Mono, Okra). For legacy core banking systems (Finacle, T24, Flexcube) we typically deliver in 2 weeks via batch SFTP or middleware adapters. No vendor middleware required.',
  },
  {
    q: 'What does it cost — is it affordable for a tier-3 MFB?',
    a: 'Pricing starts from ₦800,000/month — less than the loaded cost of a single compliance analyst (₦3–8M/year salary plus benefits). Institutions submitting their CBN roadmap before 10 June 2026 get the first month free.',
  },
  {
    q: 'Can ApexAML submit STRs directly to the NFIU goAML portal?',
    a: 'Today, ApexAML exports each STR as a fully-validated goAML XML file ready for one-click upload via the NFIU portal — no manual reformatting, no rejected submissions. Direct API submission to NFIU is on our Q3 2026 roadmap, pending NFIU API access.',
  },
  {
    q: 'Is ApexAML CBN-approved?',
    a: 'The CBN does not maintain an official certified-vendor list for AML platforms. ApexAML is built exactly to the specifications in Circular BSD/DIR/PUB/LAB/019/002, and we provide a clause-by-clause compliance mapping document with every deployment so your compliance officer can demonstrate fitness during examination.',
  },
  {
    q: 'What happens during a CBN examiner visit?',
    a: 'Examiners typically request the AML policy, sample STRs, the case-management trail for flagged customers, and evidence of independent review. ApexAML produces all four on demand: one-click examiner pack as a sealed PDF bundle, cryptographically-sealed audit trail, per-customer case file with reviewer sign-off and STR linkage, and a live dashboard for the examiner.',
  },
  {
    q: 'Is ApexAML SOC 2 or ISO 27001 certified?',
    a: 'ApexAML is architected from the ground up to meet SOC 2 Type II and ISO 27001 standards. We enforce AES-256 encryption at rest, TLS 1.3 in transit, strict role-based access controls (RBAC), and immutable audit logging. We are currently undergoing our formal readiness assessments for both certifications. In the interim, we provide a comprehensive Vendor Security Questionnaire and our AWS infrastructure compliance reports during procurement.',
  },
];

const LANDING_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQ_FOR_SCHEMA.map(({ q, a }) => ({
    '@type': 'Question',
    name: q,
    acceptedAnswer: { '@type': 'Answer', text: a },
  })),
};

export default function LandingPage() {
  return (
    <AudienceProvider>
      <Seo
        title="ApexAML — Compliance Intelligence for Nigerian Fintechs"
        description="CBN-aligned AML platform for Nigerian fintechs and banks. AI STR co-pilot, BVN/NIN KYC, transaction monitoring, NFIU goAML reporting and examiner-ready audit trails."
        path="/"
        jsonLd={LANDING_JSON_LD}
      />
      <LandingPageInner />
    </AudienceProvider>
  );
}


function LandingPageInner() {
  const countdown = useCountdown(new Date('2026-06-10T00:00:00'));
  const [demoSheetOpen, setDemoSheetOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navRef = useRef<HTMLElement | null>(null);
  const { profile } = useAudience();
  const features = (profile?.features ?? defaultFeatures).map((f, i) => ({
    ...f,
    icon: FEATURE_ICONS[i] ?? Shield,
  }));

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const handler = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [mobileMenuOpen]);

  const navLinks = [
    { href: 'features', label: 'Platform' },
    { href: 'ai', label: 'AI Engine' },
    { href: 'trust', label: 'Results' },
  ];

  const scrollToSection = (href: string) => {
    const el = document.getElementById(href);
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top, behavior: 'smooth' });
    }
    setMobileMenuOpen(false);
  };

  const [quickBarOpen, setQuickBarOpen] = useState(false);
  const [pulseActive, setPulseActive] = useState(true);
  const [stickyBarVisible, setStickyBarVisible] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const printableRef = useRef<HTMLDivElement>(null);
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

  const handleDownloadRoadmap = async () => {
    if (downloadingPdf) return;
    const node = printableRef.current;
    if (!node) {
      toast({ title: 'Could not generate PDF', description: 'Please try again.', variant: 'destructive' });
      return;
    }

    setDownloadingPdf(true);
    const loadingToast = toast({
      title: 'Generating PDF…',
      description: 'Rendering your CBN roadmap template. This takes a few seconds.',
    });

    try {
      const canvas = await html2canvas(node, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
        logging: false,
        windowWidth: node.scrollWidth,
        windowHeight: node.scrollHeight,
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF({ unit: 'pt', format: 'a4', orientation: 'portrait' });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save('CBN_AML_Roadmap_Template.pdf');
      loadingToast.dismiss();
      toast({ title: 'PDF downloaded', description: 'Your CBN roadmap template is ready.' });
    } catch (err) {
      console.error('PDF generation failed', err);
      loadingToast.dismiss();
      toast({
        title: 'PDF generation failed',
        description: 'Please try again or contact support.',
        variant: 'destructive',
      });
    } finally {
      setDownloadingPdf(false);
    }
  };


  return (
    <div className="min-h-screen bg-[hsl(220,25%,6%)] text-foreground overflow-x-hidden">
      {/* ── Navbar ─────────────────────────────────────────────── */}
      <nav ref={navRef} className="fixed top-0 inset-x-0 z-50 border-b border-white/[0.06] bg-[hsl(220,25%,6%)]/70 backdrop-blur-xl">
        <div className="mx-auto max-w-6xl flex items-center justify-between px-6 h-16">
          <div className="flex items-center gap-2">
            <img src={logo} alt="ApexAML" className="h-7 w-7" />
            <span className="font-bold text-lg tracking-tight text-white">ApexAML</span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm text-white/60">
            {navLinks.map(({ href, label }) => (
              <button
                key={href}
                onClick={() => scrollToSection(href)}
                className="hover:text-white transition-colors"
              >
                {label}
              </button>
            ))}
          </div>

          {/* Desktop Book Demo */}
          <Button
            size="sm"
            onClick={handleBookDemo}
            className={`hidden md:inline-flex bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-xs font-semibold ${pulseActive ? 'ring-2 ring-primary/30 animate-pulse' : ''}`}
          >
            Book Demo
          </Button>

          {/* Mobile hamburger */}
          <button
            type="button"
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen((v) => !v)}
            className="md:hidden h-11 w-11 flex items-center justify-center rounded-lg text-white/60 hover:text-white hover:bg-white/5 transition-colors"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile dropdown panel */}
        <AnimatePresence initial={false}>
          {mobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="md:hidden overflow-hidden border-t border-white/[0.06] bg-[hsl(220,25%,6%)]/95 backdrop-blur-xl"
            >
              <div className="px-6 py-4 space-y-1">
                {navLinks.map(({ href, label }) => (
                  <button
                    key={href}
                    onClick={() => scrollToSection(href)}
                    className="w-full text-left h-11 px-3 rounded-lg text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors flex items-center"
                  >
                    {label}
                  </button>
                ))}
                <Button
                  onClick={() => { setMobileMenuOpen(false); handleBookDemo(); }}
                  className="w-full mt-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-sm font-semibold h-11"
                >
                  Book Demo
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
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
                  className="relative bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl text-sm font-semibold px-8 group min-h-[44px] py-4 md:py-2 w-full sm:w-auto"
                >
                  Book a 20-min Demo
                  <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-0.5 transition-transform" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={handleDownloadRoadmap}
                  className="rounded-xl bg-transparent border-white/15 text-white/80 hover:bg-white/5 hover:text-white text-sm px-8 min-h-[44px] py-4 md:py-2 w-full sm:w-auto"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download CBN Roadmap Template (Free)
                </Button>
              </div>
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-white/60 hover:text-white transition-colors"
              >
                <WhatsAppIcon size={14} />
                or chat on WhatsApp
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

      {/* ── Audience Selector ──────────────────────────────────── */}
      <AudienceSelector />

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

      {/* ── Social Proof ───────────────────────────────────────── */}
      <SocialProofSection />

      {/* ── How It Works ───────────────────────────────────────── */}
      <HowItWorksSection />

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

      {/* ── Compliance ROI & Risk Calculator ──────────────────── */}
      <ROICalculator />

      {/* ── Free Roadmap Generator (highest-converting offer) ─── */}
      <RoadmapGeneratorBand />

      {/* ── Comparison ─────────────────────────────────────────── */}
      <ComparisonSection />

      {/* ── Roadmap Lead Magnet ────────────────────────────────── */}
      <RoadmapLeadMagnet />

      {/* ── Company & Leadership ───────────────────────────────── */}
      <section className="relative py-24 px-6 bg-slate-950/40 border-y border-white/[0.06]">
        <div className="mx-auto max-w-6xl space-y-14">
          <AnimatedSection className="text-center space-y-3">
            <p className="text-xs uppercase tracking-[0.25em] text-primary font-semibold drop-shadow-[0_0_12px_hsl(var(--primary)/0.6)]">
              Company & Leadership
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight max-w-3xl mx-auto">
              Built by compliance veterans. Secured by UK engineering.
            </h2>
          </AnimatedSection>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                Icon: Globe,
                title: 'UK Corporate Governance',
                eyebrow: 'Backed by Nubetech Ltd (UK)',
                text: 'ApexAML is developed by Nubetech Ltd, a specialized UK technology consultancy. We bring stringent British data governance and stability to the Nigerian compliance ecosystem.',
              },
              {
                Icon: Briefcase,
                title: 'In-the-Trenches Experience',
                eyebrow: 'Deep Nigerian Banking Roots',
                text: 'Built by former Nigerian banking executives who led Client Onboarding, KYC, and Documentation. We understand your NFIU and CBN regulatory bottlenecks because we have lived them.',
              },
              {
                Icon: ShieldCheck,
                title: 'Vetted Enterprise Security',
                eyebrow: 'Microsoft-Certified AI & Security',
                text: 'Architected by Microsoft-Certified AI Consultants with cross-sector financial experience. Our founders undergo rigorous security vetting to ensure your highly sensitive data is never compromised.',
              },
            ].map(({ Icon, title, eyebrow, text }, i) => (
              <AnimatedSection key={title} delay={i * 0.1}>
                <div className="group h-full bg-white/[0.02] border border-white/10 p-8 rounded-2xl backdrop-blur-md transition-all duration-300 hover:border-primary/50 hover:bg-white/[0.035] hover:shadow-[0_0_40px_-10px_hsl(var(--primary)/0.4)]">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 border border-primary/25 flex items-center justify-center mb-5 transition-colors group-hover:bg-primary/15 group-hover:border-primary/40">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-primary/80 font-semibold mb-2">
                    {eyebrow}
                  </p>
                  <h3 className="text-lg font-semibold text-white mb-3 tracking-tight">
                    {title}
                  </h3>
                  <p className="text-sm text-white/55 leading-relaxed">
                    {text}
                  </p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ── Trust & CTA ────────────────────────────────────────── */}
      <section id="trust" className="relative py-24 px-6">
        <div className="mx-auto max-w-6xl space-y-20">
          {/* Metrics */}
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              {
                value: 'From 3 hrs to 11 min',
                label: 'Average STR investigation time',
                source: 'Based on 47-transaction case study with Nigerian Tier-3 fintech',
              },
              {
                value: 'June 10, 2026',
                label: 'CBN roadmap submission deadline',
                source: 'ApexAML clients submit their roadmap in under 2 hours using our template',
              },
              {
                value: 'goAML-ready XML',
                label: 'Every STR exported in NFIU-mandated format',
                source: 'No manual re-formatting. No rejected submissions.',
              },
            ].map((m, i) => (
              <AnimatedSection key={m.label} delay={i * 0.1}>
                <div className="group h-full rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-md p-8 hover:border-primary/30 transition-all duration-500 flex flex-col">
                  <p className="text-2xl md:text-3xl font-extrabold text-white leading-tight tracking-tight">
                    {m.value}
                  </p>
                  <p className="mt-3 text-sm text-white/60 font-medium">{m.label}</p>
                  <div className="mt-auto pt-5 flex items-start justify-between gap-3 border-t border-white/[0.06] mt-6">
                    <p className="text-[10px] text-white/30 leading-relaxed">{m.source}</p>
                    <button
                      type="button"
                      aria-label="View methodology"
                      className="shrink-0 text-white/25 hover:text-primary transition-colors"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </button>
                  </div>
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
              Join the institutions preparing for the June 2026 deadline. Get private access to ApexAML today.
            </p>
            <LeadCaptureForm />
            <div className="mt-4 flex items-center justify-center gap-2 text-[11px] text-white/30">
              <Lock className="h-3 w-3" />
              <span>Bank-grade security. 256-bit encryption. NDPA compliant.</span>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ── Pricing ────────────────────────────────────────────── */}
      <PricingSection onBookDemo={() => setDemoSheetOpen(true)} />

      {/* ── FAQ ────────────────────────────────────────────────── */}
      <FAQSection />

      {/* ── Footer ─────────────────────────────────────────────── */}
      <footer className="border-t border-white/[0.06] py-10 px-6">
        <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-6 text-xs text-white/30">
          <div className="flex items-center gap-3 flex-wrap">
            <img src={logo} alt="ApexAML" className="h-5 w-5" />
            <span className="font-semibold text-white/50">ApexAML</span>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/25 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
                NDPR Compliant
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/25 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
                Architected to SOC 2 Standards
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/25 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
                ISO 27001 In Progress
              </span>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
            <Link to="/privacy" className="hover:text-white/70 transition-colors">Privacy Policy</Link>
            <a href="mailto:privacy@apexaml.com?subject=DPA%20request" className="hover:text-white/70 transition-colors">
              Data Processing Agreement
            </a>
            <a href="mailto:privacy@apexaml.com" className="hover:text-white/70 transition-colors">
              Contact DPO
            </a>
          </div>
          <p className="text-white/25">© {new Date().getFullYear()} ApexAML Technologies.</p>
        </div>
      </footer>
      <StickyComplianceBar
        daysRemaining={countdown.days}
        onBookDemo={() => setDemoSheetOpen(true)}
        onVisibilityChange={setStickyBarVisible}
      />
      <WhatsAppFloatingButton shifted={stickyBarVisible} />
      <ExitIntentModal daysRemaining={countdown.days} />

      {/* Hidden printable roadmap — rendered off-screen so html2canvas can rasterise it. */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          left: '-10000px',
          top: 0,
          width: '800px',
          pointerEvents: 'none',
          opacity: 0,
        }}
      >
        <PrintableRoadmap
          ref={printableRef}
          institutionName="[Your Institution Name]"
          institutionType="[Your Institution Type]"
          contactName="[Compliance Officer Name]"
          contactTitle="[Title]"
          email="[Your Email]"
          amlSetup="No formal system"
          volume="[Monthly Volume]"
          referenceNumber="TEMPLATE-2026-XXXX"
          todayFormatted={new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
          fullDeadline="March 2028"
        />
      </div>
    </div>
  );
}
