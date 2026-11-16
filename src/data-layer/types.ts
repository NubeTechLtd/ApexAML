/**
 * Shared record shapes for every operational data area. Both providers
 * (demo: in-memory + localStorage, live: the backend) return these shapes,
 * so pages never depend on where the data came from.
 */
import type { Database } from '@/integrations/supabase/types';
import type { Alert, Transaction } from '@/data/models/alerts';
import type { CorporateEntity } from '@/data/models/kyb';
import type { ManagedAccount } from '@/data/models/settlement';
import type { Rule } from '@/components/RulesTable';
import type { AppNotification } from '@/hooks/useNotifications';

import type { ReportingEntity } from '@/lib/reportingEntity';
import type { AlertCsvRow } from '@/lib/alertsCsv';

export interface AlertCsvImportResult { imported: number; customersCreated: number }

export interface InstitutionProfileSnapshot {
  institutionId: string | null;
  profile: ReportingEntity | null;
  canEdit: boolean;
}

export type ProviderKind = 'demo' | 'live';

/* ── Alerts, customers, transactions ─────────────────── */
export type AlertRecord = Alert;
export type TransactionRecord = Transaction & { customerId?: string };

export interface CustomerRecord {
  id: string;
  fullName: string;
  bvn: string | null;
  nin: string | null;
  nuban: string | null;
  kycTier: string;
  riskLevel: string;
  riskScore: number;
  accountStatus: string;
  bvnVerified: boolean;
  entityType: string | null;
}

/* ── STR drafts and exports ──────────────────────────── */
export interface StrDraft {
  id: string;
  alertId: string;
  version: number;
  narrative: string;
  /** Live: 'ai' (model output) or 'analyst_edit'. Demo uses its own sample labels. */
  generatedBy: string;
  createdAt: string;
  /** Live AI provenance; null/absent for analyst edits and demo drafts. */
  provider?: string | null;
  model?: string | null;
  promptVersion?: string | null;
  inputHash?: string | null;
  createdBy?: string | null;
  authorName?: string | null;
}

export interface StrExport {
  id: string;
  alertId: string;
  strDraftId: string;
  filename: string;
  goamlXml: string;
  exportedAt: string;
}

/** Demo only: 'live_ai' = model output on synthetic data, 'sample' = pre-written fallback. */
export type StrOutputSource = 'live_ai' | 'sample';
/** limitReached: demo only — 'session' (per-session/per-IP cap) or 'capacity' (global daily cap or kill switch); a sample was used instead. */
export type StrLimit = false | 'session' | 'capacity';
export interface StrGenerateResult { narrative: string; draftId: string | null; source?: StrOutputSource; limitReached?: StrLimit }
export interface StrRefineResult { narrative: string; confirmation: string; draftId: string | null; source?: StrOutputSource; limitReached?: StrLimit }

/* ── CTRs and transaction queue ──────────────────────── */
export type CtrRecord = Database['public']['Tables']['ctr_queue']['Row'];

export interface QueuedTransaction {
  transaction_id: string;
  amount: number;
  channel: string;
  transaction_datetime: string;
  counterparty_account: string | null;
  narration: string | null;
  direction: string;
}

export interface CtrFiling {
  reference: string;
  xml: string;
}

/* ── Sanctions screening ─────────────────────────────── */
export type SanctionsListName = 'OFAC' | 'UN' | 'EU' | 'NFIU';

export interface SanctionsListMeta {
  list_name: SanctionsListName;
  last_refreshed_at: string | null;
  record_count: number;
  status: 'success' | 'failed' | 'pending';
  error_message: string | null;
}

export interface SanctionsScreenResult {
  id: string;
  entity_name: string;
  source: string;
  entity_type: string | null;
  reason: string | null;
  list_date: string | null;
  aliases: string[] | null;
  nationality: string | null;
  score: number;
}

/* ── Adverse media ───────────────────────────────────── */
export type AdverseMediaRisk = 'High' | 'Medium' | 'Low';
export type AdverseMediaOverall = AdverseMediaRisk | 'None';

export interface AdverseMediaItem {
  source: string;
  headline: string;
  url: string;
  published_at: string | null;
  relevance_score: number;
  risk_level: AdverseMediaRisk;
  rationale?: string;
}

export interface AdverseMediaScreening {
  id: string;
  customer_id: string;
  customer_name: string;
  search_date: string;
  results: AdverseMediaItem[];
  overall_risk_level: AdverseMediaOverall;
  screened_by: string;
  next_review_date: string;
}

export interface AdverseMediaRequest {
  customer_id: string;
  customer_name: string;
  bvn: string | null;
  institution_name: string | null;
}

/* ── KYC documents ───────────────────────────────────── */
export interface KycDocument {
  id: string;
  customer_id: string;
  document_type: string;
  document_name: string;
  storage_path: string;
  file_size_bytes: number | null;
  uploaded_by: string;
  uploaded_at: string;
  kyc_tier_at_upload: string | null;
  is_current: boolean;
  expiry_date: string | null;
  verified: boolean;
  verified_by: string | null;
  verified_at: string | null;
}

export interface KycUploadParams {
  file: File;
  customerId: string;
  documentType: string;
  uploadedBy: string;
  kycTier?: string | null;
  replaceExisting?: boolean;
}

/* ── Risk score history ──────────────────────────────── */
export type RiskTriggerType =
  | 'ALERT_FIRED'
  | 'ALERT_DISMISSED'
  | 'STR_FILED'
  | 'KYC_UPGRADE'
  | 'SANCTIONS_MATCH'
  | 'CLEAN_PERIOD_30D'
  | 'MANUAL_REVIEW';

export interface RiskScoreEntry {
  id: string;
  customerId: string;
  previousScore: number | null;
  newScore: number;
  scoreChange: number | null;
  triggerType: RiskTriggerType;
  triggerReference: string | null;
  calculatedBy: string;
  createdAt: string;
}

export interface RiskRecalculationRequest {
  customerId: string;
  triggerType: RiskTriggerType;
  triggerReference?: string | null;
  kycTier?: string;
  customerName?: string;
  /** Score to start from when there is no history yet (demo only). */
  fallbackScore?: number;
  signals?: Record<string, unknown>;
}

/* ── KYB, rules, settlement accounts, notifications ──── */
export type KybCase = CorporateEntity;
export type RuleRecord = Rule;
export type SettlementAccount = ManagedAccount;
export type NotificationRecord = AppNotification;

/* ── Audit ───────────────────────────────────────────── */
export interface AuditEntry {
  id?: string;
  timestamp: string;
  action: string;
  analyst: string;
  caseId: string;
  justification: string;
  status?: 'success' | 'denied';
  userId?: string | null;
  institutionId?: string;
  metadata?: Record<string, unknown>;
}

export interface AuditChainResult {
  institutionId: string;
  is_valid: boolean;
  checked_entries: number;
  break_at: number | null;
  reason: string | null;
}

export interface AuditSnapshot {
  entries: AuditEntry[];
  chains: AuditChainResult[];
  canRead: boolean;
}

/* ── Institution settings (live) ─────────────────────── */
export interface InstitutionSettings {
  /** Institution consent for AI STR drafting; off by default in live. */
  aiDraftingEnabled: boolean;
  /** Weekly adverse-media re-screen; off by default. */
  adverseMediaRescreenEnabled: boolean;
  /** Nightly risk-score sweep; off by default. */
  riskSweepEnabled: boolean;
  /** Institution is marked as holding sample data, so scheduled jobs never run for it. */
  sampleData: boolean;
  /** True only for the institution's institution_admin. */
  canEdit: boolean;
}

export type ScheduledJobKey = 'adverse_media_rescreen' | 'risk_sweep';

/* ── Platform roles ──────────────────────────────────── */
export interface PlatformRoleChangeRequest {
  email: string;
  action: 'grant' | 'revoke';
  justification: string;
}

/* ── Provider contract ───────────────────────────────── */
type Unsubscribe = () => void;

export interface DataProvider {
  kind: ProviderKind;
  alerts: {
    list(): Promise<AlertRecord[]>;
    setStatus(alertId: string, status: AlertRecord['status']): Promise<void>;
    /** Live only: imports CSV cases into the caller's institution, all-or-nothing, with one audit entry. */
    importCsv?(rows: AlertCsvRow[], fileName: string): Promise<AlertCsvImportResult>;
  };
  customers: { list(): Promise<CustomerRecord[]>; get(id: string): Promise<CustomerRecord | null> };
  transactions: { listForCustomers(customerIds: string[]): Promise<TransactionRecord[]> };
  str: {
    generate(alertId: string): Promise<StrGenerateResult>;
    refine(alertId: string, currentDraft: string, message: string): Promise<StrRefineResult>;
    /** Saves the analyst's text as a new version ('analyst_edit' in live). */
    saveDraft(alertId: string, narrative: string): Promise<string | null>;
    /** All saved versions for an alert, oldest first. */
    listDrafts(alertId: string): Promise<StrDraft[]>;
    recordExport(params: { alertId: string; draftId: string; filename: string; xml: string }): Promise<void>;
    listExports(alertId: string): Promise<StrExport[]>;
  };
  ctr: {
    list(): Promise<CtrRecord[]>;
    file(row: CtrRecord, filing: CtrFiling): Promise<void>;
    subscribe(onChange: () => void): Unsubscribe;
  };
  transactionQueue: { listByIds(ids: string[]): Promise<QueuedTransaction[]> };
  sanctions: {
    listMeta(): Promise<SanctionsListMeta[]>;
    screen(name: string, threshold: number): Promise<SanctionsScreenResult[]>;
    uploadNfiuList(file: File): Promise<void>;
  };
  adverseMedia: {
    latest(customerId: string): Promise<AdverseMediaScreening | null>;
    latestLevels(customerIds: string[]): Promise<Record<string, AdverseMediaOverall>>;
    screen(request: AdverseMediaRequest): Promise<AdverseMediaScreening | null>;
  };
  kycDocuments: {
    list(customerId: string): Promise<KycDocument[]>;
    upload(params: KycUploadParams): Promise<KycDocument>;
    verify(id: string, verifiedBy: string): Promise<KycDocument>;
    fileUrl(doc: KycDocument): Promise<string>;
  };
  riskScores: {
    history(customerId: string, since: Date): Promise<RiskScoreEntry[]>;
    recalculate(request: RiskRecalculationRequest): Promise<void>;
    subscribe(customerId: string, onChange: () => void): Unsubscribe;
  };
  kyb: { list(): Promise<KybCase[]> };
  rules: { list(): Promise<RuleRecord[]> };
  settlementAccounts: { list(): Promise<SettlementAccount[]> };
  notifications: { list(): Promise<NotificationRecord[]> };
  audit: {
    load(): Promise<AuditSnapshot>;
    append(entry: Omit<AuditEntry, 'timestamp'>): Promise<void>;
    subscribe(onChange: () => void): Unsubscribe;
  };
  institutionProfile: {
    /** Profile for the caller's institution, plus whether the caller may edit it. */
    get(): Promise<InstitutionProfileSnapshot>;
    save(entity: Omit<ReportingEntity, 'version'>): Promise<number>;
  };
  institutionSettings: {
    get(): Promise<InstitutionSettings>;
    /** institution_admin only; writes an audit entry with the justification. */
    setAiDrafting(enabled: boolean, justification: string): Promise<void>;
    /** institution_admin only; writes an audit entry with the justification. */
    setScheduledJob(job: ScheduledJobKey, enabled: boolean, justification: string): Promise<void>;
  };
  platform: {
    isPlatformStaff(): Promise<boolean>;
    changeRole(request: PlatformRoleChangeRequest): Promise<{ data: unknown; error: { message: string } | null }>;
  };
}
