import { useCallback, useEffect, useState } from 'react';
import { useDataProvider } from '@/data-layer/hooks';
import type { RiskScoreEntry, RiskTriggerType } from '@/data-layer/types';

export type { RiskScoreEntry, RiskTriggerType } from '@/data-layer/types';


/** Plain-English label for a score trigger, for tooltips and chart markers. */
export const TRIGGER_LABELS: Record<RiskTriggerType, string> = {
  ALERT_FIRED: 'a new alert was raised on this customer',
  ALERT_DISMISSED: 'an alert was reviewed and dismissed',
  STR_FILED: 'the institution recorded a suspicious transaction report as filed',
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

  const provider = useDataProvider();

  const load = useCallback(async () => {
    const since = new Date();
    since.setMonth(since.getMonth() - 12);
    let rows: RiskScoreEntry[] = [];
    try {
      rows = await provider.riskScores.history(customerId, since);
    } catch {
      rows = [];
    }
    if (rows.length > 0) {
      setHistory(rows);
      setIsLive(true);
    } else {
      setHistory(synthesiseHistory(customerId, fallbackScore));
      setIsLive(false);
    }
    setLoading(false);
  }, [provider, customerId, fallbackScore]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  // Any new score row for this customer refreshes the trail.
  useEffect(() => provider.riskScores.subscribe(customerId, () => { void load(); }), [provider, customerId, load]);

  const recalculate = useCallback(
    async (triggerType: RiskTriggerType, triggerReference?: string) => {
      setRecalculating(true);
      try {
        await provider.riskScores.recalculate({
          customerId, triggerType, triggerReference: triggerReference ?? null, kycTier, customerName, fallbackScore,
        });
        await load();
      } finally {
        setRecalculating(false);
      }
    },
    [provider, customerId, kycTier, customerName, fallbackScore, load],
  );

  const latest = history.length > 0 ? history[history.length - 1] : null;
  const currentScore = latest?.newScore ?? fallbackScore;

  return { history, latest, currentScore, isLive, loading, recalculating, recalculate, reload: load };
}
