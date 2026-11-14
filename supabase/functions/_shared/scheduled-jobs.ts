// Shared plumbing for the scheduled live-zone jobs (rescreen-adverse-media, risk-score-sweep).
import { createHash, timingSafeEqual } from 'node:crypto';
import { authenticateCronRequest } from './cron-auth.ts';

export type JobSetting = 'adverse_media_rescreen_enabled' | 'risk_sweep_enabled';
export type RunOutcome = 'success' | 'partial' | 'failed' | 'skipped_setting_off';

const digest = (value: string) => createHash('sha256').update(value, 'utf8').digest();

/**
 * Every scheduled call must carry a secret header. Manual/ops calls send
 * `x-cron-secret`, compared with CRON_SECRET. The platform scheduler cannot send
 * custom headers, so it authenticates with its managed bearer secret instead
 * (checked by the generated cron-auth helper). Anything else is rejected.
 */
export function authenticateScheduledCall(req: Request): Response | null {
  const provided = req.headers.get('x-cron-secret');
  if (provided !== null) {
    const expected = Deno.env.get('CRON_SECRET');
    if (!expected) return new Response('Server configuration error', { status: 500 });
    return timingSafeEqual(digest(provided), digest(expected)) ? null : new Response('Unauthorized', { status: 401 });
  }
  return authenticateCronRequest(req);
}

// deno-lint-ignore no-explicit-any
type Client = any;

/** Pages through a PostgREST query (default max 1000 rows per request). */
export async function selectAll<T>(
  build: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>,
  max = 20000,
): Promise<T[]> {
  const out: T[] = [];
  for (let from = 0; from < max; from += 1000) {
    const { data, error } = await build(from, Math.min(from + 999, max - 1));
    if (error) throw new Error(error.message);
    out.push(...(data ?? []));
    if (!data || data.length < 1000) break;
  }
  return out;
}

/**
 * Live institutions for a job: not marked is_sample_data, not the platform
 * control scope, and with at least one user_institutions membership.
 * `enabled` reflects the job's per-institution setting (missing row = off).
 */
export async function liveInstitutions(sb: Client, setting: JobSetting): Promise<{ id: string; enabled: boolean }[]> {
  const { data: insts, error } = await sb.from('institutions').select('id')
    .eq('is_sample_data', false).neq('institution_type', 'platform_control');
  if (error) throw new Error(error.message);
  const ids: string[] = (insts ?? []).map((r: { id: string }) => r.id);
  if (ids.length === 0) return [];
  const { data: members, error: mErr } = await sb.from('user_institutions').select('institution_id').in('institution_id', ids);
  if (mErr) throw new Error(mErr.message);
  const live = [...new Set<string>((members ?? []).map((m: { institution_id: string }) => m.institution_id))];
  if (live.length === 0) return [];
  const { data: settings, error: sErr } = await sb.from('institution_settings').select(`institution_id, ${setting}`).in('institution_id', live);
  if (sErr) throw new Error(sErr.message);
  const on = new Set<string>((settings ?? []).filter((s: Record<string, unknown>) => s[setting] === true).map((s: { institution_id: string }) => s.institution_id));
  return live.map((id) => ({ id, enabled: on.has(id) }));
}

export interface RunRecord {
  institutionId: string;
  job: string;
  startedAt: string;
  finishedAt: string;
  recordsProcessed: number;
  externalCalls: number;
  outcome: RunOutcome;
  details?: Record<string, unknown>;
}

/** One audit entry per institution per run. Never requests the inserted row back. */
export async function writeRunAudit(sb: Client, r: RunRecord): Promise<void> {
  const actor = `system:${r.job}`;
  const { error } = await sb.from('audit_log').insert({
    institution_id: r.institutionId,
    user_name: actor,
    actor_name: actor,
    action: 'SCHEDULED_JOB_RUN',
    resource: r.job,
    status: r.outcome === 'failed' ? 'failed' : 'success',
    metadata: {
      job: r.job,
      started_at: r.startedAt,
      finished_at: r.finishedAt,
      records_processed: r.recordsProcessed,
      external_calls: r.externalCalls,
      outcome: r.outcome,
      ...(r.details ?? {}),
    },
  });
  if (error) console.error(`[${r.job}] audit write failed`, r.institutionId, error.message);
}

/** Runs `fn` over items with bounded concurrency, stopping new work once `shouldStop()` is true. */
export async function mapLimit<T>(items: T[], limit: number, shouldStop: () => boolean, fn: (item: T) => Promise<void>): Promise<number> {
  let next = 0;
  let started = 0;
  const worker = async () => {
    while (next < items.length && !shouldStop()) {
      const item = items[next++];
      started++;
      await fn(item);
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return started;
}

/** Keeps the run alive after responding (the scheduler does not wait for long runs). */
export function runInBackground(work: Promise<unknown>): void {
  // deno-lint-ignore no-explicit-any
  const rt = (globalThis as any).EdgeRuntime;
  if (rt?.waitUntil) rt.waitUntil(work);
}

export const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
