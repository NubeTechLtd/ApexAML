import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

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

export interface AuditEntry {
  id?: string;
  timestamp: string;
  action: AuditAction | string;
  analyst: string;
  caseId: string;
  justification: string;
  status?: 'success' | 'denied';
  userId?: string | null;
}

interface AuditLogContextValue {
  entries: AuditEntry[];
  loading: boolean;
  append: (entry: Omit<AuditEntry, 'timestamp'>) => Promise<void>;
  refresh: () => Promise<void>;
}

const AuditLogContext = createContext<AuditLogContextValue | null>(null);

type Row = {
  id: string;
  occurred_at: string;
  user_id: string | null;
  user_name: string;
  action: string;
  resource: string;
  justification: string | null;
  status: string;
};

const toEntry = (row: Row): AuditEntry => ({
  id: row.id,
  timestamp: row.occurred_at,
  action: row.action,
  analyst: row.user_name,
  caseId: row.resource,
  justification: row.justification ?? '',
  status: row.status === 'denied' ? 'denied' : 'success',
  userId: row.user_id,
});

export function AuditLogProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const { data, error } = await supabase
      .from('audit_log')
      .select('id, occurred_at, user_id, user_name, action, resource, justification, status')
      .order('occurred_at', { ascending: false })
      .limit(500);

    if (!error && data) setEntries((data as Row[]).map(toEntry));
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();

    const channel = supabase
      .channel('audit-log-feed')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'audit_log' },
        (payload) => {
          const row = payload.new as Row;
          setEntries((prev) =>
            prev.some((e) => e.id === row.id) ? prev : [toEntry(row), ...prev],
          );
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [refresh]);

  const append = useCallback(async (entry: Omit<AuditEntry, 'timestamp'>) => {
    const { data: auth } = await supabase.auth.getUser();
    const user = auth?.user ?? null;
    const analyst =
      entry.analyst ||
      (user?.user_metadata?.full_name as string | undefined) ||
      user?.email ||
      'Unknown';

    const optimistic: AuditEntry = {
      ...entry,
      analyst,
      timestamp: new Date().toISOString(),
      status: entry.status ?? 'success',
    };
    setEntries((prev) => [optimistic, ...prev]);

    if (!user) return;

    const { data, error } = await supabase
      .from('audit_log')
      .insert({
        user_id: user.id,
        user_name: analyst,
        action: entry.action,
        resource: entry.caseId,
        justification: entry.justification,
        status: entry.status ?? 'success',
      })
      .select('id, occurred_at, user_id, user_name, action, resource, justification, status')
      .maybeSingle();

    if (!error && data) {
      const saved = toEntry(data as Row);
      setEntries((prev) => [saved, ...prev.filter((e) => e !== optimistic)]);
    }
  }, []);

  return (
    <AuditLogContext.Provider value={{ entries, loading, append, refresh }}>
      {children}
    </AuditLogContext.Provider>
  );
}

export function useAuditLog() {
  const ctx = useContext(AuditLogContext);
  if (!ctx) throw new Error('useAuditLog must be used within AuditLogProvider');
  return ctx;
}
