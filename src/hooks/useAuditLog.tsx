import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { useDataProvider } from '@/data-layer/hooks';
import type { AuditChainResult, AuditEntry } from '@/data-layer/types';

export type { AuditChainResult, AuditEntry } from '@/data-layer/types';

export type AuditAction =
  | 'NFIU_ESCALATION'
  | 'ACCOUNT_FREEZE'
  | 'DOCUMENT_UPLOAD'
  | 'DOCUMENT_VERIFY'
  | 'DOCUMENT_DOWNLOAD'
  | 'KYB_CAC_VERIFY'
  | 'KYB_UBO_ADDED'
  | 'KYB_BVN_VERIFY'
  | 'KYB_PEP_SCREEN'
  | 'KYB_MAKER_APPROVE'
  | 'KYB_MAKER_REJECT'
  | 'KYB_APPROVED'
  | 'KYB_REJECTED'
  | 'STR_EXPORT';

interface AuditLogContextValue {
  entries: AuditEntry[];
  loading: boolean;
  error: string | null;
  chains: AuditChainResult[];
  canRead: boolean;
  append: (entry: Omit<AuditEntry, 'timestamp'>) => Promise<void>;
  refresh: () => Promise<void>;
}

const AuditLogContext = createContext<AuditLogContextValue | null>(null);

/** Audit trail for the current zone: sample entries under /demo, the live log elsewhere. Must sit inside the router. */
export function AuditLogProvider({ children }: { children: ReactNode }) {
  const provider = useDataProvider();
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chains, setChains] = useState<AuditChainResult[]>([]);
  const [canRead, setCanRead] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    setChains([]);
    try {
      const snapshot = await provider.audit.load();
      setEntries(snapshot.entries);
      setChains(snapshot.chains);
      setCanRead(snapshot.canRead);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to load or verify the audit chain.');
      setEntries([]);
      setChains([]);
    } finally {
      setLoading(false);
    }
  }, [provider]);

  useEffect(() => {
    void refresh();
    return provider.audit.subscribe(() => { void refresh(); });
  }, [provider, refresh]);

  const append = useCallback(async (entry: Omit<AuditEntry, 'timestamp'>) => {
    await provider.audit.append(entry);
    await refresh();
  }, [provider, refresh]);

  return (
    <AuditLogContext.Provider value={{ entries, loading, error, chains, canRead, append, refresh }}>
      {children}
    </AuditLogContext.Provider>
  );
}

export function useAuditLog() {
  const ctx = useContext(AuditLogContext);
  if (!ctx) throw new Error('useAuditLog must be used within AuditLogProvider');
  return ctx;
}
