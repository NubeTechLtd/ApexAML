import { Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export const DEMO_SAMPLE_LABEL = 'Sample output (pre-written for demo)';
export const DEMO_SAMPLE_TOOLTIP =
  "In the live system, drafts are generated from the case's own data and reviewed by an analyst.";

/** Marks pre-written demo narratives and co-pilot replies so they are never presented as generated. */
export function DemoSampleLabel({ className = '' }: { className?: string }) {
  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            tabIndex={0}
            className={`inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground cursor-help focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${className}`}
          >
            <Info className="h-2.5 w-2.5" aria-hidden />
            {DEMO_SAMPLE_LABEL}
          </span>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs text-xs">{DEMO_SAMPLE_TOOLTIP}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
