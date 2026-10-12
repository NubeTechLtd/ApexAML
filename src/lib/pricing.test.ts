import { describe, expect, it } from 'vitest';
import { PLAN_PRICING, IMPLEMENTATION_PRICING, imtoMonthlyCost } from './pricing';

describe('approved pricing', () => {
  it('uses the current monthly subscription prices', () => {
    expect(PLAN_PRICING.essential).toBe(550_000);
    expect(PLAN_PRICING.starter).toBe(1_100_000);
    expect(PLAN_PRICING.growth).toBe(2_800_000);
  });

  it('applies the IMTO minimum and scales above it', () => {
    expect(imtoMonthlyCost(0)).toBe(3_500_000);
    expect(imtoMonthlyCost(250_000)).toBe(3_500_000);
    expect(imtoMonthlyCost(500_000)).toBe(4_500_000);
    expect(imtoMonthlyCost(5_000_000)).toBe(45_000_000);
  });

  it('keeps implementation fees within the approved range', () => {
    expect(Math.min(...Object.values(IMPLEMENTATION_PRICING))).toBe(1_500_000);
    expect(Math.max(...Object.values(IMPLEMENTATION_PRICING))).toBe(12_000_000);
  });
});