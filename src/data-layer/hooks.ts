import { useCallback, useEffect, useMemo, useState } from 'react';
import { useZone } from '@/hooks/useZone';
import { providerForZone } from './index';
import type { AlertRecord, CustomerRecord, DataProvider, RiskRecalculationRequest } from './types';

/** The data provider for the current route zone. */
export function useDataProvider(): DataProvider {
  const zone = useZone();
  return useMemo(() => providerForZone(zone), [zone]);
}

export interface AlertsState {
  alerts: AlertRecord[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useAlerts(): AlertsState {
  const provider = useDataProvider();
  const [alerts, setAlerts] = useState<AlertRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const refetch = useCallback(() => setReloadKey((k) => k + 1), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    provider.alerts.list()
      .then((rows) => { if (!cancelled) setAlerts(rows); })
      .catch((e) => { if (!cancelled) { setError(e instanceof Error ? e.message : 'Unable to load alerts.'); setAlerts([]); } })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [provider, reloadKey]);

  return { alerts, loading, error, refetch };
}

export function useCustomers() {
  const provider = useDataProvider();
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let cancelled = false;
    provider.customers.list()
      .then((rows) => { if (!cancelled) setCustomers(rows); })
      .catch(() => { if (!cancelled) setCustomers([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [provider]);
  return { customers, loading };
}

export function useCustomer(id: string | null | undefined) {
  const provider = useDataProvider();
  const [customer, setCustomer] = useState<CustomerRecord | null>(null);
  const [loading, setLoading] = useState(!!id);
  useEffect(() => {
    let cancelled = false;
    if (!id) { setCustomer(null); setLoading(false); return; }
    setLoading(true);
    provider.customers.get(id)
      .then((row) => { if (!cancelled) setCustomer(row); })
      .catch(() => { if (!cancelled) setCustomer(null); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [provider, id]);
  return { customer, loading };
}

/**
 * Fire-and-forget risk score recalculation for the current zone. Failures are
 * logged but never block the compliance action itself.
 */
export function useRiskRecalculation() {
  const provider = useDataProvider();
  return useCallback(
    (params: Omit<RiskRecalculationRequest, 'customerId'> & { customerId: string | number | undefined | null }) => {
      const { customerId, ...rest } = params;
      if (customerId === undefined || customerId === null || customerId === '') return;
      provider.riskScores.recalculate({ ...rest, customerId: String(customerId) })
        .catch((err) => console.warn('Risk recalculation request failed', err));
    },
    [provider],
  );
}
