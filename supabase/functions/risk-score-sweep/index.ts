// Nightly risk-score sweep (scheduled daily 03:00 UTC).
//
// Runs only for live institutions (not is_sample_data, with a user_institutions
// membership) whose institution_settings.risk_sweep_enabled is on. For each,
// recalculates every customer's score through recalculate-risk-score using
// signals read from that institution's own customers and alerts. Every query is
// scoped by institution_id. Makes no external service calls.
// One audit_log entry per live institution per run.
import { createClient } from 'npm:@supabase/supabase-js@2';
import {
  authenticateScheduledCall, json, liveInstitutions, mapLimit, runInBackground, selectAll, writeRunAudit,
  type RunOutcome,
} from '../_shared/scheduled-jobs.ts';

const JOB = 'risk-score-sweep';
const MAX_RECORDS_PER_RUN = 2000;
const CONCURRENCY = 10;
const RUN_TIME_BUDGET_MS = 130_000;
const DAY = 86_400_000;

interface Customer { id: string; full_name: string; bvn: string | null; nuban: string | null; kyc_tier: string; created_at: string }
interface Alert { customer_id: string; risk_level: string; opened_at: string; closed_at: string | null }

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  const denied = authenticateScheduledCall(req);
  if (denied) return denied;

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const sb = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

  let institutions: { id: string; enabled: boolean }[];
  try {
    institutions = await liveInstitutions(sb, 'risk_sweep_enabled');
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
    console.log(`[${JOB}] no institution qualifies (live membership + setting on); exiting`);
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
  let budget = MAX_RECORDS_PER_RUN;
  const outOfTime = () => Date.now() - runStart > RUN_TIME_BUDGET_MS;

  for (const institutionId of institutionIds) {
    const startedAt = new Date().toISOString();
    let processed = 0, failed = 0, deferred = 0, total = 0;
    let outcome: RunOutcome = 'success';
    let error: string | undefined;
    try {
      const [customers, alerts, scores] = await Promise.all([
        selectAll<Customer>((from, to) => sb.from('customers')
          .select('id, full_name, bvn, nuban, kyc_tier, created_at').eq('institution_id', institutionId).order('id').range(from, to)),
        selectAll<Alert>((from, to) => sb.from('alerts')
          .select('customer_id, risk_level, opened_at, closed_at').eq('institution_id', institutionId).order('id').range(from, to)),
        selectAll<{ customer_id: string }>((from, to) => sb.from('customer_risk_scores')
          .select('customer_id').eq('institution_id', institutionId).order('customer_id').range(from, to)),
      ]);
      total = customers.length;
      const scored = new Set(scores.map((s) => s.customer_id));
      const byCustomer = new Map<string, Alert[]>();
      for (const a of alerts) byCustomer.set(a.customer_id, [...(byCustomer.get(a.customer_id) ?? []), a]);

      const take = customers.slice(0, Math.max(0, budget));
      deferred = customers.length - take.length;
      budget -= take.length;
      if (deferred > 0) console.warn(`[${JOB}] record cap of ${MAX_RECORDS_PER_RUN} per run reached; ${deferred} customers deferred`);

      const started = await mapLimit(take, CONCURRENCY, outOfTime, async (c) => {
        const own = byCustomer.get(c.id) ?? [];
        const open = own.filter((a) => !a.closed_at);
        const lastAlert = own.reduce((m, a) => Math.max(m, Date.parse(a.opened_at) || 0), 0);
        const cleanSince = open.length > 0 ? Date.now() : (lastAlert || Date.parse(c.created_at) || Date.now());
        // Keep the key the score is already stored under; otherwise BVN, NUBAN, then id.
        const key = [c.id, c.bvn, c.nuban].find((k) => k && scored.has(k)) ?? c.bvn ?? c.nuban ?? c.id;
        try {
          const res = await fetch(`${supabaseUrl}/functions/v1/recalculate-risk-score`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${serviceKey}`, 'Lovable-Context': 'cron' },
            body: JSON.stringify({
              customer_id: key,
              trigger_type: 'CLEAN_PERIOD_30D',
              trigger_reference: `${JOB}:${startedAt.slice(0, 10)}`,
              calculated_by: JOB,
              signals: {
                kyc_tier: c.kyc_tier,
                customer_name: c.full_name,
                open_critical_alerts: open.filter((a) => a.risk_level === 'Critical').length,
                open_high_alerts: open.filter((a) => a.risk_level === 'High').length,
                days_since_last_alert: Math.max(0, Math.floor((Date.now() - cleanSince) / DAY)),
              },
            }),
          });
          await res.body?.cancel();
          if (!res.ok) { failed++; console.warn(`[${JOB}] recalculation failed`, institutionId, res.status); return; }
          processed++;
        } catch (err) {
          failed++;
          console.warn(`[${JOB}] recalculation error`, institutionId, String(err));
        }
      });
      const notStarted = take.length - started;
      if (notStarted > 0) {
        console.warn(`[${JOB}] run time budget reached; ${notStarted} customers deferred`);
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
      recordsProcessed: processed, externalCalls: 0, outcome,
      details: { customers: total, failed, deferred, ...(error ? { error } : {}) },
    });
  }
}
