import { useEffect, useState } from 'react';

/**
 * True when the URL contains `?demo=true`. Evaluated at module load —
 * a URL change requires a full reload, which is the intended behaviour.
 */
export const isDemoMode =
  typeof window !== 'undefined' &&
  new URLSearchParams(window.location.search).get('demo') === 'true';

export const TOTAL_DEMO_STEPS = 7;

// Tiny module-level store so the step is shared across any consumer
// (DemoGuide is currently the only one, but this keeps the API clean).
let currentStep = 0;
const listeners = new Set<(n: number) => void>();

function setCurrentStep(next: number) {
  currentStep = Math.max(0, Math.min(TOTAL_DEMO_STEPS - 1, next));
  listeners.forEach((l) => l(currentStep));
}

export function useDemoStep(): [number, (n: number) => void] {
  const [step, setStep] = useState(currentStep);
  useEffect(() => {
    listeners.add(setStep);
    return () => {
      listeners.delete(setStep);
    };
  }, []);
  return [step, setCurrentStep];
}

export function exitDemoMode() {
  if (typeof window === 'undefined') return;
  const url = new URL(window.location.href);
  url.searchParams.delete('demo');
  window.location.href = url.toString();
}
