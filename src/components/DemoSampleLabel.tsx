import { Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export const DEMO_SAMPLE_LABEL = 'Sample output (pre-written for demo)';
export const DEMO_SAMPLE_TOOLTIP =
  "In the live system, drafts are generated from the case's own data and reviewed by an analyst.";

/** Marks pre-written demo narratives and co-pilot replies so they are never presented as generated. */
export const DEMO_LIVE_AI_LABEL = 'Live AI on synthetic data';
export const DEMO_LIVE_AI_TOOLTIP =
  'Generated just now by an AI model from this fictional case. In the live system, drafts are generated from the case\'s own data and reviewed by an analyst.';
export const DEMO_FALLBACK_LABEL = 'Sample output (fallback)';
export const DEMO_FALLBACK_TOOLTIP =
  "The demo AI was unavailable, timed out or reached its limit, so this is pre-written sample text. In the live system, drafts are generated from the case's own data and reviewed by an analyst.";
export const DEMO_AI_LIMIT_MESSAGE = 'Demo AI limit reached for this session. Book a walkthrough to see it live';
export const DEMO_AI_CAPACITY_MESSAGE = 'Live AI demo is at capacity today. Book a walkthrough to see it live';
export const demoAiLimitMessage = (limit: false | 'session' | 'capacity' | undefined) =>
  limit === 'capacity' ? DEMO_AI_CAPACITY_MESSAGE : limit === 'session' ? DEMO_AI_LIMIT_MESSAGE : null;

export function DemoSampleLabel({ className = '', source }: { className?: string; source?: 'live_ai' | 'sample' | 'fallback' }) {
  const label = source === 'live_ai' ? DEMO_LIVE_AI_LABEL : source === 'fallback' ? DEMO_FALLBACK_LABEL : DEMO_SAMPLE_LABEL;
  const tip = source === 'live_ai' ? DEMO_LIVE_AI_TOOLTIP : source === 'fallback' ? DEMO_FALLBACK_TOOLTIP : DEMO_SAMPLE_TOOLTIP;
  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            tabIndex={0}
            className={`inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground cursor-help focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${className}`}
          >
            <Info className="h-2.5 w-2.5" aria-hidden />
            {label}
          </span>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs text-xs">{tip}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
