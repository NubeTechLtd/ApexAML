/**
 * Demo provider: the single seed dataset plus the visitor's session state in
 * memory and localStorage. It must never import the backend client or call
 * edge functions.
 */
import { DEMO_REPORTING_ENTITY } from '@/lib/reportingEntity';
import { notifyDemoAudit } from '../demoNotifications';
import { generateNotifications } from '@/hooks/useNotifications';
import { demoId, onCollectionChange, readCollection, wait, writeCollection } from '../demoStore';
import { demoActions, readDemoOverlays } from '../demoDataset';
import {
  DEMO_INSTITUTION, DEMO_ANALYSTS, SEED_ADVERSE_MEDIA, SEED_ALERTS, SEED_AUDIT, SEED_CTRS, SEED_CUSTOMERS, SEED_DOCUMENTS,
  SEED_KYB, SEED_QUEUE, SEED_RISK_HISTORY, SEED_SANCTIONS, SEED_SETTLEMENT, documentLabel,
} from '../seed/dataset';
import { rules as ruleView, transactionsFor, workspaceAlerts } from '../seed/views';
import type {
  AdverseMediaOverall, AdverseMediaScreening, AuditEntry, CustomerRecord, DataProvider, KycDocument,
  RiskScoreEntry, RiskTriggerType, SanctionsListMeta, SanctionsScreenResult, StrDraft, StrExport, TransactionRecord,
} from '../types';

export const DEMO_INSTITUTION_ID = DEMO_INSTITUTION.id;
const DEMO_ANALYST = DEMO_ANALYSTS[0];

const daysAgo = (d: number, h = 10) => {
  const date = new Date();
  date.setDate(date.getDate() - d);
  date.setHours(h, 0, 0, 0);
  return date.toISOString();
};

function seedSanctionsMeta(): SanctionsListMeta[] {
  return [
    { list_name: 'OFAC', last_refreshed_at: daysAgo(0, 2), record_count: 18_412, status: 'success', error_message: null },
    { list_name: 'UN', last_refreshed_at: daysAgo(0, 2), record_count: 1_004, status: 'success', error_message: null },
    { list_name: 'EU', last_refreshed_at: daysAgo(0, 2), record_count: 2_388, status: 'success', error_message: null },
    { list_name: 'NFIU', last_refreshed_at: daysAgo(9), record_count: 214, status: 'success', error_message: null },
  ];
}

const customerRecords = (): CustomerRecord[] => SEED_CUSTOMERS.map((c) => ({
  id: c.ref, fullName: c.fullName, bvn: c.bvn, nin: c.nin, nuban: c.nuban, kycTier: c.kycTier, riskLevel: c.riskLevel,
  riskScore: c.riskScore, accountStatus: readDemoOverlays().accountStatus[c.num] ?? c.accountStatus, bvnVerified: c.bvnVerified, entityType: c.entityType,
}));

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
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
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

/** A one-page PDF stating the document is fictional sample data. */
function samplePdfDataUrl(title: string) {
  const text = `ApexAML sample workspace - fictional document: ${title}`.replace(/[()\\]/g, '');
  const stream = `BT /F1 14 Tf 60 760 Td (${text}) Tj ET`;
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ];
  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [];
  objects.forEach((o, i) => { offsets.push(pdf.length); pdf += `${i + 1} 0 obj\n${o}\nendobj\n`; });
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets.map((o) => `${String(o).padStart(10, '0')} 00000 n \n`).join('')}`;
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return `data:application/pdf;base64,${btoa(pdf)}`;
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

const docs = () => readCollection<KycDocument[]>('kyc_documents', () => SEED_DOCUMENTS);
const auditLog = () => readCollection<AuditEntry[]>('audit_log', () => SEED_AUDIT);
const riskHistory = () => readCollection<RiskScoreEntry[]>('risk_score_history', () => SEED_RISK_HISTORY);
const mediaResults = () => readCollection<AdverseMediaScreening[]>('adverse_media_results', () => SEED_ADVERSE_MEDIA);
const alertById = (id: string) => SEED_ALERTS.find((a) => a.id === id);

/* ── Provider ────────────────────────────────────────── */

export const demoProvider: DataProvider = {
  kind: 'demo',

  alerts: {
    list: async () => workspaceAlerts(readDemoOverlays()),
    async setStatus(alertId, status) {
      if (!alertById(alertId)) throw new Error('This sample case was not found.');
      demoActions.setAlertStatus(alertId, status);
    },
  },

  customers: {
    list: async () => customerRecords(),
    get: async (id) => customerRecords().find((c) => c.id === id || c.bvn === id) ?? null,
  },

  transactions: {
    async listForCustomers(ids) {
      const out: TransactionRecord[] = [];
      for (const c of SEED_CUSTOMERS) {
        if (!ids.includes(c.ref) && !ids.includes(c.bvn)) continue;
        out.push(...transactionsFor(c.num).map(({ customerNum: _n, alertId: _a, flagReason: _f, linkedNum: _l, ...t }) => ({ ...t, customerId: c.ref })));
      }
      return out;
    },
  },

  str: {
    async generate(alertId) {
      const alert = alertById(alertId);
      if (!alert) throw new Error('This sample case was not found.');
      await wait(900);
      const drafts = readCollection<StrDraft[]>('str_drafts', () => []);
      const version = drafts.filter((d) => d.alertId === alertId).length + 1;
      const draft: StrDraft = { id: demoId('draft'), alertId, version, narrative: alert.aiDraftedNarrative, generatedBy: 'sample', createdAt: new Date().toISOString() };
      writeCollection('str_drafts', [...drafts, draft]);
      return { narrative: draft.narrative, draftId: draft.id };
    },
    async refine(alertId, currentDraft, message) {
      const alert = alertById(alertId);
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
      const alert = alertById(alertId);
      if (alert) {
        demoActions.recordStrExport(alertId, {
          customerName: alert.customerProfile.fullName, alertId,
          typology: alert.ruleTriggered, amount: alert.transactions.reduce((s, t) => s + t.amountNGN, 0), analyst: DEMO_ANALYST,
        });
      }
    },
    listExports: async (alertId) => readCollection<StrExport[]>('str_exports', () => []).filter((e) => e.alertId === alertId),
  },

  ctr: {
    list: async () => [...readCollection('ctr_queue', () => SEED_CTRS)].sort((a, b) => b.created_at.localeCompare(a.created_at)),
    async file(row, { reference, xml }) {
      const now = new Date().toISOString();
      const rows = readCollection('ctr_queue', () => SEED_CTRS);
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
      return SEED_QUEUE.filter((t) => wanted.has(t.transaction_id))
        .sort((a, b) => a.transaction_datetime.localeCompare(b.transaction_datetime));
    },
  },

  sanctions: {
    listMeta: async () => readCollection('sanctions_meta', seedSanctionsMeta),
    async screen(name, threshold) {
      await wait(300);
      const results: SanctionsScreenResult[] = [];
      for (const m of SEED_SANCTIONS) {
        const s = m.sanctions;
        const score = Math.max(nameSimilarity(name, s.name), ...s.aliases.map((a) => nameSimilarity(name, a)));
        if (score >= threshold) {
          results.push({
            id: `${m.id}-${s.listId}`, entity_name: s.name, source: s.list, entity_type: 'individual',
            reason: s.reason, list_date: s.dateAdded, aliases: s.aliases, nationality: s.nationality, score,
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
    latest: async (customerId) => [...mediaResults()].filter((r) => r.customer_id === customerId)
      .sort((a, b) => b.search_date.localeCompare(a.search_date))[0] ?? null,
    async latestLevels(ids) {
      const map: Record<string, AdverseMediaOverall> = {};
      for (const r of [...mediaResults()].sort((a, b) => b.search_date.localeCompare(a.search_date))) {
        if (ids.includes(r.customer_id) && !(r.customer_id in map)) map[r.customer_id] = r.overall_risk_level;
      }
      return map;
    },
    async screen(req) {
      await wait(1200);
      const previous = mediaResults().find((r) => r.customer_id === req.customer_id);
      const next = new Date();
      next.setDate(next.getDate() + 90);
      // Re-screening a sample customer returns the same fictional coverage, dated today.
      const screening: AdverseMediaScreening = {
        id: demoId('am'), customer_id: req.customer_id, customer_name: req.customer_name, search_date: new Date().toISOString(),
        results: previous?.results ?? [], overall_risk_level: previous?.overall_risk_level ?? 'None',
        screened_by: DEMO_ANALYST, next_review_date: next.toISOString().slice(0, 10),
      };
      writeCollection('adverse_media_results', [screening, ...mediaResults()]);
      return screening;
    },
  },

  kycDocuments: {
    list: async (customerId) => docs().filter((d) => d.customer_id === customerId).sort((a, b) => b.uploaded_at.localeCompare(a.uploaded_at)),
    async upload({ file, customerId, documentType, uploadedBy, kycTier, replaceExisting }) {
      const path = `${DEMO_INSTITUTION_ID}/${customerId}/${documentType}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
      const url = await fileToDataUrl(file);
      fileUrls.set(path, url);
      // Small files are kept across reloads; larger ones only for this browser session.
      if (url.length < 1_000_000) writeCollection('kyc_files', { ...readCollection<Record<string, string>>('kyc_files', () => ({})), [path]: url });
      let list = docs();
      if (replaceExisting) {
        list = list.map((d) => d.customer_id === customerId && d.document_type === documentType && d.is_current ? { ...d, is_current: false } : d);
      }
      const doc: KycDocument = {
        id: demoId('kyc'), customer_id: customerId, document_type: documentType, document_name: file.name, storage_path: path,
        file_size_bytes: file.size, uploaded_by: uploadedBy, uploaded_at: new Date().toISOString(), kyc_tier_at_upload: kycTier ?? null,
        is_current: true, expiry_date: null, verified: false, verified_by: null, verified_at: null,
      };
      writeCollection('kyc_documents', [doc, ...list]);
      return doc;
    },
    async verify(id, verifiedBy) {
      const list = docs();
      const doc = list.find((d) => d.id === id);
      if (!doc) throw new Error('This sample document was not found.');
      const updated = { ...doc, verified: true, verified_by: verifiedBy, verified_at: new Date().toISOString() };
      writeCollection('kyc_documents', list.map((d) => (d.id === id ? updated : d)));
      return updated;
    },
    async fileUrl(doc) {
      const url = fileUrls.get(doc.storage_path) ?? readCollection<Record<string, string>>('kyc_files', () => ({}))[doc.storage_path];
      if (url) return url;
      if (doc.storage_path.includes('/sample-')) return samplePdfDataUrl(`${documentLabel(doc.document_type)} — ${doc.document_name}`);
      throw new Error('This sample file was only kept for your previous browser session.');
    },
  },

  riskScores: {
    history: async (customerId, since) => riskHistory()
      .filter((r) => r.customerId === customerId && r.createdAt >= since.toISOString())
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    async recalculate({ customerId, triggerType, triggerReference, fallbackScore }) {
      const rows = riskHistory();
      const mine = rows.filter((r) => r.customerId === customerId).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
      const fromCustomer = SEED_CUSTOMERS.find((c) => c.bvn === customerId)?.riskScore;
      const previous = mine.length ? mine[mine.length - 1].newScore : (fallbackScore ?? fromCustomer ?? 50);
      const next = Math.max(0, Math.min(100, previous + RISK_DELTAS[triggerType]));
      writeCollection('risk_score_history', [...rows, {
        id: demoId('risk'), customerId, previousScore: previous, newScore: next, scoreChange: next - previous,
        triggerType, triggerReference: triggerReference ?? null, calculatedBy: 'SYSTEM', createdAt: new Date().toISOString(),
      }]);
    },
    subscribe: (_customerId, fn) => onCollectionChange('risk_score_history', fn),
  },

  kyb: { list: async () => SEED_KYB },
  rules: { list: async () => ruleView(readDemoOverlays()) },
  settlementAccounts: { list: async () => SEED_SETTLEMENT },
  notifications: { list: async () => generateNotifications() },

  audit: {
    async load() {
      const entries = auditLog();
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
      writeCollection('audit_log', [{
        ...entry,
        id: demoId('audit'),
        timestamp: new Date().toISOString(),
        analyst: entry.analyst && !entry.analyst.startsWith('mock-') ? entry.analyst : DEMO_ANALYST,
        status: entry.status ?? 'success',
        institutionId: DEMO_INSTITUTION_ID,
      }, ...auditLog()]);
      if (entry.status !== 'denied') notifyDemoAudit(entry.action, entry.justification);
    },
    subscribe: (fn) => onCollectionChange('audit_log', fn),
  },

  institutionProfile: {
    get: async () => ({ institutionId: DEMO_INSTITUTION_ID, profile: DEMO_REPORTING_ENTITY, canEdit: false }),
    save: async () => { throw new Error('The institution profile cannot be edited in the sample workspace.'); },
  },

  platform: {
    isPlatformStaff: async () => false,
    changeRole: async () => ({ data: null, error: { message: 'Platform roles cannot be changed in the sample workspace.' } }),
  },
};
