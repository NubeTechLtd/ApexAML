export const PLAN_PRICING = {
  essential: 550_000,
  starter: 1_100_000,
  growth: 2_800_000,
  imtoPerTransaction: 9,
  imtoMonthlyMinimum: 3_500_000,
} as const;

export const IMPLEMENTATION_PRICING = {
  essential: 1_500_000,
  starter: 3_000_000,
  growth: 6_000_000,
  imto: 12_000_000,
} as const;

export const IMPLEMENTATION_PRICE_RANGE =
  'From ₦1,500,000 to ₦12,000,000 depending on scope.';

export function imtoMonthlyCost(transactions: number): number {
  return Math.max(PLAN_PRICING.imtoMonthlyMinimum, transactions * PLAN_PRICING.imtoPerTransaction);
}