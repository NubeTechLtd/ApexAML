/**
 * Canonical identifier used for risk scoring rows. The BVN is the only stable
 * key shared between the alert workspace and Customer 360, so institutional
 * records without a real BVN (e.g. "N/A (Foreign Business)") are not scored.
 *
 * Recalculation requests go through `useRiskRecalculation` in the data layer,
 * which picks sample or live scoring by route zone.
 */
export function riskScoreKey(bvn: string | null | undefined): string | null {
  const value = (bvn ?? '').trim();
  return /^\d{11}$/.test(value) ? value : null;
}
