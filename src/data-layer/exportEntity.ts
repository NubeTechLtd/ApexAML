import {
  DEMO_EXPORT_LABEL, DEMO_REPORTING_ENTITY, LIVE_EXPORT_LABEL, missingProfileFields, type ReportingEntity,
} from '@/lib/reportingEntity';
import type { DataProvider } from './types';

export type ExportEntityResult =
  | { ok: true; entity: ReportingEntity; label: string; institutionId: string | null }
  | { ok: false; missing: string[] };

/**
 * Resolves the reporting institution for an STR/CTR export.
 * Demo always uses fixed DEMO values; live requires a complete profile.
 */
export async function resolveExportEntity(provider: DataProvider): Promise<ExportEntityResult> {
  if (provider.kind === 'demo') {
    return { ok: true, entity: DEMO_REPORTING_ENTITY, label: DEMO_EXPORT_LABEL, institutionId: null };
  }
  const { profile, institutionId } = await provider.institutionProfile.get();
  const missing = missingProfileFields(profile);
  if (!profile || missing.length) return { ok: false, missing };
  return { ok: true, entity: profile, label: LIVE_EXPORT_LABEL, institutionId };
}

export function missingFieldsMessage(missing: string[]): string {
  return `Export blocked. Complete the institution profile at /app/settings first. Missing: ${missing.join(', ')}.`;
}
