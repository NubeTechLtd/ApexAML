import { useCallback } from 'react';
import { trackEvent as track } from '@/lib/analytics';

/**
 * Hook wrapper around the analytics trackEvent helper.
 * Always fire-and-forget; never throws to the caller.
 *
 * Usage:
 *   const trackEvent = useTrackEvent();
 *   trackEvent('hook_viewed');
 *   trackEvent('form_completed', { institution_type: 'Fintech' });
 */
export function useTrackEvent() {
  return useCallback(
    (eventName: string, metadata?: Record<string, unknown>) => {
      // Source defaults to 'roadmap_generator' to match the funnel queries.
      void track(eventName, { source: 'roadmap_generator', metadata });
    },
    [],
  );
}
