import { useEffect, useMemo, useState } from 'react';
import { Check, ChevronRight, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

export type LifecycleStageId =
  | 'received'
  | 'under_review'
  | 'evidence'
  | 'drafted'
  | 'filed'
  | 'closed';

interface CaseLifecycleBarProps {
  caseId: string;
  alertReceivedLabel?: string;
  underReviewAt?: Date | null;
  hasEvidence: boolean;
  strDrafted: boolean;
  strExported: boolean;
  caseClosed: boolean;
  requiresStr: boolean;
  /** Optional explicit deadline; if omitted, derived deterministically from caseId. */
  strDeadline?: Date | null;
}

const STAGES: { id: LifecycleStageId; label: string }[] = [
  { id: 'received', label: 'Alert Received' },
  { id: 'under_review', label: 'Under Review' },
  { id: 'evidence', label: 'Evidence Gathered' },
  { id: 'drafted', label: 'STR Drafted' },
  { id: 'filed', label: 'Filed with NFIU' },
  { id: 'closed', label: 'Case Closed' },
];

const GUIDANCE: Partial<Record<LifecycleStageId, string>> = {
  under_review:
    'Review the transaction timeline below. Click View Customer Profile to check their risk history. When ready, click Generate STR Draft to start the AI co-pilot.',
  evidence:
    'Your case notes are saved. Click Generate STR Draft above — the AI co-pilot will use your notes and the transaction data to draft the NFIU report.',
  drafted:
    'Review the AI draft below. Edit any sections that need adjustment. When satisfied, click Export goAML XML to download the submission file.',
  filed: 'Submission file generated. Close the case once the NFIU portal acknowledges receipt.',
  closed: 'This case is resolved. All actions are recorded in the immutable audit log.',
  received: 'Click Mark Under Review above to take ownership of this case and start the investigation.',
};

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

function fmtTimeShort(d: Date): string {
  return d.toLocaleTimeString('en-NG', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Africa/Lagos',
  });
}

export function CaseLifecycleBar({
  caseId,
  alertReceivedLabel,
  underReviewAt,
  hasEvidence,
  strDrafted,
  strExported,
  caseClosed,
  requiresStr,
  strDeadline,
}: CaseLifecycleBarProps) {
  const done: Record<LifecycleStageId, boolean> = {
    received: true,
    under_review: !!underReviewAt || hasEvidence || strDrafted || strExported || caseClosed,
    evidence: hasEvidence || strDrafted || strExported || caseClosed,
    drafted: strDrafted || strExported,
    filed: strExported,
    closed: caseClosed,
  };

  const currentStageId: LifecycleStageId =
    (STAGES.find((s) => !done[s.id])?.id) ?? 'closed';

  // Stable demo deadline derived from caseId hash, in [1.5h, 23h] from "now".
  const derivedDeadline = useMemo(() => {
    if (strDeadline) return strDeadline;
    if (!requiresStr) return null;
    const hours = 1.5 + (hashString(caseId) % 220) / 10; // 1.5 .. 23.5h
    return new Date(Date.now() + hours * 60 * 60 * 1000);
  }, [caseId, requiresStr, strDeadline]);

  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    if (!derivedDeadline) return;
    const t = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(t);
  }, [derivedDeadline]);

  let countdown: { label: string; tone: 'red' | 'amber' | 'muted' } | null = null;
  if (derivedDeadline && !caseClosed && !strExported) {
    const diffMs = derivedDeadline.getTime() - now.getTime();
    if (diffMs <= 0) {
      countdown = { label: 'STR overdue', tone: 'red' };
    } else {
      const totalMin = Math.floor(diffMs / 60_000);
      const h = Math.floor(totalMin / 60);
      const m = totalMin % 60;
      const tone: 'red' | 'amber' | 'muted' = h < 6 ? 'red' : h < 12 ? 'amber' : 'muted';
      countdown = { label: `STR due in ${h}h ${m}m`, tone };
    }
  }

  const toneClass = (tone: 'red' | 'amber' | 'muted') =>
    tone === 'red'
      ? 'text-[hsl(var(--risk-critical))] border-[hsl(var(--risk-critical))]/30 bg-[hsl(var(--risk-critical))]/10'
      : tone === 'amber'
        ? 'text-[hsl(var(--risk-medium))] border-[hsl(var(--risk-medium))]/30 bg-[hsl(var(--risk-medium))]/10'
        : 'text-muted-foreground border-border bg-muted/40';

  const guidance = GUIDANCE[currentStageId];

  return (
    <div className="rounded-lg border border-border bg-card px-4 py-3 space-y-2.5">
      <div className="flex items-center gap-2">
        <div className="flex flex-1 flex-wrap items-center gap-y-2">
          {STAGES.map((stage, idx) => {
            const isCurrent = stage.id === currentStageId && !caseClosed;
            const isPast = done[stage.id] && !isCurrent;
            const isFuture = !done[stage.id] && !isCurrent;

            const pillClass = cn(
              'inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[11px] font-medium transition-colors',
              isCurrent && 'border-primary/40 bg-primary/10 text-primary',
              isPast && 'border-[hsl(var(--risk-low))]/30 bg-[hsl(var(--risk-low))]/10 text-[hsl(var(--risk-low))]',
              isFuture && 'border-border bg-muted/30 text-muted-foreground',
            );

            const numClass = cn(
              'flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold',
              isCurrent && 'bg-primary text-primary-foreground',
              isPast && 'bg-[hsl(var(--risk-low))]/20',
              isFuture && 'bg-muted-foreground/15',
            );

            let timestamp: string | null = null;
            if (stage.id === 'received' && alertReceivedLabel) timestamp = alertReceivedLabel;
            else if (stage.id === 'under_review' && underReviewAt) timestamp = fmtTimeShort(underReviewAt);

            return (
              <div key={stage.id} className="flex items-center">
                <div className={pillClass}>
                  <span className={numClass}>
                    {isPast ? <Check className="h-2.5 w-2.5" /> : idx + 1}
                  </span>
                  <span>{stage.label}</span>
                  {timestamp && (
                    <span className="text-[10px] opacity-70 font-normal">· {timestamp}</span>
                  )}
                </div>
                {idx < STAGES.length - 1 && (
                  <ChevronRight className="h-3 w-3 text-muted-foreground/50 mx-0.5" />
                )}
              </div>
            );
          })}
        </div>

        {countdown && (
          <div
            className={cn(
              'shrink-0 inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[11px] font-semibold',
              toneClass(countdown.tone),
            )}
          >
            <Clock className="h-3 w-3" />
            {countdown.label}
          </div>
        )}
      </div>

      {guidance && (
        <p className="text-xs text-foreground/80 leading-relaxed border-l-2 border-primary/40 pl-3">
          {guidance}
        </p>
      )}
    </div>
  );
}

export default CaseLifecycleBar;
