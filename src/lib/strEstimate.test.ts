import { describe, expect, it } from 'vitest';
import { calculateSTREstimate, DEFAULT_STR_ASSUMPTIONS } from './strEstimate';

describe('illustrative STR workload calculation', () => {
  it('defaults to 90 manual minutes, 60 assisted minutes and 20 STRs per month', () => {
    expect(DEFAULT_STR_ASSUMPTIONS).toMatchObject({ manualMinutes: 90, assistedMinutes: 60, strsPerMonth: 20 });
  });
  it('uses the same conservative defaults for all estimates', () => {
    expect(calculateSTREstimate(DEFAULT_STR_ASSUMPTIONS)).toEqual({
      manualHours: 30, assistedHours: 20, hoursDifference: 10,
      manualCost: 75_000, assistedCost: 50_000, costDifference: 25_000,
    });
  });
  it('recalculates from editable manual/assisted minutes and monthly STR count', () => {
    expect(calculateSTREstimate({ ...DEFAULT_STR_ASSUMPTIONS, manualMinutes: 90, assistedMinutes: 60, strsPerMonth: 40 }).hoursDifference).toBe(20);
  });
  it('does not hide a negative difference if assisted work takes longer', () => {
    expect(calculateSTREstimate({ ...DEFAULT_STR_ASSUMPTIONS, assistedMinutes: 120 }).hoursDifference).toBe(-10);
  });
  it('does not divide by zero or propagate invalid values', () => {
    expect(calculateSTREstimate({ ...DEFAULT_STR_ASSUMPTIONS, strsPerMonth: 0, workingHours: 0 }).costDifference).toBe(0);
  });
});