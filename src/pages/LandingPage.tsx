import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useInView, AnimatePresence } from "framer-motion";
import {
  Shield,
  Sparkles,
  SlidersHorizontal,
  Lock,
  ArrowRight,
  Calendar,
  Play,
  CheckCircle2,
  Loader2,
  Menu,
  X,
  RotateCcw,
  FileText,
  Globe,
  Briefcase,
  ShieldCheck,
  Twitter,
  Linkedin,
} from "lucide-react";
import { sendPublicEvent } from "@/lib/publicSubmit";
import logo from "@/assets/logo.svg";
import { Button } from "@/components/ui/button";
import { BookDemoSheet } from "@/components/landing/BookDemoSheet";
import { ProductTourModal } from "@/components/ProductTourModal";
import { QuickDemoBar } from "@/components/landing/QuickDemoBar";
import { LeadCaptureForm } from "@/components/landing/LeadCaptureForm";
import { SocialProofSection } from "@/components/landing/SocialProofSection";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { ComparisonSection } from "@/components/landing/ComparisonSection";
import { AITimelineVisualizer } from "@/components/AITimelineVisualizer";
import { RoadmapLeadMagnet } from "@/components/landing/RoadmapLeadMagnet";
import { FAQSection } from "@/components/landing/FAQSection";
import { PricingSection } from "@/components/landing/PricingSection";
import { CompetitorComparison } from "@/components/CompetitorComparison";

import { WhatsAppIcon } from "@/components/landing/WhatsAppIcon";
import { WHATSAPP_URL } from "@/lib/whatsapp";
import { ROICalculator } from "@/components/landing/ROICalculator";
import { ROICalculator as STRCostCalculator } from "@/components/ROICalculator";
import { InnovationStory } from "@/components/InnovationStory";
import { ComplianceRoadmapSection } from "@/components/ComplianceRoadmapSection";
import { AudienceProvider, useAudience } from "@/components/landing/AudienceContext";
import { AudienceSelector } from "@/components/landing/AudienceSelector";
import { Seo } from "@/components/Seo";
import { useRoadmapCount } from "@/hooks/useRoadmapCount";
import { CompanyFooterLine } from "@/components/CompanyFooterLine";
import { PLAN_PRICING, IMPLEMENTATION_PRICE_RANGE } from "@/lib/pricing";

// Live-data social-proof line rendered under the hero CTA and inside the
// RoadmapGeneratorBand. Renders nothing while loading or on failure so we
// never expose "0" or an error state on the public landing page.
function RoadmapCountLine({ variant }: { variant: "hero" | "band" }) {
  const count = useRoadmapCount();
  if (count === null || count <= 0) return null;

  if (variant === "hero") {
    return (
      <p className="flex items-center justify-center gap-2 text-[13px] text-white/50">
        <span className="relative inline-flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full rounded-full bg-risk-low opacity-60 animate-ping" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-risk-low" />
        </span>
        <span>
          Join{" "}
          <span className="text-primary font-semibold">{count.toLocaleString()}</span>{" "}
          compliance officers who have already generated their CBN AML roadmap →
        </span>
      </p>
    );
  }

  return (
    <p className="text-sm text-white/55">
      <span className="text-primary font-semibold">{count.toLocaleString()}</span>{" "}
      institution-specific roadmaps generated — covering all 10 CBN capability areas
    </p>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────


const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as const } },
};

function AnimatedSection({
  children,
  className = "",
  delay = 0,
  once = true,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  once?: boolean;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
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
  {
    title: "Identity & KYC Ops",
    desc: "BVN/NIN verification, PEP screening, and tiered risk scoring — all in one automated pipeline.",
  },
  {
    title: "AI STR Co-Pilot",
    desc: "AI-assisted STR drafting from the case's own data, reviewed and edited by an analyst.",
  },
  {
    title: "No-Code Rules Engine",
    desc: "Build, test, and deploy AML detection rules without writing a single line of code.",
  },
  {
    title: "Immutable Audit Trail",
    desc: "Every action timestamped in an append-only audit trail that cannot be edited or deleted.",
  },
];

// ── AI Mock Component ────────────────────────────────────────────────────

function AIMockUI() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const inView = useInView(containerRef, { margin: "-80px" });
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
    { label: "Analyzing transaction cluster…", done: step >= 1 },
    { label: "Cross-referencing PEP/sanctions lists…", done: step >= 2 },
    { label: "Generating NFIU STR narrative…", done: step >= 3 },
  ];

  return (
    <div
      ref={containerRef}
      className="relative rounded-xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-5 font-mono text-xs space-y-4 shadow-2xl"
    >
      <div className="flex items-center gap-2 text-primary">
        <Sparkles className="h-4 w-4" />
        <span className="font-semibold tracking-wide uppercase text-[10px]">AI Co-Pilot in action</span>
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
          <div key={i} className="flex items-center gap-2">
            {l.done ? (
              <CheckCircle2 className="h-3.5 w-3.5 text-risk-low shrink-0" />
            ) : (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-primary shrink-0" />
            )}
            <span className={l.done ? "text-white" : "text-white/75"}>{l.label}</span>
          </div>
        ))}
      </div>
      {step >= 3 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="rounded-lg bg-white/[0.04] border border-white/10 p-3 space-y-2"
        >
          <p className="text-[10px] uppercase tracking-wider text-primary font-semibold">Generated STR Excerpt</p>
          <p className="text-white/85 leading-relaxed text-[11px]">
            "Subject <span className="text-white font-semibold">Adewale O.</span> conducted{" "}
            <span className="text-risk-high">47 POS transactions</span> across 12 terminals in Lekki within{" "}
            <span className="text-risk-critical">72 hours</span>, totalling ₦14.8M. Pattern consistent with
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
            <p className="text-[11px] text-white">
              <span className="text-white/75">goAML-format STR/CTR export for analyst review and upload…</span>{" "}
              <span className="text-risk-low font-semibold">Draft XML ready.</span>
            </p>
            <p className="text-[10px] text-white/70">
              Reference: <span className="text-white font-semibold">STR-2026-00041</span> ✓
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
}

// ── Roadmap Generator band (highest-converting offer on landing) ─────────

function RoadmapGeneratorBand() {
  const handleClick = () => {
    // Fire-and-forget analytics. Failures must never block the navigation.
    void sendPublicEvent("landing_click", {
      source: "landing_hero_roadmap",
      event: "roadmap_cta_click",
      page_path: typeof window !== "undefined" ? window.location.pathname : null,
      referrer: typeof document !== "undefined" ? document.referrer || null : null,
    }).then((r) => {
      if (!r.ok) console.warn("landing click tracking failed", r.reason);
    });
  };

  const trustChips = ["No credit card", "Instant download", "Covers all 10 CBN capability areas"];

  return (
    <section
      id="free-roadmap"
      className="relative py-20 px-6 border-l-4 border-primary"
      style={{ backgroundColor: "hsl(220 25% 10%)" }}
    >
      <div className="mx-auto max-w-6xl">
        <div className="grid lg:grid-cols-5 gap-10 lg:gap-12 items-center">
          {/* Left 60% */}
          <AnimatedSection className="lg:col-span-3 space-y-6">
            <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-primary/10 ring-1 ring-primary/20">
              <FileText className="h-8 w-8 text-primary" strokeWidth={1.75} />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight leading-tight">
              Generate your CBN AML implementation roadmap
            </h2>
            <RoadmapCountLine variant="band" />
            <p className="text-base md:text-lg text-white/60 leading-relaxed max-w-2xl">
              Pre-formatted for CBN Circular BSD/DIR/PUB/LAB/019/002. Tailored to your institution type and compliance timeline.
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

              <p className="text-xs text-center text-muted-on-dark leading-relaxed">
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
    q: "Does ApexAML satisfy the CBN circular requirements?",
    a: "Yes. ApexAML covers all 10 capability areas mandated by Circular BSD/DIR/PUB/LAB/019/002, including tiered CDD with BVN/NIN, EDD, PEP and sanctions screening, beneficial-owner identification, transaction monitoring with Nigerian typologies, goAML-format STR/CTR export for analyst review and upload, an append-only audit trail, AML/CFT training and 5-year record retention.",
  },
  {
    q: "Where is our data stored — is it in Nigeria?",
    a: "Hosted on Supabase (AWS Ireland, eu-west-1), encrypted in transit and at rest. Data residency in Nigeria is not currently offered. Contact us about your requirements. We sign a DPA at contract signing.",
  },
  {
    q: "How long does integration take?",
    a: "API-first fintechs (Paystack, Flutterwave, Mono, Okra) connect over REST API. Legacy core banking systems (Finacle, T24, Flexcube) connect via batch SFTP or middleware adapters. We scope the timeline in your walkthrough and prove it during the 30-45 day pilot on your own data.",
  },
  {
    q: "What does it cost — is it affordable for a tier-3 MFB?",
    a: `Essential: ₦${PLAN_PRICING.essential.toLocaleString("en-NG")}/month. Starter: ₦${PLAN_PRICING.starter.toLocaleString("en-NG")}/month. Growth: ₦${PLAN_PRICING.growth.toLocaleString("en-NG")}/month. IMTO: ₦${PLAN_PRICING.imtoPerTransaction} per transaction with a ₦${PLAN_PRICING.imtoMonthlyMinimum.toLocaleString("en-NG")} monthly minimum. Professional Implementation Programme: ${IMPLEMENTATION_PRICE_RANGE.toLowerCase()}`,
  },
  {
    q: "Can ApexAML submit STRs directly to the NFIU goAML portal?",
    a: "No. ApexAML prepares each STR as a goAML-format XML file. Your institution's authorised person reviews it and uploads it via the NFIU goAML portal. Validation against the current NFIU schema is in progress, and ApexAML does not submit reports to the NFIU.",
  },
  {
    q: "Is ApexAML CBN-approved?",
    a: "The CBN does not maintain an official certified-vendor list for AML platforms. ApexAML is built exactly to the specifications in Circular BSD/DIR/PUB/LAB/019/002, and we provide a clause-by-clause compliance mapping document with every deployment so your compliance officer can demonstrate fitness during examination.",
  },
  {
    q: "What happens during a CBN examiner visit?",
    a: "Examiners typically request the AML policy, sample STRs, the case-management trail for flagged customers, and evidence of independent review. ApexAML keeps all four on hand: an append-only audit trail that cannot be edited or deleted, per-customer case files with investigator notes, reviewer sign-off and STR linkage, STRs exported as goAML XML for review and upload, and a live dashboard your compliance officer can present directly.",
  },
  {
    q: "Is ApexAML SOC 2 or ISO 27001 certified?",
    a: "ApexAML is architected from the ground up to meet SOC 2 Type II and ISO 27001 standards. We enforce AES-256 encryption at rest, TLS 1.3 in transit, strict role-based access controls (RBAC), and immutable audit logging. We are currently undergoing our formal readiness assessments for both certifications. In the interim, we provide a comprehensive Vendor Security Questionnaire and our AWS infrastructure compliance reports during procurement.",
  },
];

const LANDING_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ_FOR_SCHEMA.map(({ q, a }) => ({
    "@type": "Question",
    name: q,
    acceptedAnswer: { "@type": "Answer", text: a },
  })),
};

export default function LandingPage() {
  return (
    <AudienceProvider>
      <Seo
        title="ApexAML — Compliance Intelligence for Nigerian Fintechs"
        description="CBN-aligned AML platform for Nigerian fintechs and banks. AI-assisted STR drafting from the case's own data, reviewed and edited by an analyst. BVN/NIN KYC, transaction monitoring, NFIU goAML reporting and an append-only audit trail."
        path="/"
        jsonLd={LANDING_JSON_LD}
      />
      <LandingPageInner />
    </AudienceProvider>
  );
}

function LandingPageInner() {
  const [demoSheetOpen, setDemoSheetOpen] = useState(false);
  const [demoSheetMessage, setDemoSheetMessage] = useState<string | undefined>(undefined);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [tourOpen, setTourOpen] = useState(false);
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
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [mobileMenuOpen]);

  const navLinks = [
    { href: "features", label: "Platform" },
    { href: "ai", label: "AI Engine" },
    { href: "trust", label: "Pilot" },
  ];

  const scrollToSection = (href: string) => {
    const el = document.getElementById(href);
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top, behavior: "smooth" });
    }
    setMobileMenuOpen(false);
  };

  const [quickBarOpen, setQuickBarOpen] = useState(false);
  const [pulseActive, setPulseActive] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setPulseActive(false), 10000);
    return () => clearTimeout(t);
  }, []);

  const handleBookDemo = () => {
    setDemoSheetOpen(true);
    setQuickBarOpen(true);
    setPulseActive(false);
    const el = document.getElementById("hero-cta");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };



  return (
    <div className="min-h-screen bg-[hsl(220,25%,6%)] text-foreground overflow-x-hidden">
      {/* ── Navbar ─────────────────────────────────────────────── */}
      <nav
        ref={navRef}
        className="fixed top-0 inset-x-0 z-50 border-b border-white/[0.06] bg-[hsl(220,25%,6%)]/70 backdrop-blur-xl"
      >
        <div className="mx-auto max-w-6xl flex items-center justify-between px-6 h-16">
          <div className="flex items-center gap-2">
            <img src={logo} alt="ApexAML" className="h-7 w-7" />
            <span className="font-bold text-lg tracking-tight text-white">ApexAML</span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm text-white/60">
            {navLinks.map(({ href, label }) => (
              <button key={href} onClick={() => scrollToSection(href)} className="hover:text-white transition-colors">
                {label}
              </button>
            ))}
            <Link to="/contact" className="hover:text-white transition-colors">Contact</Link>
            <Link to="/demo?demo=true" className="hover:text-white transition-colors">Try the demo</Link>
          </div>

          {/* Desktop Book Demo */}
          <Button
            size="sm"
            onClick={handleBookDemo}
            className={`hidden md:inline-flex bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-xs font-semibold ${pulseActive ? "ring-2 ring-primary/30 animate-pulse" : ""}`}
          >
            Book a walkthrough
          </Button>

          {/* Mobile hamburger */}
          <button
            type="button"
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
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
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
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
                <Link
                  to="/contact"
                  className="w-full text-left h-11 px-3 rounded-lg text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors flex items-center"
                >
                  Contact
                </Link>
                <Link
                  to="/demo?demo=true"
                  className="w-full text-left h-11 px-3 rounded-lg text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors flex items-center"
                >
                  Try the demo
                </Link>
                <Button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleBookDemo();
                  }}
                  className="w-full mt-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-sm font-semibold h-11"
                >
                  Book a walkthrough
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      <QuickDemoBar open={quickBarOpen} onClose={() => setQuickBarOpen(false)} />

      <BookDemoSheet
        open={demoSheetOpen}
        onOpenChange={(o) => {
          setDemoSheetOpen(o);
          if (!o) setDemoSheetMessage(undefined);
        }}
        prefilledMessage={demoSheetMessage}
      />
      <ProductTourModal
        open={tourOpen}
        onClose={() => setTourOpen(false)}
        onBookDemo={() => setDemoSheetOpen(true)}
      />

      {/* ── Hero ───────────────────────────────────────────────── */}
      <section className="relative pt-32 pb-20 md:pt-44 md:pb-32 px-6">
        {/* Glow effects */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary/15 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-40 right-1/4 w-[300px] h-[300px] bg-primary/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative mx-auto max-w-4xl text-center space-y-8">
          <AnimatedSection>
            <p className="inline-block rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-medium text-primary tracking-wide uppercase">
              Designed for compliance teams across Nigerian fintechs, PSPs, MFBs, and IMTOs
            </p>
          </AnimatedSection>

          <AnimatedSection delay={0.1}>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.1] text-white">
              Nigeria&apos;s financial system is modernising.
              <br />
              <span className="text-[#D4A843]">ApexAML is the platform that makes it possible.</span>
            </h1>
          </AnimatedSection>

          <AnimatedSection delay={0.2}>
            <p className="mx-auto max-w-2xl text-base text-white/50 leading-relaxed">
              An AML compliance platform built around CBN Circular BSD/DIR/PUB/LAB/019/002 (10 March 2026), with an STR drafting assistant, IMTO monitoring scenarios you can explore in the demo, and STR export to a goAML-style XML file (validation against the NFIU schema in progress).
            </p>
          </AnimatedSection>

          <AnimatedSection delay={0.25}>
            <div className="flex flex-wrap justify-center gap-3 text-sm text-muted-on-dark">
              <span>Analyst-reviewed STR drafts</span>
              <span>Scope agreed during your pilot</span>
              <span>Published subscription pricing</span>
            </div>
          </AnimatedSection>

          <AnimatedSection delay={0.3}>
            <div id="hero-cta" className="scroll-mt-32 space-y-5">

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button
                  size="lg"
                  onClick={() => setDemoSheetOpen(true)}
                  className="relative bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl text-sm font-semibold px-8 group min-h-[44px] py-4 md:py-2 w-full sm:w-auto"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Book a 30-minute walkthrough
                  <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-0.5 transition-transform" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => setTourOpen(true)}
                  className="rounded-xl bg-transparent border-white/15 text-white/80 hover:bg-white/5 hover:text-white text-sm px-8 min-h-[44px] py-4 md:py-2 w-full sm:w-auto"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Take a 2-minute product tour →
                </Button>
              </div>
              <p className="text-center text-sm text-muted-on-dark">
                Then run a 30-45 day pilot on your own data
              </p>
              <RoadmapCountLine variant="hero" />
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-white/60 hover:text-white transition-colors"
              >
                <WhatsAppIcon size={14} />
                Chat on WhatsApp
              </a>
              <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-xs text-muted-on-dark">
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="h-3 w-3 text-risk-low" />
                  CBN Circular BSD/DIR/PUB/LAB/019/002 aligned
                </span>
                <span className="hidden sm:inline text-muted-on-dark">·</span>
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="h-3 w-3 text-risk-low" />
                  goAML-style XML export
                </span>
                <span className="hidden sm:inline text-muted-on-dark">·</span>
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="h-3 w-3 text-risk-low" />
                  Aligned with CBN Circular BSD/DIR/PUB/LAB/019/002, issued 10 March 2026
                </span>
                <span className="hidden sm:inline text-muted-on-dark">·</span>
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="h-3 w-3 text-risk-low" />
                  Hosted on Supabase (AWS Ireland, eu-west-1), encrypted in transit and at rest. Data residency in Nigeria is not currently offered. Contact us about your requirements.
                </span>
              </div>
            </div>
          </AnimatedSection>



          {/* Social Proof Strip */}
          <AnimatedSection delay={0.5}>
            <div className="pt-10 mt-6 border-t border-white/[0.06] space-y-8">
              <div className="flex items-center justify-center gap-4">
                <div className="h-px flex-1 max-w-[80px] bg-white/10" />
                <p className="text-[10px] uppercase tracking-[0.2em] text-muted-on-dark font-medium text-center">
                  Built for compliance teams at Nigerian financial institutions
                </p>
                <div className="h-px flex-1 max-w-[80px] bg-white/10" />
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
                {["Tier-2 Bank", "Licensed Fintech", "Mobile Money Operator", "Microfinance Bank", "PSP"].map(
                  (label) => (
                    <span
                      key={label}
                      className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-1.5 text-xs font-medium text-muted-on-dark"
                    >
                      {label}
                    </span>
                  ),
                )}
              </div>

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
              Engineered for the Circular
              <br className="hidden sm:block" /> BSD/DIR/PUB/LAB/019/002
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
                      <p className="text-sm text-muted-on-dark leading-relaxed">{f.desc}</p>
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

      {/* ── Inside the Engine: STR drafting workflow ──────────── */}
      <section className="relative py-24 px-6 overflow-hidden bg-[#0a0f1c] border-y border-white/5">
        <div className="mx-auto max-w-3xl text-center space-y-4 mb-14">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">
            Inside the Engine
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight">STR drafting workflow</h2>
          <p className="text-white/50 leading-relaxed max-w-2xl mx-auto">
            Legacy software relies on human analysts to manually query NIBSS, cross-reference watchlists, and type out
            goAML reports. Watch how the ApexAML engine automates the entire regulatory lifecycle.
          </p>
        </div>
        <AITimelineVisualizer />
      </section>

      {/* ── AI Advantage ───────────────────────────────────────── */}
      <section id="ai" className="relative py-24 px-6">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/[0.03] to-transparent pointer-events-none" />
        <div className="relative mx-auto max-w-6xl grid lg:grid-cols-2 gap-16 items-center">
          <AnimatedSection className="space-y-6">
            <p className="text-xs uppercase tracking-[0.2em] text-primary font-semibold">The AI Advantage</p>
            <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight leading-tight">
              AI-assisted STR drafting,
              <br /> <span className="text-primary">reviewed by your analyst</span>.
            </h2>
            <p className="text-muted-on-dark leading-relaxed">
              AI-assisted STR drafting from the case's own data, reviewed and edited by an analyst. Every revision is saved in the edit history.
            </p>
            <ul className="space-y-3 text-sm text-white/50">
              {[
                "Drafts from the case's own alert, customer record and transactions",
                "Saves every revision as a new, dated version",
                "Analyst reviews and edits before anything is exported",
              ].map((t) => (
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

      {/* ── Innovation Story ───────────────────────────────────── */}
      <InnovationStory onBookDemo={() => setDemoSheetOpen(true)} />

      {/* ── STR Cost Calculator ────────────────────────────────── */}
      <STRCostCalculator />

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
                title: "UK Corporate Governance",
                eyebrow: "Backed by Nubetech Ltd (UK)",
                text: "ApexAML is developed by Nubetech Ltd, a specialized UK technology consultancy (Companies House registration number 11844857). We bring stringent British data governance and stability to the Nigerian compliance ecosystem.",
              },
              {
                Icon: Briefcase,
                title: "In-the-Trenches Experience",
                eyebrow: "Deep Nigerian Banking Roots",
                text: "Built by former Nigerian banking executives who led Client Onboarding, KYC, and Documentation. We understand your NFIU and CBN regulatory bottlenecks because we have lived them.",
              },
              {
                Icon: ShieldCheck,
                title: "Vetted Enterprise Security",
                eyebrow: "Microsoft-Certified AI & Security",
                text: "Architected by Microsoft-Certified AI Consultants with cross-sector financial experience. Our founders undergo rigorous security vetting to ensure your highly sensitive data is never compromised.",
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
                  <h3 className="text-lg font-semibold text-white mb-3 tracking-tight">{title}</h3>
                  <p className="text-sm text-white/55 leading-relaxed">{text}</p>
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
                value: "Analyst-reviewed drafts",
                label: "STR drafting from the case’s own data",
                source: "Your analyst reviews and edits the narrative before export. No measured turnaround claim.",
              },
              {
                value: "30-45 days",
                label: "Pilot on your own data before you commit",
                source: "REST API for API-first fintechs; batch SFTP or middleware adapters for Finacle, T24 and Flexcube",
              },
              {
                value: "goAML-ready XML",
                label: "Every STR exported in NFIU-mandated format",
                source: "Review the exported XML before submission through the NFIU portal.",
              },
            ].map((m, i) => (
              <AnimatedSection key={m.label} delay={i * 0.1}>
                <div className="group h-full rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-md p-8 hover:border-primary/30 transition-all duration-500 flex flex-col">
                  <p className="text-2xl md:text-3xl font-extrabold text-white leading-tight tracking-tight">
                    {m.value}
                  </p>
                  <p className="mt-3 text-sm text-white/60 font-medium">{m.label}</p>
                  <div className="mt-auto pt-5 flex items-start justify-between gap-3 border-t border-white/[0.06] mt-6">
                    <p className="text-[10px] text-muted-on-dark leading-relaxed">{m.source}</p>
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>

          {/* Final CTA */}
          <AnimatedSection className="text-center space-y-8">
            <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
              Protect your license.
              <br /> Scale with confidence.
            </h2>
            <p className="text-muted-on-dark max-w-lg mx-auto">
              Explore a pilot to modernise your institution’s compliance workflows with ApexAML.
            </p>
            <LeadCaptureForm />
            <div className="mt-4 flex items-center justify-center gap-2 text-[11px] text-muted-on-dark">
              <Lock className="h-3 w-3" />
              <span>Bank-grade security. 256-bit encryption. NDPA compliant.</span>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ── Compliance Roadmap Timeline ──────────────────────── */}
      <ComplianceRoadmapSection
        onBookDemo={(message) => {
          setDemoSheetMessage(message);
          setDemoSheetOpen(true);
        }}
        onSeePath={() => scrollToSection("free-roadmap")}
      />

      {/* ── Pricing ────────────────────────────────────────────── */}
      <PricingSection
        onBookDemo={(message) => {
          setDemoSheetMessage(message);
          setDemoSheetOpen(true);
        }}
      />

      {/* ── Competitor Comparison ──────────────────────────────── */}
      <CompetitorComparison />

      {/* ── FAQ ────────────────────────────────────────────────── */}
      <FAQSection />

      {/* ── Footer ─────────────────────────────────────────────── */}
      <footer className="border-t border-white/[0.06] py-10 px-6">
        <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-6 text-xs text-muted-on-dark">
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
            <Link to="/privacy" className="hover:text-white/70 transition-colors">
              Privacy Policy
            </Link>
            <Link to="/contact" className="hover:text-white/70 transition-colors">
              Contact
            </Link>
            <a
              href="mailto:privacy@apexaml.com?subject=DPA%20request"
              className="hover:text-white/70 transition-colors"
            >
              Data Processing Agreement
            </a>
            <a href="mailto:privacy@apexaml.com" className="hover:text-white/70 transition-colors">
              Contact DPO
            </a>
            <a
              href="https://twitter.com/ApexAML"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="ApexAML on Twitter"
              className="inline-flex items-center hover:text-white/70 transition-colors"
            >
              <Twitter className="h-4 w-4" />
            </a>
            <a
              href="https://linkedin.com/company/apexaml"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="ApexAML on LinkedIn"
              className="inline-flex items-center hover:text-white/70 transition-colors"
            >
              <Linkedin className="h-4 w-4" />
            </a>
          </div>
          <div className="flex flex-col items-center gap-1 text-center">
            <p className="text-muted-on-dark">© {new Date().getFullYear()} ApexAML Technologies.</p>
            <CompanyFooterLine className="text-muted-on-dark" />
          </div>
        </div>
      </footer>
      
    </div>
  );
}
