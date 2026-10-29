import { describe, expect, it } from 'vitest';
import { calculateSTREstimate, DEFAULT_STR_ASSUMPTIONS, updateSTRAssumption, useSTRAssumptions } from './strEstimate';

describe('illustrative STR workload calculation', () => {
  it('uses the same conservative defaults for all estimates', () => {
    expect(calculateSTREstimate(DEFAULT_STR_ASSUMPTIONS)).toEqual({
      manualHours: 20, assistedHours: 15, hoursDifference: 5,
      manualCost: 50_000, assistedCost: 37_500, costDifference: 12_500,
    });
  });
  it('recalculates from editable manual/assisted minutes and monthly STR count', () => {
    expect(calculateSTREstimate({ ...DEFAULT_STR_ASSUMPTIONS, manualMinutes: 90, assistedMinutes: 60, strsPerMonth: 40 }).hoursDifference).toBe(20);
  });
  it('does not hide a negative difference if assisted work takes longer', () => {
    expect(calculateSTREstimate({ ...DEFAULT_STR_ASSUMPTIONS, assistedMinutes: 90 }).hoursDifference).toBe(-10);
  });
  it('does not divide by zero or propagate invalid values', () => {
    expect(calculateSTREstimate({ ...DEFAULT_STR_ASSUMPTIONS, strsPerMonth: 0, workingHours: 0 }).costDifference).toBe(0);
  });
});