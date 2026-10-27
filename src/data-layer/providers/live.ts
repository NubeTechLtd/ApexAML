/**
 * Live provider: the institution's real data, scoped by backend access rules.
 * Loaded lazily by the data layer, so the demo zone never reaches this module.
 */
import { supabase } from '@/integrations/supabase/client';
import { getCurrentInstitutionId } from '@/lib/institution';
import type { Alert, AlertType, RiskLevel, Transaction, TxChannel } from '@/data/mockAlerts';
import type {
  AdverseMediaOverall, AdverseMediaScreening, AuditChainResult, AuditEntry, CustomerRecord,
  DataProvider, KycDocument, RiskTriggerType, SanctionsListMeta, SanctionsScreenResult,
  TransactionRecord,
} from '../types';

const KYC_BUCKET = 'kyc-documents';
const TX_COLUMNS = 'transaction_id, amount, channel, transaction_datetime, counterparty_account, narration, direction';

function timeElapsed(iso: string): string {
  const mins = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function draftNarrative(row: {
  case_id: string; rule_triggered: string; description: string | null;
  behavioral_red_flags: string[] | null; customerName: string; bvn: string | null;
}): string {
  const flags = (row.behavioral_red_flags ?? []).map((f, i) => `${i + 1}. ${f}`).join('\n');
  return [
    `Case reference: ${row.case_id}`,
    '',
    `The compliance monitoring system flagged activity on the account of ${row.customerName}${row.bvn ? ` (BVN ${row.bvn})` : ''} under the rule "${row.rule_triggered}".`,
    row.description ? `\n${row.description}` : '',
    flags ? `\nBehavioural red flags observed:\n${flags}` : '',
  ].filter(Boolean).join('\n');
}

function toTransaction(t: {
  id: string; customer_id: string; tx_type: string; channel: string | null; amount_ngn: number | null;
  balance_after: number | null; counterparty: string | null; agent_location: string | null; occurred_at: string;
}): TransactionRecord {
  return {
    id: t.id,
    customerId: t.customer_id,
    date: t.occurred_at,
    type: t.tx_type === 'Credit' ? 'Credit' : 'Debit',
    amountNGN: Number(t.amount_ngn ?? 0),
    counterparty: t.counterparty ?? '—',
    balanceAfter: Number(t.balance_after ?? 0),
    channel: (t.channel ?? 'Mobile Transfer') as TxChannel,
    agentLocation: t.agent_location ?? undefined,
  };
}

async function listTransactions(customerIds: string[]): Promise<TransactionRecord[]> {
  if (customerIds.length === 0) return [];
  const { data, error } = await supabase
    .from('transactions')
    .select('id, customer_id, tx_type, channel, amount_ngn, balance_after, counterparty, agent_location, occurred_at')
    .in('customer_id', customerIds)
    .order('occurred_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(toTransaction);
}

function toCustomer(c: {
  id: string; full_name: string; bvn: string | null; nin: string | null; nuban: string | null;
  kyc_tier: string; risk_level: string; risk_score: number; account_status: string;
  bvn_verified: boolean; entity_type: string | null;
}): CustomerRecord {
  return {
    id: c.id, fullName: c.full_name, bvn: c.bvn, nin: c.nin, nuban: c.nuban, kycTier: c.kyc_tier,
    riskLevel: c.risk_level, riskScore: c.risk_score, accountStatus: c.account_status,
    bvnVerified: c.bvn_verified, entityType: c.entity_type,
  };
}

function safeName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_');
}

async function signedUrl(path: string, expiresIn = 300) {
  const { data, error } = await supabase.storage.from(KYC_BUCKET).createSignedUrl(path, expiresIn);
  if (error) throw error;
  return data.signedUrl;
}

export const liveProvider: DataProvider = {
  kind: 'live',

  alerts: {
    async list() {
      const { data, error } = await supabase
        .from('alerts')
        .select(
          `id, case_id, status, risk_level, rule_triggered, alert_type, description,
           behavioral_red_flags, opened_at, customer_id,
           customers ( id, full_name, bvn, nin, nuban, kyc_tier, risk_score, entity_type )`,
        )
        .order('opened_at', { ascending: false });
      if (error) throw error;
      const rows = data ?? [];
      const ids = Array.from(new Set(rows.map((r) => r.customer_id).filter(Boolean)));
      const byCustomer = new Map<string, Transaction[]>();
      for (const t of await listTransactions(ids)) {
        const list = byCustomer.get(t.customerId!) ?? [];
        const { customerId: _ignored, ...tx } = t;
        list.push(tx);
        byCustomer.set(t.customerId!, list);
      }
      return rows.map((r): Alert => {
        const c = r.customers as {
          full_name: string; bvn: string | null; nin: string | null; nuban: string | null;
          kyc_tier: string | null; risk_score: number | null; entity_type: string | null;
        } | null;
        const customerName = c?.full_name ?? 'Unknown customer';
        const flags = (r.behavioral_red_flags as string[] | null) ?? [];
        return {
          id: r.id,
          caseId: r.case_id,
          status: (r.status as Alert['status']) ?? 'Open',
          riskLevel: (r.risk_level as RiskLevel) ?? 'Medium',
          ruleTriggered: r.rule_triggered,
          timestamp: r.opened_at,
          timeElapsed: timeElapsed(r.opened_at),
          description: r.description ?? '',
          aiDraftedNarrative: draftNarrative({
            case_id: r.case_id, rule_triggered: r.rule_triggered, description: r.description,
            behavioral_red_flags: flags, customerName, bvn: c?.bvn ?? null,
          }),
          customerProfile: {
            fullName: customerName,
            bvn: c?.bvn ?? '—',
            nin: c?.nin ?? '—',
            nuban: c?.nuban ?? '—',
            kycTier: c?.kyc_tier ?? 'Tier 1',
            occupation: c?.entity_type ?? '—',
            registeredAddress: '—',
            riskScore: c?.risk_score ?? 0,
          },
          transactions: byCustomer.get(r.customer_id) ?? [],
          behavioralRedFlags: flags,
          alertType: (r.alert_type as AlertType) ?? 'STANDARD',
        };
      });
    },
  },

  customers: {
    async list() {
      const { data, error } = await supabase.from('customers').select('*').order('full_name');
      if (error) throw error;
      return (data ?? []).map(toCustomer);
    },
    async get(id) {
      const { data, error } = await supabase.from('customers').select('*').eq('id', id).maybeSingle();
      if (error) throw error;
      return data ? toCustomer(data) : null;
    },
  },

  transactions: { listForCustomers: listTransactions },

  str: {
    async generate(alertId) {
      const { data, error } = await supabase.functions.invoke('generate-str-narrative', { body: { alert_id: alertId } });
      if (error) throw error;
      const payload = data as { narrative?: string; draft?: { id?: string } } | null;
      const narrative = payload?.narrative?.trim();
      if (!narrative) throw new Error('No narrative was returned.');
      return { narrative, draftId: payload?.draft?.id ?? null };
    },
    async refine(alertId, currentDraft, message) {
      const { data, error } = await supabase.functions.invoke('refine-str-narrative', {
        body: { alert_id: alertId, current_draft: currentDraft, message },
      });
      if (error) throw error;
      const result = data as { narrative?: string; confirmation?: string; draft?: { id?: string } } | null;
      if (!result?.narrative || !result?.confirmation) throw new Error('The co-pilot returned an incomplete refinement.');
      return { narrative: result.narrative, confirmation: result.confirmation, draftId: result.draft?.id ?? null };
    },
    async saveDraft(alertId, narrative) {
      const { data, error } = await supabase
        .from('str_drafts')
        .insert({ alert_id: alertId, version: 1, narrative, generated_by: 'analyst' })
        .select('id')
        .maybeSingle();
      if (error) throw error;
      return data?.id ?? null;
    },
    async recordExport({ alertId, draftId, filename, xml }) {
      const { data: auth } = await supabase.auth.getUser();
      const { error } = await supabase.from('str_exports').insert({
        alert_id: alertId, str_draft_id: draftId, filename, goaml_xml: xml, exported_by: auth?.user?.id ?? null,
      });
      if (error) throw error;
    },
    async listExports(alertId) {
      const { data, error } = await supabase
        .from('str_exports')
        .select('id, alert_id, str_draft_id, filename, goaml_xml, exported_at')
        .eq('alert_id', alertId)
        .order('exported_at', { ascending: false });
      if (error) throw error;
      return (data ?? []).map((r) => ({
        id: r.id, alertId: r.alert_id, strDraftId: r.str_draft_id, filename: r.filename,
        goamlXml: r.goaml_xml, exportedAt: r.exported_at,
      }));
    },
  },

  ctr: {
    async list() {
      const { data, error } = await supabase.from('ctr_queue').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    async file(row, { reference, xml }) {
      const { data: userData } = await supabase.auth.getUser();
      const now = new Date().toISOString();
      const { error } = await supabase
        .from('ctr_queue')
        .update({
          status: 'filed', ctr_reference: reference, filed_at: now, goaml_xml: xml,
          reviewed_by: userData.user?.id ?? null, reviewed_at: now,
        })
        .eq('id', row.id);
      if (error) throw error;
    },
    subscribe(onChange) {
      const channel = supabase
        .channel('ctr-queue-feed')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'ctr_queue' }, () => onChange())
        .subscribe();
      return () => { void supabase.removeChannel(channel); };
    },
  },

  transactionQueue: {
    async listByIds(ids) {
      if (ids.length === 0) return [];
      const { data, error } = await supabase
        .from('transaction_queue')
        .select(TX_COLUMNS)
        .in('transaction_id', ids)
        .order('transaction_datetime', { ascending: true });
      if (error) throw error;
      return (data ?? []).map((t) => ({ ...t, amount: Number(t.amount) }));
    },
  },

  sanctions: {
    async listMeta() {
      const { data, error } = await supabase
        .from('sanctions_meta')
        .select('list_name,last_refreshed_at,record_count,status,error_message');
      if (error) throw error;
      return (data ?? []) as SanctionsListMeta[];
    },
    async screen(name, threshold) {
      const { data, error } = await supabase.rpc('screen_entity', { search_name: name, threshold });
      if (error) throw error;
      return (data ?? []) as unknown as SanctionsScreenResult[];
    },
    async uploadNfiuList(file) {
      const institutionId = await getCurrentInstitutionId();
      const path = `${institutionId}/${new Date().toISOString().slice(0, 10)}-${file.name}`;
      const { error } = await supabase.storage.from('nfiu-list-uploads').upload(path, file, { upsert: false });
      if (error) throw error;
    },
  },

  adverseMedia: {
    async latest(customerId) {
      const { data, error } = await supabase
        .from('adverse_media_results')
        .select('*')
        .eq('customer_id', customerId)
        .order('search_date', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data
        ? ({ ...data, results: Array.isArray(data.results) ? data.results : [] } as unknown as AdverseMediaScreening)
        : null;
    },
    async latestLevels(customerIds) {
      const { data, error } = await supabase
        .from('adverse_media_results')
        .select('customer_id, overall_risk_level, search_date')
        .in('customer_id', customerIds)
        .order('search_date', { ascending: false });
      if (error) throw error;
      const map: Record<string, AdverseMediaOverall> = {};
      for (const row of data ?? []) {
        if (!(row.customer_id in map)) map[row.customer_id] = (row.overall_risk_level as AdverseMediaOverall) ?? 'None';
      }
      return map;
    },
    async screen(request) {
      const { data, error } = await supabase.functions.invoke('screen-adverse-media', { body: request });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return (data?.screening ?? null) as AdverseMediaScreening | null;
    },
  },

  kycDocuments: {
    async list(customerId) {
      const { data, error } = await supabase
        .from('kyc_documents')
        .select('*')
        .eq('customer_id', customerId)
        .order('uploaded_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as KycDocument[];
    },
    async upload({ file, customerId, documentType, uploadedBy, kycTier, replaceExisting }) {
      const institutionId = await getCurrentInstitutionId();
      const path = `${institutionId}/${customerId}/${documentType}/${Date.now()}-${safeName(file.name)}`;
      const { error: uploadError } = await supabase.storage
        .from(KYC_BUCKET)
        .upload(path, file, { contentType: file.type || undefined, upsert: false });
      if (uploadError) throw uploadError;
      if (replaceExisting) {
        await supabase
          .from('kyc_documents')
          .update({ is_current: false })
          .eq('customer_id', customerId)
          .eq('document_type', documentType)
          .eq('is_current', true);
      }
      const { data, error } = await supabase
        .from('kyc_documents')
        .insert({
          institution_id: institutionId, customer_id: customerId, document_type: documentType,
          document_name: file.name, storage_path: path, file_size_bytes: file.size,
          uploaded_by: uploadedBy, kyc_tier_at_upload: kycTier ?? null,
        })
        .select('*')
        .single();
      if (error) throw error;
      return data as KycDocument;
    },
    async verify(id, verifiedBy) {
      const { data, error } = await supabase
        .from('kyc_documents')
        .update({ verified: true, verified_by: verifiedBy, verified_at: new Date().toISOString() })
        .eq('id', id)
        .select('*')
        .single();
      if (error) throw error;
      return data as KycDocument;
    },
    fileUrl: (doc) => signedUrl(doc.storage_path),
  },

  riskScores: {
    async history(customerId, since) {
      const { data, error } = await supabase
        .from('risk_score_history')
        .select('*')
        .eq('customer_id', customerId)
        .gte('created_at', since.toISOString())
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data ?? []).map((r) => ({
        id: r.id, customerId: r.customer_id, previousScore: r.previous_score, newScore: r.new_score,
        scoreChange: r.score_change, triggerType: r.trigger_type as RiskTriggerType,
        triggerReference: r.trigger_reference, calculatedBy: r.calculated_by, createdAt: r.created_at,
      }));
    },
    async recalculate({ customerId, triggerType, triggerReference, kycTier, customerName, signals }) {
      const { error } = await supabase.functions.invoke('recalculate-risk-score', {
        body: {
          customer_id: customerId,
          trigger_type: triggerType,
          trigger_reference: triggerReference ?? null,
          signals: { kyc_tier: kycTier, customer_name: customerName, ...signals },
        },
      });
      if (error) throw error;
    },
    subscribe(customerId, onChange) {
      const channel = supabase
        .channel(`risk-score-${customerId}`)
        .on('postgres_changes', {
          event: 'INSERT', schema: 'public', table: 'risk_score_history', filter: `customer_id=eq.${customerId}`,
        }, () => onChange())
        .subscribe();
      return () => { void supabase.removeChannel(channel); };
    },
  },

  // These areas have no live backend tables yet; the live workspace shows them empty.
  kyb: { list: async () => [] },
  rules: { list: async () => [] },
  settlementAccounts: { list: async () => [] },
  notifications: { list: async () => [] },

  audit: {
    async load() {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return { entries: [], chains: [], canRead: false };
      const { data: memberships, error: membershipError } = await supabase
        .from('user_institutions')
        .select('institution_id, role')
        .eq('user_id', auth.user.id);
      if (membershipError) throw membershipError;
      const readable = (memberships ?? []).filter((m) => ['compliance_officer', 'institution_admin'].includes(m.role));
      if (readable.length === 0) return { entries: [], chains: [], canRead: false };
      const [log, chains] = await Promise.all([
        supabase
          .from('audit_log')
          .select('id, occurred_at, user_id, user_name, action, resource, justification, status, institution_id')
          .in('institution_id', readable.map((m) => m.institution_id))
          .order('occurred_at', { ascending: false })
          .limit(500),
        Promise.all(readable.map(async (m): Promise<AuditChainResult> => {
          const { data, error } = await supabase.rpc('verify_audit_chain', { institution_id: m.institution_id });
          if (error) throw error;
          const result = data?.[0];
          if (!result) throw new Error('Chain verification returned no result.');
          return { ...result, institutionId: m.institution_id };
        })),
      ]);
      if (log.error) throw log.error;
      const entries: AuditEntry[] = (log.data ?? []).map((row) => ({
        id: row.id,
        timestamp: row.occurred_at,
        action: row.action,
        analyst: row.user_name,
        caseId: row.resource,
        justification: row.justification ?? '',
        status: row.status === 'denied' ? 'denied' : 'success',
        userId: row.user_id,
        institutionId: row.institution_id,
      }));
      return { entries, chains, canRead: true };
    },
    async append(entry) {
      const { data: auth } = await supabase.auth.getUser();
      const user = auth?.user ?? null;
      if (!user) throw new Error('Sign in to record an audit entry');
      const analyst = entry.analyst || (user.user_metadata?.full_name as string | undefined) || user.email || 'Unknown';
      const institutionId = entry.institutionId ?? await getCurrentInstitutionId();
      // No returned row is requested: writers may lack read access.
      const { error } = await supabase.from('audit_log').insert({
        user_id: user.id, institution_id: institutionId, user_name: analyst, action: entry.action,
        resource: entry.caseId, justification: entry.justification, status: entry.status ?? 'success',
      });
      if (error) throw error;
    },
    subscribe(onChange) {
      const channel = supabase
        .channel('audit-log-feed')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'audit_log' }, () => onChange())
        .subscribe();
      const { data: listener } = supabase.auth.onAuthStateChange(() => { setTimeout(onChange, 0); });
      return () => {
        listener.subscription.unsubscribe();
        void supabase.removeChannel(channel);
      };
    },
  },

  platform: {
    async isPlatformStaff() {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return false;
      const { data } = await supabase
        .from('user_roles').select('role').eq('user_id', auth.user.id).eq('role', 'platform_admin').maybeSingle();
      return !!data;
    },
    async changeRole(request) {
      const { data, error } = await supabase.functions.invoke('grant-platform-role', { body: request });
      return { data, error: error ? { message: error.message } : null };
    },
  },
};
