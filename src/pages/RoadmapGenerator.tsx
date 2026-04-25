import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { ThemeToggle } from '@/components/ThemeToggle';
import { NotificationBell } from '@/components/NotificationBell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCountdown } from '@/hooks/useCountdown';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { FileText, Loader2, Sparkles, ArrowRight, Download, CheckCircle2 } from 'lucide-react';

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

const RoadmapGenerator = () => {
  const [step, setStep] = useState<Step>('hook');
  const [institution, setInstitution] = useState('');
  const [licenceType, setLicenceType] = useState('');

  const handleStart = () => setStep('form');
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep('loading');
    setTimeout(() => setStep('roadmap'), 2200);
  };

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
            <div className="mx-auto max-w-3xl">
              <AnimatePresence mode="wait">
                {step === 'hook' && (
                  <motion.section key="hook" {...fade} className="text-center space-y-6 py-12">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/15 border border-primary/25 text-primary">
                      <Sparkles className="h-8 w-8" strokeWidth={1.75} />
                    </div>
                    <div className="space-y-3">
                      <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
                        Generate your CBN AML compliance roadmap in 60 seconds
                      </h2>
                      <p className="text-muted-foreground max-w-xl mx-auto">
                        Pre-formatted for Circular BSD/DIR/PUB/LAB/019/002. Tailored to your institution
                        type, with a remediation timeline aligned to the June 10, 2026 deadline.
                      </p>
                    </div>
                    <Button size="lg" onClick={handleStart} className="group">
                      Start now
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                    </Button>
                  </motion.section>
                )}

                {step === 'form' && (
                  <motion.section key="form" {...fade} className="space-y-6">
                    <div className="space-y-1">
                      <h2 className="text-2xl font-semibold tracking-tight">Tell us about your institution</h2>
                      <p className="text-sm text-muted-foreground">
                        We'll tailor the roadmap to your licence type and reporting obligations.
                      </p>
                    </div>
                    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border bg-card p-6">
                      <div className="space-y-2">
                        <Label htmlFor="institution">Institution name</Label>
                        <Input
                          id="institution"
                          required
                          value={institution}
                          onChange={(e) => setInstitution(e.target.value)}
                          placeholder="e.g. Sterling Bank Plc"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="licence">Licence type</Label>
                        <Input
                          id="licence"
                          required
                          value={licenceType}
                          onChange={(e) => setLicenceType(e.target.value)}
                          placeholder="DMB / Fintech / PSP / MFB / IMTO"
                        />
                      </div>
                      <Button type="submit" className="w-full">
                        Generate roadmap
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </form>
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
