import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookDemoSheet } from '@/components/landing/BookDemoSheet';
import { ChevronLeft, ChevronRight, Play, X, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  isDemoMode,
  useDemoStep,
  exitDemoMode,
  TOTAL_DEMO_STEPS,
} from '@/hooks/useDemoMode';

interface DemoStep {
  title: string;
  description: string;
  action: string;
}

const DEMO_STEPS: DemoStep[] = [
  {
    title: 'Good morning. Here is your compliance dashboard.',
    description:
      'This is the first screen your compliance team sees every morning. It shows your priority items for today, your CBN compliance score, and a live feed of overnight alerts. Right now, there is one critical alert from last night that needs your attention.',
    action: "Click 'Suspicious Activity Alerts' in the left navigation to investigate →",
  },
  {
    title: 'Adebayo Ogunlesi — 47 POS transactions in 72 hours.',
    description:
      'ApexAML flagged this customer at 11:58pm Sunday after detecting a classic POS round-tripping pattern — ₦14.8M withdrawn across 12 agents, all transactions just below the ₦500,000 reporting threshold. Click on the alert to start your investigation.',
    action: 'Click the first Critical alert in the list →',
  },
  {
    title: 'Here is what this alert means in plain English.',
    description:
      "The 'What this alert means' card explains the POS Round-Trip typology in plain language — no jargon. The transaction timeline below shows exactly what happened. The case lifecycle bar at the top shows you are now at 'Under Review' — step 2 of 6.",
    action: 'Scroll down to see the transaction timeline →',
  },
  {
    title: 'Every interaction this customer has had with your institution.',
    description:
      "Customer 360 shows Adebayo's complete history — his KYC tier, his BVN verification, his risk radar scores, all his connected accounts, and every transaction. The 'Why this customer needs attention' card at the top gives you the plain-English risk summary.",
    action: "Click 'View Customer Profile' in the alert panel →",
  },
  {
    title: 'The AI co-pilot does the writing. You do the reviewing.',
    description:
      "Click 'Generate AI Investigation Report' and watch the AI co-pilot draft a complete NFIU-compliant Suspicious Transaction Report using the transaction data, your case notes, and the typology context. Average time: 11 minutes. Manual STR writing: 3 hours.",
    action: "Click 'Generate AI Investigation Report' →",
  },
  {
    title: 'One click exports the STR in the exact format the NFIU portal requires.',
    description:
      "The 'Export to NFIU goAML portal' button generates the complete goAML 3.x XML file — subject information, transaction records, narrative text — ready for upload. The case lifecycle bar automatically advances to 'Filed with NFIU.'",
    action: "Click 'Export to NFIU goAML portal' →",
  },
  {
    title: 'Every action your team took is permanently recorded.',
    description:
      "Go to Audit Trail & Access Control to see the complete immutable log of this case — who opened it, when, what they reviewed, when the STR was exported, who approved the account freeze. This is what you show a CBN examiner.",
    action: "Click 'Audit Trail & Access Control' in the left navigation →",
  },
];

export function DemoGuide() {
  const [step, setStep] = useDemoStep();
  const [minimized, setMinimized] = useState(false);
  const [demoSheetOpen, setDemoSheetOpen] = useState(false);
  const navigate = useNavigate();

  if (!isDemoMode) return null;

  const current = DEMO_STEPS[step];
  const progress = ((step + 1) / TOTAL_DEMO_STEPS) * 100;

  if (minimized) {
    return (
      <button
        onClick={() => setMinimized(false)}
        className="fixed bottom-24 right-6 z-50 flex items-center gap-2 rounded-full bg-primary px-4 py-3 text-primary-foreground shadow-2xl shadow-primary/30 hover:opacity-90"
        aria-label="Reopen guided demo"
      >
        <Play className="h-4 w-4" />
        <span className="text-sm font-medium">Guided demo</span>
        <span className="rounded-full bg-primary-foreground/20 px-2 py-0.5 text-[11px]">
          {step + 1}/{TOTAL_DEMO_STEPS}
        </span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-24 right-6 z-50 w-[380px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-primary/30 bg-card/95 shadow-2xl shadow-primary/20 backdrop-blur-xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/60 bg-gradient-to-r from-primary/15 to-transparent px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/20">
            <Play className="h-3.5 w-3.5 text-primary" />
          </div>
          <div>
            <div className="text-[13px] font-semibold leading-tight">
              ApexAML — Guided Demo
            </div>
            <div className="text-[10px] text-muted-foreground">
              Step {step + 1} of {TOTAL_DEMO_STEPS}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setMinimized(true)}
            className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Minimize"
          >
            <Minimize2 className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={exitDemoMode}
            className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Exit demo"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Progress */}
      <Progress value={progress} className="h-1 rounded-none" />

      {/* Body */}
      <div className="space-y-3 px-4 py-4">
        <h3 className="text-[15px] font-semibold leading-snug text-foreground">
          {current.title}
        </h3>
        <p className="text-[12.5px] leading-relaxed text-muted-foreground">
          {current.description}
        </p>
        <div className="rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-[12px] font-medium text-primary">
          {current.action}
        </div>
        {step === TOTAL_DEMO_STEPS - 1 && (
          <div className="space-y-2 pt-1">
            <Button
              size="sm"
              className="w-full text-[12px]"
              onClick={() => setDemoSheetOpen(true)}
            >
              Book a live demo →
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="w-full text-[12px]"
              onClick={() => navigate('/roadmap')}
            >
              Generate your free CBN roadmap →
            </Button>
          </div>
        )}
      </div>
      <BookDemoSheet open={demoSheetOpen} onOpenChange={setDemoSheetOpen} />


      {/* Footer */}
      <div className="flex items-center justify-between border-t border-border/60 bg-muted/30 px-3 py-2.5">
        <Button
          variant="ghost"
          size="sm"
          disabled={step === 0}
          onClick={() => setStep(step - 1)}
          className="h-8 px-2 text-[12px]"
        >
          <ChevronLeft className="mr-1 h-3.5 w-3.5" />
          Previous
        </Button>
        <button
          onClick={exitDemoMode}
          className="text-[11px] text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
        >
          Exit demo
        </button>
        <Button
          size="sm"
          disabled={step === TOTAL_DEMO_STEPS - 1}
          onClick={() => setStep(step + 1)}
          className="h-8 px-2 text-[12px]"
        >
          Next
          <ChevronRight className="ml-1 h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

export default DemoGuide;
