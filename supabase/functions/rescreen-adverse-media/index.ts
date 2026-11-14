// Weekly adverse-media re-screen (scheduled Mondays 02:00 UTC).
//
// Runs only for live institutions (not is_sample_data, with a user_institutions
// membership) whose institution_settings.adverse_media_rescreen_enabled is on.
// For each, re-screens customers whose latest screening is past next_review_date,
// via screen-adverse-media. Every query is scoped by institution_id. At most
// MAX_EXTERNAL_CALLS_PER_RUN screenings per run across all institutions; each
// screening is one external screening call (news search + AI check).
// One audit_log entry per live institution per run.
import { createClient } from 'npm:@supabase/supabase-js@2';
import {
  authenticateScheduledCall, json, liveInstitutions, mapLimit, runInBackground, selectAll, writeRunAudit,
  type RunOutcome,
} from '../_shared/scheduled-jobs.ts';

const JOB = 'adverse-media-rescreen';
export const MAX_EXTERNAL_CALLS_PER_RUN = 200;
const CONCURRENCY = 10;
/** Stop starting new screenings after this long so the run finishes inside the function time limit. */
const RUN_TIME_BUDGET_MS = 130_000;

interface DueRow { customer_id: string; customer_name: string; bvn: string | null; institution_name: string | null; next_review_date: string; search_date: string }

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  const denied = authenticateScheduledCall(req);
  if (denied) return denied;

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const sb = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

  let institutions: { id: string; enabled: boolean }[];
  try {
    institutions = await liveInstitutions(sb, 'adverse_media_rescreen_enabled');
  } catch (err) {
    console.error(`[${JOB}] could not load institutions`, String(err));
    return json({ error: 'Could not load institutions' }, 500);
  }

  const now = new Date().toISOString();
  const skipped = institutions.filter((i) => !i.enabled);
  const enabled = institutions.filter((i) => i.enabled);
  await Promise.all(skipped.map((i) => writeRunAudit(sb, {
    institutionId: i.id, job: JOB, startedAt: now, finishedAt: new Date().toISOString(),
    recordsProcessed: 0, externalCalls: 0, outcome: 'skipped_setting_off',
  })));

  if (enabled.length === 0) {
    console.log(`[${JOB}] no institution qualifies (live membership + setting on); exiting without external calls`);
    return json({ qualifying: 0, skipped: skipped.length });
  }

  const work = run(sb, supabaseUrl, serviceKey, enabled.map((i) => i.id))
    .catch((err) => console.error(`[${JOB}] run crashed`, String(err)));
  runInBackground(work);
  return json({ accepted: true, qualifying: enabled.length, skipped: skipped.length }, 202);
});

// deno-lint-ignore no-explicit-any
async function run(sb: any, supabaseUrl: string, serviceKey: string, institutionIds: string[]) {
  const runStart = Date.now();
  let budget = MAX_EXTERNAL_CALLS_PER_RUN;
  let capLogged = false;
  const outOfTime = () => Date.now() - runStart > RUN_TIME_BUDGET_MS;

  for (const institutionId of institutionIds) {
    const startedAt = new Date().toISOString();
    let processed = 0, calls = 0, failed = 0, deferred = 0, ineligible = 0, due = 0;
    let outcome: RunOutcome = 'success';
    let error: string | undefined;
    try {
      const today = new Date().toISOString().slice(0, 10);
      const [rows, customers] = await Promise.all([
        selectAll<DueRow>((from, to) => sb.from('adverse_media_results')
          .select('customer_id, customer_name, bvn, institution_name, next_review_date, search_date')
          .eq('institution_id', institutionId).order('search_date', { ascending: false }).range(from, to)),
        selectAll<{ id: string; bvn: string | null; nuban: string | null }>((from, to) => sb.from('customers')
          .select('id, bvn, nuban').eq('institution_id', institutionId).order('id').range(from, to)),
      ]);
      // Only customers that belong to this institution can be re-screened.
      const known = new Set<string>();
      for (const c of customers) for (const k of [c.id, c.bvn, c.nuban]) if (k) known.add(k);
      // Latest screening per customer, then only those past their review date.
      const latest = new Map<string, DueRow>();
      for (const r of rows) if (!latest.has(r.customer_id)) latest.set(r.customer_id, r);
      const dueRows = [...latest.values()].filter((r) => r.next_review_date <= today);
      const eligible = dueRows.filter((r) => known.has(r.customer_id));
      due = dueRows.length;
      ineligible = dueRows.length - eligible.length;

      const take = eligible.slice(0, Math.max(0, budget));
      deferred = eligible.length - take.length;
      budget -= take.length;
      if (deferred > 0 && !capLogged) {
        console.warn(`[${JOB}] external screening cap of ${MAX_EXTERNAL_CALLS_PER_RUN} per run reached; deferring remaining customers to the next run`);
        capLogged = true;
      }

      const started = await mapLimit(take, CONCURRENCY, outOfTime, async (row) => {
        calls++;
        try {
          const res = await fetch(`${supabaseUrl}/functions/v1/screen-adverse-media`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${serviceKey}`, 'Lovable-Context': 'cron' },
            body: JSON.stringify({
              customer_id: row.customer_id, customer_name: row.customer_name, bvn: row.bvn,
              institution_name: row.institution_name, screened_by: JOB,
            }),
          });
          const body = await res.json().catch(() => null);
          if (!res.ok || body?.screening?.institution_id !== institutionId) {
            failed++;
            console.warn(`[${JOB}] screening failed`, institutionId, res.status);
            return;
          }
          processed++;
        } catch (err) {
          failed++;
          console.warn(`[${JOB}] screening error`, institutionId, String(err));
        }
      });
      const notStarted = take.length - started;
      if (notStarted > 0) {
        console.warn(`[${JOB}] run time budget reached; ${notStarted} screenings deferred`);
        budget += notStarted;
        deferred += notStarted;
      }
      outcome = failed > 0 && processed === 0 ? 'failed' : failed > 0 || deferred > 0 ? 'partial' : 'success';
    } catch (err) {
      outcome = 'failed';
      error = String(err).slice(0, 300);
      console.error(`[${JOB}] institution run failed`, institutionId, error);
    }
    await writeRunAudit(sb, {
      institutionId, job: JOB, startedAt, finishedAt: new Date().toISOString(),
      recordsProcessed: processed, externalCalls: calls, outcome,
      details: { due, ineligible, failed, deferred, cap: MAX_EXTERNAL_CALLS_PER_RUN, cap_reached: deferred > 0, ...(error ? { error } : {}) },
    });
  }
  console.log(`[${JOB}] run complete; ${MAX_EXTERNAL_CALLS_PER_RUN - budget} external screening calls`);
}
