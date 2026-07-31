import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type RiskTriggerType =
  | 'ALERT_FIRED'
  | 'ALERT_DISMISSED'
  | 'STR_FILED'
  | 'KYC_UPGRADE'
  | 'SANCTIONS_MATCH'
  | 'CLEAN_PERIOD_30D'
  | 'MANUAL_REVIEW';

export interface RiskScoreEntry {
  id: string;
  customerId: string;
  previousScore: number | null;
  newScore: number;
  scoreChange: number | null;
  triggerType: RiskTriggerType;
  triggerReference: string | null;
  calculatedBy: string;
  createdAt: string;
}

/** Plain-English label for a score trigger, for tooltips and chart markers. */
export const TRIGGER_LABELS: Record<RiskTriggerType, string> = {
  ALERT_FIRED: 'a new alert was raised on this customer',
  ALERT_DISMISSED: 'an alert was reviewed and dismissed',
  STR_FILED: 'a suspicious transaction report was filed with the NFIU',
  KYC_UPGRADE: 'the customer completed a KYC tier upgrade',
  SANCTIONS_MATCH: 'a sanctions or watchlist match was detected',
  CLEAN_PERIOD_30D: '30 consecutive days with no alerts',
  MANUAL_REVIEW: 'a compliance officer manually reviewed the score',
};

export const TRIGGER_SHORT: Record<RiskTriggerType, string> = {
  ALERT_FIRED: 'Alert raised',
  ALERT_DISMISSED: 'Alert dismissed',
  STR_FILED: 'STR filed',
  KYC_UPGRADE: 'KYC upgrade',
  SANCTIONS_MATCH: 'Sanctions match',
  CLEAN_PERIOD_30D: 'Clean 30 days',
  MANUAL_REVIEW: 'Manual review',
};

/**
 * Deterministic 12-month score trail derived from the customer's current score.
 * Used only until the scoring engine has written real history for a customer,
 * so the UI never renders an empty chart in demo environments.
 */
function synthesiseHistory(customerId: string, currentScore: number): RiskScoreEntry[] {
  const seed = Array.from(customerId).reduce((a, c) => a + c.charCodeAt(0), 0);
  const triggers: RiskTriggerType[] = [
    'CLEAN_PERIOD_30D',
    'ALERT_FIRED',
    'ALERT_DISMISSED',
    'STR_FILED',
    'MANUAL_REVIEW',
    'KYC_UPGRADE',
  ];

  const months = 12;
  const entries: RiskScoreEntry[] = [];
  let score = Math.max(5, Math.min(100, currentScore - 22));

  for (let i = months - 1; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i, 12);
    const step = (seed + i * 37) % 5;
    const trigger = triggers[(seed + i) % triggers.length];
    const previous = score;

    if (i === 0) {
      score = currentScore;
    } else {
      const delta = trigger === 'ALERT_FIRED' || trigger === 'STR_FILED'
        ? 4 + step * 3
        : -(2 + step * 2);
      score = Math.max(0, Math.min(100, score + delta));
    }

    entries.push({
      id: `${customerId}-synth-${i}`,
      customerId,
      previousScore: previous,
      newScore: score,
      scoreChange: score - previous,
      triggerType: trigger,
      triggerReference: null,
      calculatedBy: 'SYSTEM',
      createdAt: date.toISOString(),
    });
  }

  return entries;
}

interface Options {
  /** Fallback score used when the scoring engine has no record yet. */
  fallbackScore: number;
  kycTier?: string;
  customerName?: string;
}

export function useRiskScoreHistory(customerId: string, options: Options) {
  const { fallbackScore, kycTier, customerName } = options;
  const [history, setHistory] = useState<RiskScoreEntry[]>([]);
  const [isLive, setIsLive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [recalculating, setRecalculating] = useState(false);

  const load = useCallback(async () => {
    const since = new Date();
    since.setMonth(since.getMonth() - 12);

    const { data, error } = await supabase
      .from('risk_score_history')
      .select('*')
      .eq('customer_id', customerId)
      .gte('created_at', since.toISOString())
      .order('created_at', { ascending: true });

    if (!error && data && data.length > 0) {
      setHistory(
        data.map((r) => ({
          id: r.id,
          customerId: r.customer_id,
          previousScore: r.previous_score,
          newScore: r.new_score,
          scoreChange: r.score_change,
          triggerType: r.trigger_type as RiskTriggerType,
          triggerReference: r.trigger_reference,
          calculatedBy: r.calculated_by,
          createdAt: r.created_at,
        })),
      );
      setIsLive(true);
    } else {
      setHistory(synthesiseHistory(customerId, fallbackScore));
      setIsLive(false);
    }
    setLoading(false);
  }, [customerId, fallbackScore]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  // Live updates: any new score row for this customer refreshes the trail.
  useEffect(() => {
    const channel = supabase
      .channel(`risk-score-${customerId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'risk_score_history',
          filter: `customer_id=eq.${customerId}`,
        },
        () => load(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [customerId, load]);

  const recalculate = useCallback(
    async (triggerType: RiskTriggerType, triggerReference?: string) => {
      setRecalculating(true);
      try {
        const { error } = await supabase.functions.invoke('recalculate-risk-score', {
          body: {
            customer_id: customerId,
            trigger_type: triggerType,
            trigger_reference: triggerReference ?? null,
            signals: { kyc_tier: kycTier, customer_name: customerName },
          },
        });
        if (error) throw error;
        await load();
      } finally {
        setRecalculating(false);
      }
    },
    [customerId, kycTier, customerName, load],
  );

  const latest = history.length > 0 ? history[history.length - 1] : null;
  const currentScore = latest?.newScore ?? fallbackScore;

  return { history, latest, currentScore, isLive, loading, recalculating, recalculate, reload: load };
}
