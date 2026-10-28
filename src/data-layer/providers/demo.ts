/**
 * Demo provider: sample data held in memory and the visitor's localStorage.
 * It must never import the backend client or call edge functions.
 */
import { mockAlerts } from '@/data/models/alerts';
import { mockCorporateEntities } from '@/data/models/kyb';
import { mockSettlementAccounts } from '@/data/models/settlement';
import { mockSanctionsMatches } from '@/data/models/sanctions';
import { mockRules } from '@/components/RulesTable';
import { generateNotifications } from '@/hooks/useNotifications';
import { demoId, onCollectionChange, readCollection, wait, writeCollection } from '../demoStore';
import type {
  AdverseMediaOverall, AdverseMediaScreening, AuditEntry, CtrRecord, CustomerRecord, DataProvider,
  KycDocument, QueuedTransaction, RiskScoreEntry, RiskTriggerType, SanctionsListMeta,
  SanctionsScreenResult, StrDraft, StrExport, TransactionRecord,
} from '../types';

export const DEMO_INSTITUTION_ID = 'demo-institution';
const DEMO_ANALYST = 'Demo analyst';

/* ── Seeds ───────────────────────────────────────────── */

const daysAgo = (d: number, h = 10) => {
  const date = new Date();
  date.setDate(date.getDate() - d);
  date.setHours(h, 0, 0, 0);
  return date.toISOString();
};

function seedQueue(): QueuedTransaction[] {
  const rows: QueuedTransaction[] = [];
  const add = (prefix: string, count: number, base: number, day: number) => {
    for (let i = 0; i < count; i++) {
      rows.push({
        transaction_id: `${prefix}-${i + 1}`,
        amount: base + i * 115_000,
        channel: i % 2 ? 'Branch Cash' : 'Agent Cash',
        transaction_datetime: daysAgo(day, 9 + i),
        counterparty_account: null,
        narration: 'Cash deposit',
        direction: 'credit',
      });
    }
  };
  add('DEMO-TXQ-A', 4, 1_450_000, 0);
  add('DEMO-TXQ-B', 3, 2_100_000, 2);
  add('DEMO-TXQ-C', 2, 3_000_000, 6);
  return rows;
}

function seedCtrs(): CtrRecord[] {
  const queue = seedQueue();
  const group = (p: string) => queue.filter((t) => t.transaction_id.startsWith(p));
  const make = (id: string, p: string, customerId: string, name: string, day: number, filed?: string): CtrRecord => {
    const txns = group(p);
    return {
      id,
      institution_id: DEMO_INSTITUTION_ID,
      customer_id: customerId,
      customer_name: name,
      report_date: daysAgo(day).slice(0, 10),
      total_cash_ngn: txns.reduce((s, t) => s + t.amount, 0),
      transaction_count: txns.length,
      transaction_ids: txns.map((t) => t.transaction_id),
      status: filed ? 'filed' : 'pending_review',
      reviewed_by: null,
      reviewed_at: filed ? daysAgo(day - 1) : null,
      ctr_reference: filed ?? null,
      filed_at: filed ? daysAgo(day - 1) : null,
      goaml_xml: null,
      created_at: daysAgo(day, 23),
      updated_at: daysAgo(day, 23),
    };
  };
  return [
    make('demo-ctr-1', 'DEMO-TXQ-A', '22198765432', 'Adebayo Ogunlesi', 0),
    make('demo-ctr-2', 'DEMO-TXQ-B', '22345678905', 'Ibrahim Musa', 2),
    make('demo-ctr-3', 'DEMO-TXQ-C', '22456789013', 'Chinwe Eze', 6, 'CTR-DEMO-0001'),
  ];
}

function seedSanctionsMeta(): SanctionsListMeta[] {
  return [
    { list_name: 'OFAC', last_refreshed_at: daysAgo(0, 2), record_count: 18_412, status: 'success', error_message: null },
    { list_name: 'UN', last_refreshed_at: daysAgo(0, 2), record_count: 1_004, status: 'success', error_message: null },
    { list_name: 'EU', last_refreshed_at: daysAgo(0, 2), record_count: 2_388, status: 'success', error_message: null },
    { list_name: 'NFIU', last_refreshed_at: daysAgo(9), record_count: 214, status: 'success', error_message: null },
  ];
}

function seedAudit(): AuditEntry[] {
  return [
    { id: 'demo-audit-3', timestamp: daysAgo(0, 8), action: 'NFIU_ESCALATION', analyst: 'Chioma Adeyemi', caseId: 'CAS-2026-DEMO-001-NG', justification: 'Structured POS withdrawals below the reporting threshold across 12 agents; escalated for STR filing.', status: 'success', institutionId: DEMO_INSTITUTION_ID },
    { id: 'demo-audit-2', timestamp: daysAgo(1, 15), action: 'DOCUMENT_VERIFY', analyst: 'Ibrahim Musa', caseId: '22345678905', justification: 'NIN_SLIP verified (nin-slip.pdf)', status: 'success', institutionId: DEMO_INSTITUTION_ID },
    { id: 'demo-audit-1', timestamp: daysAgo(2, 11), action: 'ACCOUNT_FREEZE', analyst: 'Ngozi Okafor', caseId: 'CAS-2026-0412-NG', justification: 'Freeze pending EDD: inbound volume inconsistent with declared occupation and Tier 1 limits.', status: 'success', institutionId: DEMO_INSTITUTION_ID },
  ];
}

/* ── Helpers ─────────────────────────────────────────── */

const alertsById = () => new Map(mockAlerts.map((a) => [a.id, a]));

function demoCustomers(): CustomerRecord[] {
  const seen = new Map<string, CustomerRecord>();
  for (const a of mockAlerts) {
    const p = a.customerProfile;
    const id = p.bvn && p.bvn !== '—' ? p.bvn : a.id;
    if (seen.has(id)) continue;
    seen.set(id, {
      id, fullName: p.fullName, bvn: p.bvn, nin: p.nin, nuban: p.nuban, kycTier: p.kycTier,
      riskLevel: a.riskLevel, riskScore: p.riskScore, accountStatus: 'Active',
      bvnVerified: /^\d{11}$/.test(p.bvn), entityType: p.occupation,
    });
  }
  return Array.from(seen.values());
}

function bigrams(s: string) {
  const t = ` ${s.toLowerCase().replace(/[^a-z0-9 ]/g, '')} `;
  const out: string[] = [];
  for (let i = 0; i < t.length - 1; i++) out.push(t.slice(i, i + 2));
  return out;
}

/** Dice similarity on character pairs — a simple stand-in for trigram matching. */
export function nameSimilarity(a: string, b: string) {
  const x = bigrams(a);
  const y = bigrams(b);
  if (!x.length || !y.length) return 0;
  const pool = [...y];
  let hits = 0;
  for (const g of x) {
    const i = pool.indexOf(g);
    if (i >= 0) { hits++; pool.splice(i, 1); }
  }
  return (2 * hits) / (x.length + y.length);
}

async function sha256(text: string) {
  const bytes = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

const RISK_DELTAS: Record<RiskTriggerType, number> = {
  ALERT_FIRED: 8, STR_FILED: 10, SANCTIONS_MATCH: 15, ALERT_DISMISSED: -5,
  KYC_UPGRADE: -4, CLEAN_PERIOD_30D: -6, MANUAL_REVIEW: 0,
};

/** Applies the analyst's request to the draft for real, and says so only when it did. */
export function refineDemoDraft(draft: string, message: string, flags: string[]) {
  const l = message.toLowerCase();
  if (l.includes('short') || l.includes('concise')) {
    const sentences = draft.split(/(?<=\.)\s+/);
    if (sentences.length <= 3) return { narrative: draft, confirmation: 'The draft is already three sentences or fewer, so nothing was removed. The draft is unchanged.', changed: false };
    return { narrative: sentences.slice(0, 3).join(' '), confirmation: `Done — the narrative now keeps its first three sentences (${sentences.length - 3} removed). Review it in the editor.`, changed: true };
  }
  if (l.includes('flag')) {
    if (!flags.length) return { narrative: draft, confirmation: 'This case has no recorded red flags to append. The draft is unchanged.', changed: false };
    const appendix = `\n\nBehavioural red flags:\n${flags.map((f, i) => `${i + 1}. ${f}`).join('\n')}`;
    return { narrative: draft + appendix, confirmation: `Done — appended ${flags.length} red flags as a numbered list.`, changed: true };
  }
  if (l.includes('fatf') || l.includes('recommendation')) {
    return { narrative: `${draft}\n\nThis report is filed in line with FATF Recommendation 20 on suspicious transaction reporting.`, confirmation: 'Done — added a closing reference to FATF Recommendation 20.', changed: true };
  }
  if (l.includes('circular') || l.includes('bsd/dir')) {
    return { narrative: `${draft}\n\nRegulatory basis: CBN Circular BSD/DIR/PUB/LAB/019/002.`, confirmation: 'Done — added a regulatory basis line citing CBN Circular BSD/DIR/PUB/LAB/019/002.', changed: true };
  }
  return {
    narrative: draft,
    confirmation: 'The sample workspace can shorten the draft, append red flags, or cite FATF Recommendation 20 or the CBN circular. That request is not available here, so the draft is unchanged.',
    changed: false,
  };
}

/* ── In-session file contents for sample KYC uploads ─── */
const fileUrls = new Map<string, string>();

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

/* ── Provider ────────────────────────────────────────── */

export const demoProvider: DataProvider = {
  kind: 'demo',

  alerts: { list: async () => mockAlerts },

  customers: {
    list: async () => demoCustomers(),
    get: async (id) => demoCustomers().find((c) => c.id === id) ?? null,
  },

  transactions: {
    async listForCustomers(ids) {
      const wanted = new Set(ids);
      const out: TransactionRecord[] = [];
      for (const c of demoCustomers()) {
        if (!wanted.has(c.id)) continue;
        for (const a of mockAlerts) if (a.customerProfile.bvn === c.bvn) out.push(...a.transactions.map((t) => ({ ...t, customerId: c.id })));
      }
      return out;
    },
  },

  str: {
    async generate(alertId) {
      const alert = alertsById().get(alertId);
      if (!alert) throw new Error('This sample case was not found.');
      await wait(900);
      const drafts = readCollection<StrDraft[]>('str_drafts', () => []);
      const version = drafts.filter((d) => d.alertId === alertId).length + 1;
      const draft: StrDraft = { id: demoId('draft'), alertId, version, narrative: alert.aiDraftedNarrative, generatedBy: 'sample', createdAt: new Date().toISOString() };
      writeCollection('str_drafts', [...drafts, draft]);
      return { narrative: draft.narrative, draftId: draft.id };
    },
    async refine(alertId, currentDraft, message) {
      const alert = alertsById().get(alertId);
      await wait(600);
      const result = refineDemoDraft(currentDraft, message, alert?.behavioralRedFlags ?? []);
      if (!result.changed) return { narrative: currentDraft, confirmation: result.confirmation, draftId: null };
      const drafts = readCollection<StrDraft[]>('str_drafts', () => []);
      const version = drafts.filter((d) => d.alertId === alertId).length + 1;
      const draft: StrDraft = { id: demoId('draft'), alertId, version, narrative: result.narrative, generatedBy: 'sample-refine', createdAt: new Date().toISOString() };
      writeCollection('str_drafts', [...drafts, draft]);
      return { narrative: result.narrative, confirmation: result.confirmation, draftId: draft.id };
    },
    async saveDraft(alertId, narrative) {
      const drafts = readCollection<StrDraft[]>('str_drafts', () => []);
      const draft: StrDraft = { id: demoId('draft'), alertId, version: 1, narrative, generatedBy: 'analyst', createdAt: new Date().toISOString() };
      writeCollection('str_drafts', [...drafts, draft]);
      return draft.id;
    },
    async recordExport({ alertId, draftId, filename, xml }) {
      const exports = readCollection<StrExport[]>('str_exports', () => []);
      writeCollection('str_exports', [{ id: demoId('export'), alertId, strDraftId: draftId, filename, goamlXml: xml, exportedAt: new Date().toISOString() }, ...exports]);
    },
    listExports: async (alertId) => readCollection<StrExport[]>('str_exports', () => []).filter((e) => e.alertId === alertId),
  },

  ctr: {
    list: async () => [...readCollection('ctr_queue', seedCtrs)].sort((a, b) => b.created_at.localeCompare(a.created_at)),
    async file(row, { reference, xml }) {
      const now = new Date().toISOString();
      const rows = readCollection('ctr_queue', seedCtrs);
      if (!rows.some((r) => r.id === row.id)) throw new Error('This sample CTR was not found.');
      writeCollection('ctr_queue', rows.map((r) => r.id === row.id
        ? { ...r, status: 'filed', ctr_reference: reference, filed_at: now, goaml_xml: xml, reviewed_by: null, reviewed_at: now, updated_at: now }
        : r));
    },
    subscribe: (fn) => onCollectionChange('ctr_queue', fn),
  },

  transactionQueue: {
    async listByIds(ids) {
      const wanted = new Set(ids);
      return readCollection('transaction_queue', seedQueue)
        .filter((t) => wanted.has(t.transaction_id))
        .sort((a, b) => a.transaction_datetime.localeCompare(b.transaction_datetime));
    },
  },

  sanctions: {
    listMeta: async () => readCollection('sanctions_meta', seedSanctionsMeta),
    async screen(name, threshold) {
      await wait(300);
      const results: SanctionsScreenResult[] = [];
      for (const m of mockSanctionsMatches) {
        const s = m.sanctions;
        const score = Math.max(nameSimilarity(name, s.name), ...s.aliases.map((a) => nameSimilarity(name, a)));
        if (score >= threshold) {
          results.push({
            id: `${m.id}-${s.listId}`, entity_name: s.name, source: s.list, entity_type: 'individual',
            reason: s.reason, list_date: null, aliases: s.aliases, nationality: s.nationality, score,
          });
        }
      }
      return results.sort((a, b) => b.score - a.score);
    },
    async uploadNfiuList(file) {
      const uploads = readCollection<{ name: string; size: number; uploadedAt: string }[]>('nfiu_uploads', () => []);
      writeCollection('nfiu_uploads', [...uploads, { name: file.name, size: file.size, uploadedAt: new Date().toISOString() }]);
    },
  },

  adverseMedia: {
    async latest(customerId) {
      const rows = readCollection<AdverseMediaScreening[]>('adverse_media_results', () => []);
      return rows.filter((r) => r.customer_id === customerId).sort((a, b) => b.search_date.localeCompare(a.search_date))[0] ?? null;
    },
    async latestLevels(ids) {
      const map: Record<string, AdverseMediaOverall> = {};
      const rows = [...readCollection<AdverseMediaScreening[]>('adverse_media_results', () => [])]
        .sort((a, b) => b.search_date.localeCompare(a.search_date));
      for (const r of rows) if (ids.includes(r.customer_id) && !(r.customer_id in map)) map[r.customer_id] = r.overall_risk_level;
      return map;
    },
    async screen(req) {
      await wait(1200);
      const next = new Date();
      next.setDate(next.getDate() + 90);
      const screening: AdverseMediaScreening = {
        id: demoId('am'),
        customer_id: req.customer_id,
        customer_name: req.customer_name,
        search_date: new Date().toISOString(),
        results: [],
        overall_risk_level: 'None',
        screened_by: DEMO_ANALYST,
        next_review_date: next.toISOString().slice(0, 10),
      };
      const rows = readCollection<AdverseMediaScreening[]>('adverse_media_results', () => []);
      writeCollection('adverse_media_results', [screening, ...rows]);
      return screening;
    },
  },

  kycDocuments: {
    list: async (customerId) => readCollection<KycDocument[]>('kyc_documents', () => [])
      .filter((d) => d.customer_id === customerId)
      .sort((a, b) => b.uploaded_at.localeCompare(a.uploaded_at)),
    async upload({ file, customerId, documentType, uploadedBy, kycTier, replaceExisting }) {
      const id = demoId('kyc');
      const path = `${DEMO_INSTITUTION_ID}/${customerId}/${documentType}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
      const url = await fileToDataUrl(file);
      fileUrls.set(path, url);
      // Small files are kept across reloads; larger ones only for this session.
      if (url.length < 1_000_000) {
        const files = readCollection<Record<string, string>>('kyc_files', () => ({}));
        writeCollection('kyc_files', { ...files, [path]: url });
      }
      const now = new Date().toISOString();
      let docs = readCollection<KycDocument[]>('kyc_documents', () => []);
      if (replaceExisting) {
        docs = docs.map((d) => d.customer_id === customerId && d.document_type === documentType && d.is_current ? { ...d, is_current: false } : d);
      }
      const doc: KycDocument = {
        id, customer_id: customerId, document_type: documentType, document_name: file.name, storage_path: path,
        file_size_bytes: file.size, uploaded_by: uploadedBy, uploaded_at: now, kyc_tier_at_upload: kycTier ?? null,
        is_current: true, expiry_date: null, verified: false, verified_by: null, verified_at: null,
      };
      writeCollection('kyc_documents', [doc, ...docs]);
      return doc;
    },
    async verify(id, verifiedBy) {
      const docs = readCollection<KycDocument[]>('kyc_documents', () => []);
      const doc = docs.find((d) => d.id === id);
      if (!doc) throw new Error('This sample document was not found.');
      const updated = { ...doc, verified: true, verified_by: verifiedBy, verified_at: new Date().toISOString() };
      writeCollection('kyc_documents', docs.map((d) => (d.id === id ? updated : d)));
      return updated;
    },
    async fileUrl(doc) {
      const url = fileUrls.get(doc.storage_path) ?? readCollection<Record<string, string>>('kyc_files', () => ({}))[doc.storage_path];
      if (!url) throw new Error('This sample file was only kept for your previous browser session.');
      return url;
    },
  },

  riskScores: {
    history: async (customerId, since) => readCollection<RiskScoreEntry[]>('risk_score_history', () => [])
      .filter((r) => r.customerId === customerId && r.createdAt >= since.toISOString())
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    async recalculate({ customerId, triggerType, triggerReference, fallbackScore }) {
      const rows = readCollection<RiskScoreEntry[]>('risk_score_history', () => []);
      const mine = rows.filter((r) => r.customerId === customerId);
      const fromCustomer = demoCustomers().find((c) => c.id === customerId)?.riskScore;
      const previous = mine.length ? mine[mine.length - 1].newScore : (fallbackScore ?? fromCustomer ?? 50);
      const next = Math.max(0, Math.min(100, previous + RISK_DELTAS[triggerType]));
      writeCollection('risk_score_history', [...rows, {
        id: demoId('risk'), customerId, previousScore: previous, newScore: next, scoreChange: next - previous,
        triggerType, triggerReference: triggerReference ?? null, calculatedBy: 'SYSTEM', createdAt: new Date().toISOString(),
      }]);
    },
    subscribe: (_customerId, fn) => onCollectionChange('risk_score_history', fn),
  },

  kyb: { list: async () => mockCorporateEntities },
  rules: { list: async () => mockRules },
  settlementAccounts: { list: async () => mockSettlementAccounts },
  notifications: { list: async () => generateNotifications() },

  audit: {
    async load() {
      const entries = readCollection('audit_log', seedAudit);
      // Recompute the sample chain oldest-first so the indicator reflects these entries.
      let prev = '0'.repeat(64);
      for (const e of [...entries].reverse()) {
        prev = await sha256(`${prev}|${e.timestamp}|${e.action}|${e.analyst}|${e.caseId}|${e.justification}`);
      }
      return {
        entries,
        canRead: true,
        chains: [{ institutionId: DEMO_INSTITUTION_ID, is_valid: true, checked_entries: entries.length, break_at: null, reason: null }],
      };
    },
    async append(entry) {
      const entries = readCollection('audit_log', seedAudit);
      writeCollection('audit_log', [{
        ...entry,
        id: demoId('audit'),
        timestamp: new Date().toISOString(),
        analyst: entry.analyst || DEMO_ANALYST,
        status: entry.status ?? 'success',
        institutionId: DEMO_INSTITUTION_ID,
      }, ...entries]);
    },
    subscribe: (fn) => onCollectionChange('audit_log', fn),
  },

  platform: {
    isPlatformStaff: async () => false,
    changeRole: async () => ({ data: null, error: { message: 'Platform roles cannot be changed in the sample workspace.' } }),
  },
};
