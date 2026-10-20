import { createContext, useContext, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { isMarketingPath } from '@/lib/marketingRoutes';

const MarketingContext = createContext(false);

export function useMarketingZone() {
  return useContext(MarketingContext);
}

// Context follows React portals; CSS variables need an explicit scope there.
export function MarketingZone({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const marketing = isMarketingPath(pathname);
  return (
    <MarketingContext.Provider value={marketing}>
      {marketing ? <div className="marketing-zone dark min-h-screen bg-background text-foreground">{children}</div> : children}
    </MarketingContext.Provider>
  );
}