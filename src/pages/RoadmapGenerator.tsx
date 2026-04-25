import { useState } from 'react';
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
import { FileText, Loader2, Sparkles, ArrowRight, Download, CheckCircle2, Check, AlertTriangle, ArrowLeft, CalendarClock } from 'lucide-react';

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

const RoadmapGenerator = () => {
  const { toast } = useToast();
  const [step, setStep] = useState<Step>('hook');

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

  const handleStart = () => setStep('form');

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
    const { error } = await supabase.from('roadmap_leads').insert({
      institution_name: institutionName.trim(),
      institution_type: institutionType,
      aml_setup: amlSetup,
      volume,
      contact_name: contactName.trim(),
      title: contactTitle.trim(),
      email: email.trim(),
      phone: phone.trim() || null,
      source: 'roadmap_generator',
    });
    setSubmitting(false);
    if (error) {
      toast({
        title: 'Submission failed',
        description: 'Please try again in a moment.',
        variant: 'destructive',
      });
      return;
    }
    setStep('loading');
    setTimeout(() => setStep('roadmap'), 2200);
  };

  const deadlinePreview = getDeadlineForType(institutionType);

  return (
    <SidebarProvider>
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
                        "We submitted our CBN roadmap within 2 hours of generating it with Zuia. The format was
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
                  <motion.section key="loading" {...fade} className="text-center space-y-4 py-24">
                    <Loader2 className="h-10 w-10 mx-auto text-primary animate-spin" />
                    <p className="text-sm text-muted-foreground">
                      Building your CBN-aligned roadmap…
                    </p>
                  </motion.section>
                )}

                {step === 'roadmap' && (
                  <motion.section key="roadmap" {...fade} className="space-y-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="inline-flex items-center gap-1.5 text-xs text-risk-low">
                          <CheckCircle2 className="h-4 w-4" />
                          Roadmap ready
                        </div>
                        <h2 className="text-2xl font-semibold tracking-tight">
                          {institution || 'Your institution'} — CBN AML Roadmap
                        </h2>
                        <p className="text-sm text-muted-foreground">
                          Licence type: {licenceType || 'N/A'} · Deadline: 10 June 2026
                        </p>
                      </div>
                      <Button>
                        <Download className="h-4 w-4" />
                        Download PDF
                      </Button>
                    </div>

                    <div className="rounded-xl border bg-card divide-y">
                      {[
                        { weeks: 'Weeks 1–2', task: 'Gap analysis & risk assessment' },
                        { weeks: 'Weeks 3–5', task: 'Policy & procedure refresh' },
                        { weeks: 'Weeks 6–9', task: 'Technology deployment & rule tuning' },
                        { weeks: 'Weeks 10–11', task: 'Staff training & UAT' },
                        { weeks: 'Week 12', task: 'Internal audit & CBN attestation' },
                      ].map((row) => (
                        <div key={row.weeks} className="flex items-center justify-between gap-4 p-4">
                          <div className="flex items-center gap-3">
                            <FileText className="h-4 w-4 text-primary" />
                            <span className="text-sm font-medium">{row.task}</span>
                          </div>
                          <span className="text-xs text-muted-foreground tabular-nums">{row.weeks}</span>
                        </div>
                      ))}
                    </div>

                    <Button variant="outline" onClick={() => setStep('hook')}>
                      Generate another
                    </Button>
                  </motion.section>
                )}
              </AnimatePresence>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default RoadmapGenerator;
