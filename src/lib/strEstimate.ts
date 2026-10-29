import { useSyncExternalStore } from 'react';

export const STR_ESTIMATE_LABEL = 'Illustrative estimate based on assumptions you can change';
export const DEFAULT_STR_ASSUMPTIONS = {
  manualMinutes: 60,
  assistedMinutes: 45,
  strsPerMonth: 20,
  monthlySalary: 400_000,
  workingHours: 160,
} as const;
export type STRAssumptions = { [K in keyof typeof DEFAULT_STR_ASSUMPTIONS]: number };

export function calculateSTREstimate(assumptions: STRAssumptions) {
  const safe = (value: number) => Number.isFinite(value) ? Math.max(0, value) : 0;
  const count = safe(assumptions.strsPerMonth);
  const manualHours = safe(assumptions.manualMinutes) * count / 60;
  const assistedHours = safe(assumptions.assistedMinutes) * count / 60;
  const hourlyRate = assumptions.workingHours > 0 ? safe(assumptions.monthlySalary) / assumptions.workingHours : 0;
  return {
    manualHours,
    assistedHours,
    hoursDifference: manualHours - assistedHours,
    manualCost: manualHours * hourlyRate,
    assistedCost: assistedHours * hourlyRate,
    costDifference: (manualHours - assistedHours) * hourlyRate,
  };
}

let assumptions: STRAssumptions = { ...DEFAULT_STR_ASSUMPTIONS };
const listeners = new Set<() => void>();
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
};
const getSnapshot = () => assumptions;
export function updateSTRAssumption(key: keyof STRAssumptions, value: number) {
  assumptions = { ...assumptions, [key]: Number.isFinite(value) ? Math.max(key === 'workingHours' ? 1 : 0, value) : 0 };
  listeners.forEach(listener => listener());
}
export function useSTRAssumptions() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}