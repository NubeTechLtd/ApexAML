import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getCurrentInstitutionId } from '@/lib/institution';

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
  institutionId?: string;
}

export interface AuditChainResult {
  institutionId: string;
  is_valid: boolean;
  checked_entries: number;
  break_at: number | null;
  reason: string | null;
}

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

type Row = {
  id: string;
  occurred_at: string;
  user_id: string | null;
  user_name: string;
  action: string;
  resource: string;
  justification: string | null;
  status: string;
  institution_id: string;
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
  institutionId: row.institution_id,
});

export function AuditLogProvider({ children }: { children: ReactNode }) {
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
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) { setEntries([]); setCanRead(false); return; }
      const { data: memberships, error: membershipError } = await supabase.from('user_institutions')
        .select('institution_id, role').eq('user_id', auth.user.id);
      if (membershipError) throw membershipError;
      const readable = (memberships ?? []).filter(m => ['compliance_officer', 'institution_admin'].includes(m.role));
      setCanRead(readable.length > 0);
      if (readable.length === 0) { setEntries([]); return; }
      const [log, results] = await Promise.all([
        supabase.from('audit_log')
          .select('id, occurred_at, user_id, user_name, action, resource, justification, status, institution_id')
          .in('institution_id', readable.map(m => m.institution_id))
          .order('occurred_at', { ascending: false }).limit(500),
        Promise.all(readable.map(async m => {
          const { data, error: verificationError } = await supabase.rpc('verify_audit_chain', { institution_id: m.institution_id });
          if (verificationError) throw verificationError;
          const result = data?.[0];
          if (!result) throw new Error('Chain verification returned no result.');
          return { ...result, institutionId: m.institution_id };
        })),
      ]);
      if (log.error) throw log.error;
      setEntries((log.data as Row[]).map(toEntry));
      setChains(results);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to load or verify the audit chain.');
      setEntries([]);
      setChains([]);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    void refresh();

    const channel = supabase
      .channel('audit-log-feed')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'audit_log' },
        () => { void refresh(); },
      )
      .subscribe();
    const { data: authListener } = supabase.auth.onAuthStateChange(() => { setTimeout(() => { void refresh(); }, 0); });

    return () => {
      authListener.subscription.unsubscribe();
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

    if (!user) throw new Error('Sign in to record an audit entry');

    const institutionId = entry.institutionId ?? await getCurrentInstitutionId();
    const { error } = await supabase
      .from('audit_log')
      .insert({
        user_id: user.id,
        institution_id: institutionId,
        user_name: analyst,
        action: entry.action,
        resource: entry.caseId,
        justification: entry.justification,
        status: entry.status ?? 'success',
      });

    if (error) throw error;
    await refresh();
  }, [refresh]);

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
