import { useCallback, useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Newspaper,
  ExternalLink,
  ShieldCheck,
  Loader2,
  RefreshCw,
  StickyNote,
  AlertTriangle,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export type AdverseMediaRisk = 'High' | 'Medium' | 'Low';
export type AdverseMediaOverall = AdverseMediaRisk | 'None';

export interface AdverseMediaItem {
  source: string;
  headline: string;
  url: string;
  published_at: string | null;
  relevance_score: number;
  risk_level: AdverseMediaRisk;
  rationale?: string;
}

export interface AdverseMediaScreening {
  id: string;
  customer_id: string;
  customer_name: string;
  search_date: string;
  results: AdverseMediaItem[];
  overall_risk_level: AdverseMediaOverall;
  screened_by: string;
  next_review_date: string;
}

const riskStyles: Record<AdverseMediaRisk, string> = {
  High: 'bg-[hsl(var(--risk-critical)/0.1)] text-[hsl(var(--risk-critical))] border-[hsl(var(--risk-critical)/0.25)]',
  Medium: 'bg-[hsl(var(--risk-medium)/0.1)] text-[hsl(var(--risk-medium))] border-[hsl(var(--risk-medium)/0.25)]',
  Low: 'bg-muted text-muted-foreground border-border',
};

/** Recognised Nigerian outlets get a short badge; anything else keeps its name. */
const OUTLETS: { match: RegExp; label: string }[] = [
  { match: /punch/i, label: 'Punch' },
  { match: /vanguard/i, label: 'Vanguard' },
  { match: /thisday/i, label: 'ThisDay' },
  { match: /business\s?day/i, label: 'BusinessDay' },
  { match: /cable/i, label: 'TheCable' },
  { match: /premium\s?times/i, label: 'Premium Times' },
  { match: /sahara/i, label: 'Sahara Reporters' },
];

function outletLabel(source: string) {
  return OUTLETS.find(o => o.match.test(source))?.label ?? source;
}

function formatDate(value: string | null) {
  if (!value) return 'Date unknown';
  const d = new Date(value);
  if (isNaN(d.getTime())) return 'Date unknown';
  return d.toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function useAdverseMediaScreening(customerId: string) {
  const [screening, setScreening] = useState<AdverseMediaScreening | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!customerId) {
      setLoading(false);
      return;
    }
    const { data, error } = await supabase
      .from('adverse_media_results')
      .select('*')
      .eq('customer_id', customerId)
      .order('search_date', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) console.warn('adverse media load failed', error.message);
    setScreening(
      data
        ? ({
            ...data,
            results: Array.isArray(data.results) ? data.results : [],
          } as unknown as AdverseMediaScreening)
        : null,
    );
    setLoading(false);
  }, [customerId]);

  useEffect(() => {
    setLoading(true);
    void load();
  }, [load]);

  return { screening, loading, reload: load, setScreening };
}

interface Props {
  customerId: string;
  customerName: string;
  bvn?: string | null;
  institutionName?: string | null;
  /** Prefills the compliance note sheet with the article reference. */
  onAddToCaseNotes?: (content: string) => void;
}

export function AdverseMediaPanel({
  customerId,
  customerName,
  bvn,
  institutionName,
  onAddToCaseNotes,
}: Props) {
  const { screening, loading, reload } = useAdverseMediaScreening(customerId);
  const [running, setRunning] = useState(false);

  const runScreening = async () => {
    setRunning(true);
    try {
      const { data, error } = await supabase.functions.invoke('screen-adverse-media', {
        body: {
          customer_id: customerId,
          customer_name: customerName,
          bvn: bvn ?? null,
          institution_name: institutionName ?? null,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      await reload();
      const level = data?.screening?.overall_risk_level ?? 'None';
      if (level === 'None') toast.success('Adverse media check complete — nothing found');
      else if (level === 'High') toast.error('High risk adverse media found');
      else toast.warning(`${level} risk adverse media found`);
    } catch (err: any) {
      toast.error(err?.message ?? 'Adverse media screening failed');
    } finally {
      setRunning(false);
    }
  };

  const addToNotes = (item: AdverseMediaItem) => {
    const content = `Adverse media (${outletLabel(item.source)}, ${formatDate(item.published_at)}) — ${item.risk_level} risk, relevance ${item.relevance_score}/100:\n${item.headline}\n${item.url}`;
    if (onAddToCaseNotes) onAddToCaseNotes(content);
    else {
      void navigator.clipboard?.writeText(content);
      toast.success('Article reference copied');
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-4 space-y-3">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }

  // Not yet screened
  if (!screening) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center gap-3 py-14 text-center">
          <Newspaper className="h-10 w-10 text-muted-foreground" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">Adverse media screening pending</p>
            <p className="text-xs text-muted-foreground max-w-sm">
              Searches Punch, Vanguard, ThisDay, BusinessDay, TheCable, Premium Times and Sahara
              Reporters for fraud, EFCC/ICPC, laundering and CBN sanction mentions of {customerName}.
            </p>
          </div>
          <Button size="sm" className="gap-1.5" onClick={runScreening} disabled={running}>
            {running ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Newspaper className="h-3.5 w-3.5" />}
            {running ? 'Screening Nigerian news sources…' : 'Run adverse media check →'}
          </Button>
        </CardContent>
      </Card>
    );
  }

  const items = screening.results ?? [];

  return (
    <Card>
      <CardContent className="pt-4 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Newspaper className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">Adverse Media Screening</span>
            {screening.overall_risk_level !== 'None' && (
              <Badge
                variant="outline"
                className={cn('text-[10px]', riskStyles[screening.overall_risk_level as AdverseMediaRisk])}
              >
                {screening.overall_risk_level} risk
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[11px] text-muted-foreground">
              Next review {new Date(screening.next_review_date).toLocaleDateString('en-NG', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </span>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={runScreening} disabled={running}>
              {running ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
              Re-screen
            </Button>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-[hsl(var(--risk-low)/0.3)] bg-[hsl(var(--risk-low)/0.06)] py-12 text-center">
            <ShieldCheck className="h-10 w-10 text-[hsl(var(--risk-low))]" />
            <p className="text-sm font-medium text-foreground">No adverse media found</p>
            <p className="text-xs text-muted-foreground">
              Last checked{' '}
              {new Date(screening.search_date).toLocaleString('en-NG', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}{' '}
              WAT · by {screening.screened_by}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((item, idx) => (
              <div
                key={`${item.url}-${idx}`}
                className="rounded-lg border bg-card p-3 space-y-2 hover:border-primary/30 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="text-[10px] font-semibold">
                        {outletLabel(item.source)}
                      </Badge>
                      <Badge variant="outline" className={cn('text-[10px]', riskStyles[item.risk_level])}>
                        {item.risk_level === 'High' && <AlertTriangle className="h-2.5 w-2.5 mr-1" />}
                        {item.risk_level} risk
                      </Badge>
                      <span className="text-[10px] text-muted-foreground">{formatDate(item.published_at)}</span>
                    </div>
                    <p className="text-sm font-medium text-foreground line-clamp-2">{item.headline}</p>
                    {item.rationale && (
                      <p className="text-[11px] text-muted-foreground line-clamp-2">{item.rationale}</p>
                    )}
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-[10px] text-muted-foreground">Relevance</p>
                    <p className="text-sm font-bold tabular-nums text-foreground">{item.relevance_score}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline"
                  >
                    View article <ExternalLink className="h-3 w-3" />
                  </a>
                  <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-[11px]" onClick={() => addToNotes(item)}>
                    <StickyNote className="h-3 w-3" /> Add to case notes
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
