import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export interface AuditEntry {
  timestamp: string;
  action: 'NFIU_ESCALATION' | 'ACCOUNT_FREEZE';
  analyst: string;
  caseId: string;
  justification: string;
}

interface AuditLogContextValue {
  entries: AuditEntry[];
  append: (entry: Omit<AuditEntry, 'timestamp'>) => void;
}

const AuditLogContext = createContext<AuditLogContextValue | null>(null);

export function AuditLogProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<AuditEntry[]>([]);

  const append = useCallback((entry: Omit<AuditEntry, 'timestamp'>) => {
    setEntries(prev => [...prev, { ...entry, timestamp: new Date().toISOString() }]);
  }, []);

  return (
    <AuditLogContext.Provider value={{ entries, append }}>
      {children}
    </AuditLogContext.Provider>
  );
}

export function useAuditLog() {
  const ctx = useContext(AuditLogContext);
  if (!ctx) throw new Error('useAuditLog must be used within AuditLogProvider');
  return ctx;
}
