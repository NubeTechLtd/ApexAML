import { useCallback } from 'react';
import { useLocation, useNavigate, type NavigateOptions } from 'react-router-dom';
import { APP_HOME, getZone, toZonePath, type Zone } from '@/lib/zones';

export function useZone(): Zone {
  return getZone(useLocation().pathname);
}

/** Maps a path into the current zone; null when the page is not available there. */
export function useZoneHref() {
  const zone = useZone();
  return useCallback((to: string) => toZonePath(to, zone), [zone]);
}

/** Drop-in replacement for useNavigate that keeps operational links in the current zone. */
export function useZoneNavigate() {
  const navigate = useNavigate();
  const zone = useZone();
  return useCallback(
    (to: string | number, options?: NavigateOptions) => {
      if (typeof to === 'number') return navigate(to);
      navigate(toZonePath(to, zone) ?? APP_HOME, options);
    },
    [navigate, zone],
  );
}
