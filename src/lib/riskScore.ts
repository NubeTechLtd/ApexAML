import { supabase } from '@/integrations/supabase/client';
import type { RiskTriggerType } from '@/hooks/useRiskScoreHistory';

/**
 * Canonical identifier used for risk scoring rows. The BVN is the only stable
 * key shared between the alert workspace and Customer 360, so institutional
 * records without a real BVN (e.g. "N/A (Foreign Business)") are not scored.
 */
export function riskScoreKey(bvn: string | null | undefined): string | null {
  const value = (bvn ?? '').trim();
  return /^\d{11}$/.test(value) ? value : null;
}

/**
 * Fire-and-forget risk score recalculation. Called when an alert fires, is
 * dismissed, or a case is escalated/filed to the NFIU. Failures are logged but
 * never block the compliance action itself.
 */

export async function requestRiskRecalculation(params: {
  customerId: string | number | undefined;
  triggerType: RiskTriggerType;
  triggerReference?: string;
  kycTier?: string;
  customerName?: string;
  signals?: Record<string, unknown>;
}) {
  const { customerId, triggerType, triggerReference, kycTier, customerName, signals } = params;
  if (customerId === undefined || customerId === null || customerId === '') return;

  try {
    await supabase.functions.invoke('recalculate-risk-score', {
      body: {
        customer_id: String(customerId),
        trigger_type: triggerType,
        trigger_reference: triggerReference ?? null,
        signals: { kyc_tier: kycTier, customer_name: customerName, ...signals },
      },
    });
  } catch (err) {
    console.warn('Risk recalculation request failed', err);
  }
}
