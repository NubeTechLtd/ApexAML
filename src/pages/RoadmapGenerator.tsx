import { useEffect, useMemo, useRef, useState } from 'react';
import { buildWhatsAppUrl } from '@/lib/whatsapp';
import { AnimatePresence, motion } from 'framer-motion';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { ThemeToggle } from '@/components/ThemeToggle';
import { NotificationBell } from '@/components/NotificationBell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCountdown } from '@/hooks/useCountdown';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { FileText, Loader2, Sparkles, ArrowRight, Download, CheckCircle2, Check, AlertTriangle, ArrowLeft, CalendarClock, Mail, Info, Clock, Zap, Wallet, Plug, Gift } from 'lucide-react';
import { WhatsAppIcon } from '@/components/landing/WhatsAppIcon';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import { trackEvent } from '@/lib/analytics';
import { PrintableRoadmap } from '@/components/PrintableRoadmap';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Seo } from '@/components/Seo';

type Step = 'hook' | 'form' | 'loading' | 'roadmap';

const CBN_DEADLINE = '2026-06-10T00:00:00Z';

function CountdownChip() {
  const { days, hours } = useCountdown(CBN_DEADLINE);
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-destructive/30 bg-destructive/10 px-2.5 py-1 text-[11px] font-medium text-destructive">
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-destructive" />
      </span>
      <span className="tabular-nums">
        {days}d {hours}h to CBN deadline
      </span>
    </div>
  );
}

const fade = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.25 },
};

const INSTITUTION_TYPES = [
  'Deposit Money Bank (DMB)',
  'Fintech',
  'Neobank',
  'Payment Service Provider (PSP)',
  'Mobile Money Operator (MMO)',
  'Microfinance Bank (MFB)',
  'International Money Transfer Operator (IMTO)',
  'Bureau de Change (BDC)',
  'Non-Bank Financial Institution (NBFI)',
];

const AML_SETUP_OPTIONS = [
  'No formal system',
  'Manual spreadsheets or checklists',
  'Legacy software (non-CBN compliant)',
  'Partial automation',
  'Advanced — needs CBN circular alignment',
];

const VOLUME_OPTIONS = ['Under 10,000', '10,000–100,000', '100,000–1,000,000', 'Over 1,000,000'];

function getDeadlineForType(type: string): { label: string; tone: 'amber' | 'green' } | null {
  if (!type) return null;
  if (type === 'Deposit Money Bank (DMB)') {
    return { label: 'Your full compliance deadline: September 2027', tone: 'amber' };
  }
  return { label: 'Your full compliance deadline: March 2028', tone: 'green' };
}

function getDeadlinePlain(type: string): string {
  if (type === 'Deposit Money Bank (DMB)') return 'September 2027';
  return 'March 2028';
}

const CAPABILITY_AREAS = [
  'KYC/CDD',
  'Sanctions screening',
  'Transaction monitoring',
  'Case management',
  'STR reporting',
  'CTR reporting',
  'Audit trail',
  'AI/ML governance',
  'Fraud monitoring',
  'Entity profiling',
];

const RoadmapGenerator = () => {
  const { toast } = useToast();
  const [step, setStep] = useState<Step>('hook');

  useEffect(() => {
    if (step === 'hook') trackEvent('hook_viewed', { source: 'roadmap_generator' });
  }, [step]);

  // Form state
  const [institutionName, setInstitutionName] = useState('');
  const [institutionType, setInstitutionType] = useState('');
  const [amlSetup, setAmlSetup] = useState('');
  const [volume, setVolume] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactTitle, setContactTitle] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [showError, setShowError] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Loading + result state
  const [loadingStatusIdx, setLoadingStatusIdx] = useState(0);
  const [revealedChips, setRevealedChips] = useState(0);
  const [generatedRoadmap, setGeneratedRoadmap] = useState('');
  const statusIntervalRef = useRef<number | null>(null);
  const chipIntervalRef = useRef<number | null>(null);

  // Demo booking sheet state
  const [demoOpen, setDemoOpen] = useState(false);
  const [demoDate, setDemoDate] = useState('');
  const [demoMessage, setDemoMessage] = useState('');
  const [demoSubmitting, setDemoSubmitting] = useState(false);

  const loadingStatuses = [
    `Analysing ${institutionName || 'your institution'}'s regulatory profile...`,
    `Mapping ${institutionType || 'your licence'} obligations to CBN Circular BSD/DIR/PUB/LAB/019/002...`,
    'Calculating milestone schedule for your compliance deadline...',
    'Generating institution-specific implementation roadmap...',
    'Formatting for CBN submission standards...',
    `Preparing email dispatch to ${email || 'your inbox'}...`,
  ];

  // Cycle status messages + reveal capability chips while step === 'loading'
  useEffect(() => {
    if (step !== 'loading') return;
    setLoadingStatusIdx(0);
    setRevealedChips(0);

    statusIntervalRef.current = window.setInterval(() => {
      setLoadingStatusIdx((i) => (i + 1) % loadingStatuses.length);
    }, 2000);

    chipIntervalRef.current = window.setInterval(() => {
      setRevealedChips((n) => (n < CAPABILITY_AREAS.length ? n + 1 : n));
    }, 400);

    return () => {
      if (statusIntervalRef.current) window.clearInterval(statusIntervalRef.current);
      if (chipIntervalRef.current) window.clearInterval(chipIntervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  function buildFallbackRoadmap(): string {
    const isImto = /IMTO/i.test(institutionType);
    const deadline = getDeadlinePlain(institutionType);
    const imtoBlock = isImto
      ? `\n- $200 USD cash-limit structuring detection across all IMTO agents (rolling 24h beneficiary window).\n- Inbound-only validation on Nigerian IMTO settlement accounts; block outbound.\n- 24-hour cross-border STR webhook for overseas-flag intake.\n- Phantom payroll detection on corporate sender accounts.\n- May 2026 settlement account segregation (designated accounts + approved correspondents).`
      : '';
    return `CBN AML IMPLEMENTATION ROADMAP
Prepared for: ${institutionName}
Institution type: ${institutionType}
Compliance Officer: ${contactName}, ${contactTitle}
Initial CBN submission deadline: 10 June 2026
Full compliance deadline: ${deadline}

EXECUTIVE SUMMARY
${institutionName} will implement a comprehensive AML/CFT control framework aligned to CBN Circular BSD/DIR/PUB/LAB/019/002 and the NFIU goAML reporting standard. Programme spans 24 months from initial submission and is sized for a monthly transaction volume of ${volume}. Current state: ${amlSetup}.

REGULATORY CONTEXT
The May 2026 CBN AML Circular requires every regulated institution to file an implementation roadmap by 10 June 2026 and to reach full compliance by ${deadline}. Failure to file is a regulatory infraction. ${institutionName} is regulated as a ${institutionType}.

PHASE 1 — FOUNDATION (Months 1-3)
- Board-approved AML/CFT policy refresh; appointment letter for ${contactName}.
- Enterprise-wide ML/TF risk assessment.
- Tiered KYC matrix with BVN/NIN linkage.
- Sanctions screening live for UN/OFAC/EU/NFIU-domestic lists.
- Initial gap-analysis report submitted to CBN Compliance Department.

PHASE 2 — CORE IMPLEMENTATION (Months 4-9)
- Transaction monitoring engine cut over with Nigerian typology rule library.
- Case management workflow with 4-eyes review and immutable audit trail.
- STR drafting and NFIU goAML XML export pipeline operational.
- CTR aggregation and daily reporting automation.
- First independent internal-audit cycle.${imtoBlock}

PHASE 3 — ADVANCED COMPLIANCE (Months 10-18)
- AI/ML governance charter; model-risk register and explainability evidence.
- Customer 360 entity-network profiling with PEP and adverse-media surveillance.
- Fraud-monitoring integration with AML case routing.
- Enhanced Due Diligence workspace operational for high-risk segments.
- Tabletop examiner walkthrough with mock CBN/NFIU inspection.

PHASE 4 — FULL COMPLIANCE CERTIFICATION (Months 18-24)
- External audit attestation against CBN Circular BSD/DIR/PUB/LAB/019/002.
- Full coverage demonstrated across all 10 CBN capability areas.
- 5-year record-retention archive validated and examiner-ready.
- Board sign-off and submission of full compliance certification to CBN before ${deadline}.

KEY RISKS AND MITIGATIONS
- Data quality on legacy customer records — mitigated by a Phase 1 BVN/NIN remediation sprint.
- Rule-tuning false-positive load — mitigated by sandbox back-testing before promotion.
- Staff capacity — mitigated by quarterly AML training and dedicated FIU liaison.
- Vendor lock-in — mitigated by storing all rules and evidence in portable formats.

ATTESTATION
This roadmap has been prepared for ${institutionName} and is to be filed with the CBN Compliance Department in accordance with Circular BSD/DIR/PUB/LAB/019/002.

Compliance Officer: ${contactName} (${contactTitle})    Signature: ____________________    Date: __________

Chief Risk Officer:                                   Signature: ____________________    Date: __________

Managing Director:                                    Signature: ____________________    Date: __________
`;
  }

  const handleStart = () => {
    trackEvent('form_started', { source: 'roadmap_generator' });
    setStep('form');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const requiredOk =
      institutionName.trim() &&
      institutionType &&
      amlSetup &&
      volume &&
      contactName.trim() &&
      contactTitle.trim() &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
    if (!requiredOk) {
      setShowError(true);
      return;
    }
    setShowError(false);
    setSubmitting(true);
    const { data: leadRow, error } = await supabase
      .from('roadmap_leads')
      .insert({
        institution_name: institutionName.trim(),
        institution_type: institutionType,
        aml_setup: amlSetup,
        volume,
        contact_name: contactName.trim(),
        title: contactTitle.trim(),
        email: email.trim(),
        phone: phone.trim() || null,
        source: 'roadmap_generator',
      })
      .select('id')
      .single();
    setSubmitting(false);
    const leadId = leadRow?.id ?? null;
    if (error) {
      toast({
        title: 'Submission failed',
        description: 'Please try again in a moment.',
        variant: 'destructive',
      });
      return;
    }
    trackEvent('form_completed', { source: 'roadmap_generator', metadata: { institution_type: institutionType } });
    setStep('loading');

    // Kick off generation. Always end with a roadmap — never an error.
    const startedAt = Date.now();
    const deadline = getDeadlinePlain(institutionType);
    let roadmapText = '';
    try {
      const { data, error: fnError } = await supabase.functions.invoke('generate-roadmap', {
        body: {
          institutionName: institutionName.trim(),
          institutionType,
          amlSetup,
          volume,
          contactName: contactName.trim(),
          title: contactTitle.trim(),
          email: email.trim(),
          phone: phone.trim() || null,
          deadline,
          leadId,
        },
      });
      if (fnError) throw fnError;
      roadmapText = (data && (data as { roadmap?: string }).roadmap) || '';
    } catch (err) {
      console.warn('Roadmap generation failed, using fallback', err);
    }
    if (!roadmapText || roadmapText.trim().length < 200) {
      roadmapText = buildFallbackRoadmap();
    }

    // Enqueue the 5-email Resend drip sequence FIRST. This creates the email_sequences
    // row that send-roadmap-email validates against. Email 1 (the roadmap email) is
    // dispatched immediately below; emails 2-5 are sent on day 3/7/14/21 by the
    // pg_cron tick unless the lead books a demo or unsubscribes.
    try {
      await supabase.functions.invoke('email-sequence-dispatch', {
        body: {
          action: 'enqueue',
          leadId,
          contactName: contactName.trim(),
          institutionName: institutionName.trim(),
          institutionType,
          email: email.trim(),
          refNumber: referenceNumber,
          deadline,
        },
      });
    } catch (err) {
      console.warn('Email drip enqueue failed', err);
    }

    // Fire-and-forget: email the roadmap. Failures are silent — in-app display is primary.
    supabase.functions
      .invoke('send-roadmap-email', {
        body: {
          leadId,
          to: email.trim(),
          name: contactName.trim(),
          institution: institutionName.trim(),
          type: institutionType,
          roadmapText,
          refNumber: referenceNumber,
          contactTitle: contactTitle.trim(),
          phoneNumber: phone.trim() || undefined,
          amlSetup,
        },
      })
      .catch((err) => console.warn('Roadmap email dispatch failed', err));

    // Fire-and-forget: enqueue the WhatsApp follow-up sequence (M1 sent immediately;
    // M2 at 48h and M3 at 7d are dispatched by the pg_cron tick). Only if a phone was given.
    if (phone.trim()) {
      supabase.functions
        .invoke('whatsapp-followup', {
          body: {
            action: 'enqueue',
            leadId,
            contactName: contactName.trim(),
            institutionName: institutionName.trim(),
            institutionType,
            phone: phone.trim(),
            email: email.trim(),
            refNumber: referenceNumber,
            deadline,
          },
        })
        .catch((err) => console.warn('WhatsApp follow-up enqueue failed', err));
    }
    // Ensure the loading UX runs at least ~5s so the cycling messages are visible.
    const elapsed = Date.now() - startedAt;
    const minMs = 5000;
    if (elapsed < minMs) {
      await new Promise((r) => setTimeout(r, minMs - elapsed));
    }

    if (statusIntervalRef.current) window.clearInterval(statusIntervalRef.current);
    if (chipIntervalRef.current) window.clearInterval(chipIntervalRef.current);
    setGeneratedRoadmap(roadmapText);
    setStep('roadmap');
    trackEvent('roadmap_generated', {
      source: 'roadmap_generator',
      metadata: { institution_type: institutionType, ref_number: referenceNumber },
    });
  };

  const deadlinePreview = getDeadlineForType(institutionType);

  // Stable reference number + today's formatted date for the roadmap header card.
  const referenceNumber = useMemo(
    () => `ZUA-2026-${Math.floor(1000 + Math.random() * 9000)}`,
    [],
  );
  const todayFormatted = useMemo(
    () =>
      new Date().toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }),
    [],
  );
  const fullDeadline = institutionType ? getDeadlinePlain(institutionType) : 'March 2028';
  const isImto = /IMTO/i.test(institutionType);
  const fullDeadlineTone: 'amber' | 'green' =
    institutionType === 'Deposit Money Bank (DMB)' ? 'amber' : 'green';

  const printableRef = useRef<HTMLDivElement>(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const handleDownloadRoadmap = async () => {
    if (downloadingPdf) return;
    trackEvent('roadmap_downloaded', { source: 'roadmap_generator' });
    const safeName = (institutionName || 'Institution').replace(/[^a-zA-Z0-9_-]+/g, '_');
    const node = printableRef.current;
    if (!node) {
      toast({ title: 'Could not generate PDF', description: 'Please try again.', variant: 'destructive' });
      return;
    }

    setDownloadingPdf(true);
    const loadingToast = toast({
      title: 'Generating PDF…',
      description: 'Rendering your CBN roadmap. This takes a few seconds.',
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

      // Paginate by translating the same image upward each page.
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

      pdf.save(`CBN_AML_Roadmap_${safeName}.pdf`);
      loadingToast.dismiss();
      toast({ title: 'PDF downloaded', description: 'Your CBN roadmap is ready.' });
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

  const handleShareWhatsApp = () => {
    const message = `I just generated my CBN AML implementation roadmap for ${institutionName} using ApexAML (apexaml.com) — pre-formatted for CBN Circular BSD/DIR/PUB/LAB/019/002. Submission deadline is 10 June 2026. You can generate yours free at apexaml.com/roadmap.`;
    window.open(buildWhatsAppUrl(message), '_blank', 'noopener,noreferrer');
  };

  const handleOpenDemo = () => {
    trackEvent('demo_cta_clicked', { source: 'roadmap_generator' });
    if (!demoMessage) {
      setDemoMessage(
        `I have generated my CBN roadmap ${referenceNumber} and want to implement it with ApexAML.`,
      );
    }
    setDemoOpen(true);
  };

  const handleSubmitDemo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (demoSubmitting) return;
    setDemoSubmitting(true);
    const { error } = await supabase.from('demo_requests').insert({
      contact_name: contactName.trim() || 'Compliance Officer',
      institution_name: institutionName.trim() || 'Unknown institution',
      email: email.trim() || null,
      preferred_date: demoDate || null,
      message: demoMessage,
      source: 'post_roadmap',
    });
    setDemoSubmitting(false);
    if (error) {
      toast({
        title: 'Could not book demo',
        description: 'Please try WhatsApp instead — link below.',
        variant: 'destructive',
      });
      return;
    }
    // Stop the WhatsApp follow-up sequence — the lead has converted.
    if (phone.trim() || referenceNumber) {
      supabase.functions
        .invoke('whatsapp-followup', {
          body: {
            action: 'mark_demo_booked',
            phone: phone.trim() || null,
            refNumber: referenceNumber,
          },
        })
        .catch((err) => console.warn('WhatsApp mark_demo_booked failed', err));
    }
    // Stop the email drip sequence too — the lead has converted.
    supabase.functions
      .invoke('email-sequence-dispatch', {
        body: {
          action: 'mark_demo_booked',
          email: email.trim() || null,
          refNumber: referenceNumber,
        },
      })
      .catch((err) => console.warn('Email drip mark_demo_booked failed', err));
    toast({
      title: 'Demo booked',
      description: 'We will be in touch within 24 hours to confirm.',
    });
    setDemoOpen(false);
  };

  const handleImplementationWhatsApp = () => {
    const message = `Hi ApexAML — I just generated my CBN AML roadmap (Ref ${referenceNumber}) for ${institutionName}. I'd like implementation support. Can we talk?`;
    window.open(buildWhatsAppUrl(message), '_blank', 'noopener,noreferrer');
  };

  // Render roadmap body, bolding section headers as visual dividers.
  const SECTION_HEADER_RE =
    /^(EXECUTIVE SUMMARY|REGULATORY CONTEXT|PHASE \d+[^\n]*|KEY RISKS AND MITIGATIONS|ATTESTATION|SECTION \d+[^\n]*|INSTITUTION PROFILE|GAP ASSESSMENT|TEN CBN CAPABILITY AREAS[^\n]*|REMEDIATION TIMELINE|SIGN-OFF)\s*$/;

  const renderRoadmapBody = (text: string) =>
    text.split('\n').map((line, idx) => {
      if (SECTION_HEADER_RE.test(line.trim())) {
        return (
          <div
            key={idx}
            className="mt-4 mb-1 text-[13px] font-bold text-foreground border-t border-border pt-3 first:border-t-0 first:pt-0 first:mt-0"
          >
            {line.trim()}
          </div>
        );
      }
      return (
        <div key={idx} className="whitespace-pre">
          {line || '\u00A0'}
        </div>
      );
    });


  return (
    <SidebarProvider>
      <Seo
        title="Free CBN AML Roadmap Generator | ApexAML"
        description="Generate a CBN-compliant AML implementation roadmap for your Nigerian fintech, MFB or IMTO in 60 seconds. Pre-formatted for Circular BSD/DIR/PUB/LAB/019/002 and the 10 June 2026 deadline."
        path="/roadmap"
      />
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-14 flex items-center justify-between border-b px-4 bg-card">
            <div className="flex items-center gap-3">
              <SidebarTrigger />
              <h1 className="text-sm font-semibold text-foreground">CBN Roadmap Generator</h1>
              <CountdownChip />
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <NotificationBell />
            </div>
          </header>

          <div className="px-6 pt-4">
            <Breadcrumb>
              <BreadcrumbList className="text-[12px] text-muted-foreground">
                <BreadcrumbItem>
                  <BreadcrumbLink>Tools</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage className="text-muted-foreground">CBN Roadmap Generator</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          <main className="flex-1 px-6 py-8">
            <div className="mx-auto max-w-[640px]">
              <AnimatePresence mode="wait">
                {step === 'hook' && (
                  <motion.section key="hook" {...fade} className="space-y-8">
                    {/* Urgency Banner */}
                    <div className="flex items-start gap-3 rounded-lg border border-destructive/30 border-l-4 border-l-destructive bg-destructive/5 p-4">
                      <span className="relative mt-1 flex h-2 w-2 shrink-0">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive opacity-75" />
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-destructive" />
                      </span>
                      <p className="text-[13px] leading-relaxed text-foreground/90">
                        <span className="font-medium text-destructive">CBN Circular BSD/DIR/PUB/LAB/019/002</span> requires
                        every regulated institution to submit an AML implementation roadmap by{' '}
                        <span className="font-medium">10 June 2026</span>. Failure to submit is a regulatory infraction.
                      </p>
                    </div>

                    {/* Headline */}
                    <div className="space-y-3">
                      <h2 className="text-2xl font-medium tracking-tight leading-tight">
                        Your CBN-ready AML roadmap, generated in 60 seconds.
                      </h2>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        We generate your institution-specific roadmap automatically — formatted to CBN's exact
                        requirements, pre-mapped to all 10 mandated capability areas, and ready to submit.
                      </p>
                    </div>

                    {/* Benefit list */}
                    <ul className="space-y-3">
                      {[
                        { variant: 'tick' as const, text: 'Pre-mapped to all 10 CBN capability areas in Circular BSD/DIR/PUB/LAB/019/002' },
                        { variant: 'tick' as const, text: 'Deadline-aware: correct milestones for DMBs, Fintechs, PSPs, MFBs, and IMTOs' },
                        { variant: 'tick' as const, text: 'Includes IMTO-specific rules: $200 cash-limit, 24-hour cross-border STR, settlement segregation' },
                        { variant: 'arrow' as const, text: 'Emailed to you instantly — forward directly to CBN Compliance Department' },
                        { variant: 'warn' as const, text: 'Over 60% of regulated institutions have not yet submitted their roadmap' },
                      ].map((item, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          <span
                            className={
                              'flex h-5 w-5 shrink-0 items-center justify-center rounded-full ' +
                              (item.variant === 'tick'
                                ? 'bg-risk-low/15 text-risk-low'
                                : item.variant === 'arrow'
                                  ? 'bg-primary/15 text-primary'
                                  : 'bg-destructive/15 text-destructive')
                            }
                          >
                            {item.variant === 'tick' && <Check className="h-3 w-3" strokeWidth={3} />}
                            {item.variant === 'arrow' && <ArrowRight className="h-3 w-3" strokeWidth={3} />}
                            {item.variant === 'warn' && <AlertTriangle className="h-3 w-3" strokeWidth={2.5} />}
                          </span>
                          <span className="text-sm text-foreground/90 leading-relaxed">{item.text}</span>
                        </li>
                      ))}
                    </ul>

                    {/* Primary CTA */}
                    <Button size="lg" onClick={handleStart} className="w-full group h-12 text-sm font-semibold">
                      Generate my CBN roadmap — free
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                    </Button>

                    {/* Social proof */}
                    <div className="rounded-xl border bg-card p-5 space-y-3">
                      <p className="text-sm italic text-foreground/85 leading-relaxed">
                        "We submitted our CBN roadmap within 2 hours of generating it with ApexAML. The format was
                        exactly what the examiner expected."
                      </p>
                      <p className="text-xs text-muted-foreground">
                        — Head of Compliance, Licensed PSP, Lagos · Beta Programme 2026
                      </p>
                    </div>

                    {/* Trust badges */}
                    <div className="flex flex-wrap gap-2">
                      {[
                        'CBN circular aligned',
                        'NFIU goAML format',
                        'NDPR compliant',
                        'AWS Nigeria hosted',
                        'Free — no account required',
                      ].map((badge) => (
                        <span
                          key={badge}
                          className="inline-flex items-center rounded-full border border-border bg-muted/40 px-2.5 py-1 text-[11px] font-medium text-muted-foreground"
                        >
                          {badge}
                        </span>
                      ))}
                    </div>
                  </motion.section>
                )}

                {step === 'form' && (
                  <motion.section key="form" {...fade} className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setShowError(false);
                          setStep('hook');
                        }}
                        className="-ml-2 text-muted-foreground hover:text-foreground"
                      >
                        <ArrowLeft className="h-4 w-4" />
                        Back
                      </Button>
                      {/* Progress dots — step 2 of 3 active */}
                      <div className="flex items-center gap-1.5" aria-label="Step 2 of 3">
                        {[0, 1, 2].map((i) => (
                          <span
                            key={i}
                            className={
                              'h-1.5 rounded-full transition-all ' +
                              (i <= 1 ? 'w-6 bg-primary' : 'w-3 bg-muted')
                            }
                          />
                        ))}
                      </div>
                    </div>

                    <Card className="p-6 space-y-5">
                      <div className="space-y-1">
                        <h2 className="text-xl font-semibold tracking-tight">
                          Tell us about your institution
                        </h2>
                        <p className="text-xs text-muted-foreground">
                          Step 2 of 3 — takes about 60 seconds.
                        </p>
                      </div>

                      <form onSubmit={handleSubmit} className="space-y-4">
                        {/* 1. Institution Name */}
                        <div className="space-y-1.5">
                          <Label htmlFor="institutionName">
                            Institution Name <span className="text-destructive">*</span>
                          </Label>
                          <Input
                            id="institutionName"
                            value={institutionName}
                            onChange={(e) => setInstitutionName(e.target.value)}
                            placeholder="e.g. Fidelity Pay Limited"
                            maxLength={150}
                          />
                        </div>

                        {/* 2. Institution Type */}
                        <div className="space-y-1.5">
                          <Label htmlFor="institutionType">
                            Institution Type <span className="text-destructive">*</span>
                          </Label>
                          <Select value={institutionType} onValueChange={setInstitutionType}>
                            <SelectTrigger id="institutionType">
                              <SelectValue placeholder="Select your institution type" />
                            </SelectTrigger>
                            <SelectContent>
                              {INSTITUTION_TYPES.map((opt) => (
                                <SelectItem key={opt} value={opt}>
                                  {opt}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {deadlinePreview && (
                            <div
                              className={
                                'mt-2 inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-medium border ' +
                                (deadlinePreview.tone === 'amber'
                                  ? 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400'
                                  : 'border-risk-low/30 bg-risk-low/10 text-risk-low')
                              }
                            >
                              <CalendarClock className="h-3 w-3" />
                              {deadlinePreview.label}
                            </div>
                          )}
                        </div>

                        {/* 3. Current AML setup */}
                        <div className="space-y-1.5">
                          <Label htmlFor="amlSetup">
                            Current AML setup <span className="text-destructive">*</span>
                          </Label>
                          <Select value={amlSetup} onValueChange={setAmlSetup}>
                            <SelectTrigger id="amlSetup">
                              <SelectValue placeholder="Select your current AML setup" />
                            </SelectTrigger>
                            <SelectContent>
                              {AML_SETUP_OPTIONS.map((opt) => (
                                <SelectItem key={opt} value={opt}>
                                  {opt}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* 4. Monthly transaction volume */}
                        <div className="space-y-1.5">
                          <Label htmlFor="volume">
                            Monthly transaction volume <span className="text-destructive">*</span>
                          </Label>
                          <Select value={volume} onValueChange={setVolume}>
                            <SelectTrigger id="volume">
                              <SelectValue placeholder="Select monthly volume" />
                            </SelectTrigger>
                            <SelectContent>
                              {VOLUME_OPTIONS.map((opt) => (
                                <SelectItem key={opt} value={opt}>
                                  {opt}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* 5 + 6. Full name & Title */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <Label htmlFor="contactName">
                              Full name <span className="text-destructive">*</span>
                            </Label>
                            <Input
                              id="contactName"
                              value={contactName}
                              onChange={(e) => setContactName(e.target.value)}
                              placeholder="Ngozi Adeyemi"
                              maxLength={100}
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label htmlFor="contactTitle">
                              Your title <span className="text-destructive">*</span>
                            </Label>
                            <Input
                              id="contactTitle"
                              value={contactTitle}
                              onChange={(e) => setContactTitle(e.target.value)}
                              placeholder="Chief Compliance Officer"
                              maxLength={100}
                            />
                          </div>
                        </div>

                        {/* 7. Email */}
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Label htmlFor="email">
                              Email address <span className="text-destructive">*</span>
                            </Label>
                            <span className="inline-flex items-center rounded-full bg-primary/10 border border-primary/25 px-2 py-0.5 text-[10px] font-medium text-primary">
                              roadmap sent here
                            </span>
                          </div>
                          <Input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="ngozi@institution.com.ng"
                            maxLength={255}
                          />
                        </div>

                        {/* 8. WhatsApp */}
                        <div className="space-y-1.5">
                          <Label htmlFor="phone">
                            WhatsApp{' '}
                            <span className="text-muted-foreground font-normal">
                              (optional — for faster follow-up)
                            </span>
                          </Label>
                          <Input
                            id="phone"
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="+234 80X XXXX XXX"
                            maxLength={32}
                          />
                        </div>

                        {showError && (
                          <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-3">
                            <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                            <p className="text-[13px] text-destructive leading-relaxed">
                              Please complete all required fields — your roadmap cannot be generated
                              without this information.
                            </p>
                          </div>
                        )}

                        <Button
                          type="submit"
                          disabled={submitting}
                          className="w-full h-11 font-semibold group"
                        >
                          {submitting ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              Generate my CBN roadmap
                              <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                            </>
                          )}
                        </Button>
                      </form>
                    </Card>
                  </motion.section>
                )}

                {step === 'loading' && (
                  <motion.section
                    key="loading"
                    {...fade}
                    className="py-12"
                    aria-live="polite"
                    aria-busy="true"
                  >
                    <Card className="p-10 flex flex-col items-center text-center space-y-6">
                      <Loader2 className="h-8 w-8 text-primary animate-spin" />
                      <div className="min-h-[60px] flex items-center justify-center w-full">
                        <AnimatePresence mode="wait">
                          <motion.p
                            key={loadingStatusIdx}
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            transition={{ duration: 0.3 }}
                            className="text-base md:text-lg font-medium tracking-tight text-foreground max-w-md"
                          >
                            {loadingStatuses[loadingStatusIdx]}
                          </motion.p>
                        </AnimatePresence>
                      </div>
                      <div className="flex flex-wrap justify-center gap-2 max-w-lg">
                        {CAPABILITY_AREAS.map((area, i) => (
                          <motion.span
                            key={area}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={
                              i < revealedChips
                                ? { opacity: 1, scale: 1 }
                                : { opacity: 0, scale: 0.9 }
                            }
                            transition={{ duration: 0.3 }}
                            className="inline-flex items-center gap-1 rounded-full border border-primary/25 bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary"
                          >
                            <Check className="h-3 w-3" strokeWidth={3} />
                            {area}
                          </motion.span>
                        ))}
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        Mapping all 10 CBN capability areas — this usually takes 5–15 seconds.
                      </p>
                    </Card>
                  </motion.section>
                )}

                {step === 'roadmap' && (
                  <motion.section key="roadmap" {...fade} className="space-y-5">
                    {/* Email confirmation banner */}
                    <div className="flex items-start gap-3 rounded-lg border border-risk-low/30 bg-risk-low/10 p-4">
                      <CheckCircle2 className="h-5 w-5 text-risk-low shrink-0 mt-0.5" />
                      <div className="space-y-0.5">
                        <p className="text-[13px] font-medium text-foreground">
                          Roadmap generated — a copy has been sent to{' '}
                          <span className="font-semibold">{email}</span>.
                        </p>
                        <p className="text-[12px] text-muted-foreground leading-relaxed">
                          Forward it directly to CBN Compliance Department or share with your MD/CEO for
                          sign-off.
                        </p>
                      </div>
                    </div>

                    {/* Roadmap header card */}
                    <Card className="p-5 space-y-4">
                      <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div>
                          <div className="text-[20px] font-medium leading-none tracking-tight text-foreground">
                            ApexAML
                          </div>
                          <div className="text-[11px] text-muted-foreground mt-1">
                            CBN AML Compliance Platform
                          </div>
                        </div>
                        <div className="text-right space-y-0.5">
                          <div className="text-[12px] font-mono font-medium text-foreground">
                            {referenceNumber}
                          </div>
                          <div className="text-[11px] text-muted-foreground font-mono">
                            CBN Ref: BSD/DIR/PUB/LAB/019/002
                          </div>
                          <div className="text-[11px] text-muted-foreground">{todayFormatted}</div>
                        </div>
                      </div>

                      <div className="space-y-1 pt-1 border-t border-border">
                        <div className="text-[16px] font-medium text-foreground pt-3">
                          {institutionName || 'Your institution'}
                        </div>
                        <div className="text-[13px] text-muted-foreground">
                          {institutionType || 'Institution type'} · {contactName || 'Contact'},{' '}
                          {contactTitle || 'Title'}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <span className="inline-flex items-center gap-1.5 rounded-md border border-destructive/30 bg-destructive/10 px-2.5 py-1 text-[11px] font-medium text-destructive">
                          <CalendarClock className="h-3 w-3" />
                          Roadmap deadline: 10 June 2026
                        </span>
                        <span
                          className={
                            'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-medium border ' +
                            (fullDeadlineTone === 'amber'
                              ? 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400'
                              : 'border-risk-low/30 bg-risk-low/10 text-risk-low')
                          }
                        >
                          <CalendarClock className="h-3 w-3" />
                          Full compliance deadline: {fullDeadline}
                        </span>
                      </div>
                    </Card>

                    {/* Roadmap body */}
                    <div
                      className="rounded-md border bg-muted/40 p-4 overflow-y-auto font-mono text-[12px] leading-[1.8] text-foreground/90"
                      style={{ maxHeight: 500 }}
                    >
                      {renderRoadmapBody(generatedRoadmap)}
                    </div>

                    {/* IMTO pack callout */}
                    {isImto && (
                      <div className="flex items-start gap-3 rounded-lg border border-primary/30 bg-primary/10 p-4">
                        <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                        <div className="space-y-1">
                          <p className="text-[13px] font-semibold text-foreground">
                            IMTO Regulatory Pack included
                          </p>
                          <p className="text-[12px] text-foreground/80 leading-relaxed">
                            This roadmap covers the $200 cash-limit structuring rule, inbound-only and
                            naira-only validation, 24-hour cross-border STR auto-countdown, phantom payroll
                            network detection, and May 2026 settlement account segregation monitoring. These
                            are pre-configured in ApexAML's IMTO module.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Action row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Button onClick={handleDownloadRoadmap} disabled={downloadingPdf} className="h-11 font-semibold">
                        {downloadingPdf ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Generating PDF…
                          </>
                        ) : (
                          <>
                            <Download className="h-4 w-4" />
                            Download roadmap
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleShareWhatsApp}
                        className="h-11 font-semibold"
                      >
                        <WhatsAppIcon size={16} />
                        Share via WhatsApp
                      </Button>
                    </div>

                    {/* CONVERSION SECTION — implement with ApexAML */}
                    <section className="mt-10 pt-8 border-t border-border space-y-6">
                      <div className="space-y-2">
                        <h3 className="text-[16px] font-medium tracking-tight text-foreground">
                          Your next step: implement this roadmap with ApexAML
                        </h3>
                        <p className="text-[13px] text-muted-foreground leading-relaxed">
                          Your roadmap is the plan. ApexAML is the platform that executes it — covering all 10
                          CBN capability areas with AI-powered STR drafting, real-time transaction
                          monitoring, and a pre-built NFIU goAML export. Institutions using ApexAML meet their
                          CBN roadmap milestones in weeks, not months.
                        </p>
                      </div>

                      {/* Metric grid 2x2 */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {[
                          {
                            icon: Clock,
                            label: 'Time to first CBN milestone',
                            value: '48 hours after API connection',
                          },
                          {
                            icon: Zap,
                            label: 'STR filing time',
                            value: '11 minutes average vs 3 hours manual',
                          },
                          {
                            icon: Wallet,
                            label: 'Starting from',
                            value: '₦800,000/month — less than one compliance analyst salary',
                          },
                          {
                            icon: Plug,
                            label: 'Setup time',
                            value: '48-hour integration — no IT project required',
                          },
                        ].map(({ icon: Icon, label, value }) => (
                          <Card key={label} className="p-4 space-y-2">
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Icon className="h-3.5 w-3.5" />
                              <span className="text-[11px] font-medium uppercase tracking-wider">
                                {label}
                              </span>
                            </div>
                            <div className="text-[14px] font-medium text-foreground leading-snug">
                              {value}
                            </div>
                          </Card>
                        ))}
                      </div>

                      {/* Offer callout */}
                      <div className="flex items-start gap-3 rounded-lg border border-risk-low/30 bg-risk-low/10 p-4">
                        <Gift className="h-5 w-5 text-risk-low shrink-0 mt-0.5" />
                        <div className="space-y-1">
                          <p className="text-[13px] font-semibold text-foreground">
                            First month free — for institutions submitting their CBN roadmap before 10 June
                            2026.
                          </p>
                          <p className="text-[12px] text-foreground/80 leading-relaxed">
                            Book your demo this week and we will waive the first month's subscription fee.
                          </p>
                        </div>
                      </div>

                      {/* Conversion CTAs */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <Button onClick={handleOpenDemo} className="h-11 font-semibold group">
                          Book a 20-minute demo
                          <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                        </Button>
                        <Button
                          variant="outline"
                          onClick={handleImplementationWhatsApp}
                          className="h-11 font-semibold group"
                        >
                          <WhatsAppIcon size={16} />
                          Chat on WhatsApp
                          <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                        </Button>
                      </div>
                    </section>

                    <div className="flex justify-center pt-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setStep('hook')}
                        className="text-muted-foreground"
                      >
                        Generate another roadmap
                      </Button>
                    </div>

                  </motion.section>
                )}

              </AnimatePresence>
            </div>
          </main>
        </div>

        {/* Floating WhatsApp button — only visible on the roadmap step */}
        {step === 'roadmap' && (
          <button
            type="button"
            onClick={handleImplementationWhatsApp}
            aria-label="Get implementation support on WhatsApp"
            className="group fixed bottom-5 right-5 z-50 flex items-center"
          >
            <span className="hidden md:inline-flex items-center mr-3 px-3 py-2 rounded-lg bg-card border border-border text-foreground text-xs font-medium opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 shadow-xl pointer-events-none whitespace-nowrap">
              Get implementation support →
            </span>
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_8px_30px_-4px_rgba(37,211,102,0.5)] hover:scale-105 active:scale-95 transition-transform">
              <WhatsAppIcon size={28} />
            </span>
          </button>
        )}

        {/* Demo booking sheet */}
        <Sheet open={demoOpen} onOpenChange={setDemoOpen}>
          <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
            <SheetHeader className="space-y-2 text-left">
              <SheetTitle>Book a 20-minute ApexAML demo</SheetTitle>
              <SheetDescription>
                We will walk you through how ApexAML operates the controls in your CBN roadmap.
              </SheetDescription>
            </SheetHeader>

            <form onSubmit={handleSubmitDemo} className="mt-6 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="demoName">Name</Label>
                <Input id="demoName" value={contactName} readOnly className="bg-muted/40" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="demoInstitution">Institution</Label>
                <Input
                  id="demoInstitution"
                  value={institutionName}
                  readOnly
                  className="bg-muted/40"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="demoDate">Preferred date</Label>
                <Input
                  id="demoDate"
                  type="date"
                  value={demoDate}
                  onChange={(e) => setDemoDate(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="demoMessage">Message</Label>
                <Textarea
                  id="demoMessage"
                  rows={4}
                  value={demoMessage}
                  onChange={(e) => setDemoMessage(e.target.value)}
                />
              </div>
              <Button type="submit" disabled={demoSubmitting} className="w-full h-11 font-semibold">
                {demoSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    Request demo
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
              <p className="text-[11px] text-muted-foreground text-center">
                We will reply within 24 hours to confirm a time.
              </p>
            </form>
          </SheetContent>
        </Sheet>
      </div>

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
          institutionName={institutionName || 'Your Institution'}
          institutionType={institutionType || '—'}
          contactName={contactName || '—'}
          contactTitle={contactTitle || '—'}
          email={email || '—'}
          amlSetup={amlSetup || '—'}
          volume={volume || '—'}
          referenceNumber={referenceNumber}
          todayFormatted={todayFormatted}
          fullDeadline={fullDeadline}
        />
      </div>
    </SidebarProvider>

  );
};

export default RoadmapGenerator;
