import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Alert, AlertType, RiskLevel, Transaction, TxChannel } from '@/data/mockAlerts';

/**
 * Loads alerts for the signed-in user's institution, joined with the
 * customer profile and that customer's transactions, and maps the rows
 * into the shape the Alert Workspace UI already renders.
 *
 * RLS scopes every table to the caller's institution, so no explicit
 * institution filter is needed here.
 */

function timeElapsed(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.max(0, Math.floor(diffMs / 60000));
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function draftNarrative(row: {
  case_id: string;
  rule_triggered: string;
  description: string | null;
  behavioral_red_flags: string[] | null;
  customerName: string;
  bvn: string | null;
}): string {
  const flags = (row.behavioral_red_flags ?? []).map((f, i) => `${i + 1}. ${f}`).join('\n');
  return [
    `Case reference: ${row.case_id}`,
    '',
    `The compliance monitoring system flagged activity on the account of ${row.customerName}${row.bvn ? ` (BVN ${row.bvn})` : ''} under the rule "${row.rule_triggered}".`,
    row.description ? `\n${row.description}` : '',
    flags ? `\nBehavioural red flags observed:\n${flags}` : '',
  ]
    .filter(Boolean)
    .join('\n');
}

export interface InstitutionAlertsState {
  alerts: Alert[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useInstitutionAlerts(): InstitutionAlertsState {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const refetch = useCallback(() => setReloadKey((k) => k + 1), []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);

      const { data, error: alertsError } = await supabase
        .from('alerts')
        .select(
          `id, case_id, status, risk_level, rule_triggered, alert_type, description,
           behavioral_red_flags, opened_at, customer_id,
           customers ( id, full_name, bvn, nin, nuban, kyc_tier, risk_score, entity_type )`
        )
        .order('opened_at', { ascending: false });

      if (cancelled) return;

      if (alertsError) {
        setError(alertsError.message);
        setAlerts([]);
        setLoading(false);
        return;
      }

      const rows = data ?? [];
      const customerIds = Array.from(new Set(rows.map((r) => r.customer_id).filter(Boolean)));

      let txByCustomer = new Map<string, Transaction[]>();
      if (customerIds.length > 0) {
        const { data: txData, error: txError } = await supabase
          .from('transactions')
          .select('id, customer_id, tx_type, channel, amount_ngn, balance_after, counterparty, agent_location, occurred_at')
          .in('customer_id', customerIds)
          .order('occurred_at', { ascending: false });

        if (cancelled) return;
        if (txError) {
          setError(txError.message);
        } else {
          txByCustomer = (txData ?? []).reduce((acc, t) => {
            const list = acc.get(t.customer_id) ?? [];
            list.push({
              id: t.id,
              date: t.occurred_at,
              type: t.tx_type === 'Credit' ? 'Credit' : 'Debit',
              amountNGN: Number(t.amount_ngn ?? 0),
              counterparty: t.counterparty ?? '—',
              balanceAfter: Number(t.balance_after ?? 0),
              channel: (t.channel ?? 'Mobile Transfer') as TxChannel,
              agentLocation: t.agent_location ?? undefined,
            });
            acc.set(t.customer_id, list);
            return acc;
          }, new Map<string, Transaction[]>());
        }
      }

      const mapped: Alert[] = rows.map((r) => {
        const c = r.customers as {
          full_name: string; bvn: string | null; nin: string | null; nuban: string | null;
          kyc_tier: string | null; risk_score: number | null; entity_type: string | null;
        } | null;
        const customerName = c?.full_name ?? 'Unknown customer';
        const flags = (r.behavioral_red_flags as string[] | null) ?? [];

        return {
          id: r.id,
          caseId: r.case_id,
          status: (r.status as Alert['status']) ?? 'Open',
          riskLevel: (r.risk_level as RiskLevel) ?? 'Medium',
          ruleTriggered: r.rule_triggered,
          timestamp: r.opened_at,
          timeElapsed: timeElapsed(r.opened_at),
          description: r.description ?? '',
          aiDraftedNarrative: draftNarrative({
            case_id: r.case_id,
            rule_triggered: r.rule_triggered,
            description: r.description,
            behavioral_red_flags: flags,
            customerName,
            bvn: c?.bvn ?? null,
          }),
          customerProfile: {
            fullName: customerName,
            bvn: c?.bvn ?? '—',
            nin: c?.nin ?? '—',
            nuban: c?.nuban ?? '—',
            kycTier: c?.kyc_tier ?? 'Tier 1',
            occupation: c?.entity_type ?? '—',
            registeredAddress: '—',
            riskScore: c?.risk_score ?? 0,
          },
          transactions: txByCustomer.get(r.customer_id) ?? [],
          behavioralRedFlags: flags,
          alertType: (r.alert_type as AlertType) ?? 'STANDARD',
        };
      });

      setAlerts(mapped);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  return { alerts, loading, error, refetch };
}
