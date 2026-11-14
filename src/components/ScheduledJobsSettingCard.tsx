import { useEffect, useState } from 'react';
import { CalendarClock, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { useDataProvider } from '@/data-layer/hooks';
import type { ScheduledJobKey } from '@/data-layer/types';
import { AI_DRAFTING_MIN_JUSTIFICATION as MIN_JUSTIFICATION } from '@/lib/aiDrafting';

const JOBS: { key: ScheduledJobKey; label: string; detail: string }[] = [
  {
    key: 'adverse_media_rescreen',
    label: 'Weekly adverse-media re-screen',
    detail: 'Mondays at 02:00 UTC. Re-screens customers whose adverse-media review date has passed, up to 200 screenings per run. Each screening sends the customer name to news search and the AI service.',
  },
  {
    key: 'risk_sweep',
    label: 'Nightly risk-score recalculation',
    detail: "Daily at 03:00 UTC. Recalculates customer risk scores from your institution's own customers, alerts, filings and KYC documents.",
  },
];

/** Live settings: per-institution switches for the scheduled jobs (institution_admin only). */
export function ScheduledJobsSettingCard() {
  const provider = useDataProvider();
  const [state, setState] = useState<Record<ScheduledJobKey, boolean>>({ adverse_media_rescreen: false, risk_sweep: false });
  const [canEdit, setCanEdit] = useState(false);
  const [sampleData, setSampleData] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState<{ job: ScheduledJobKey; enabled: boolean } | null>(null);
  const [justification, setJustification] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    provider.institutionSettings.get()
      .then((s) => {
        setState({ adverse_media_rescreen: s.adverseMediaRescreenEnabled, risk_sweep: s.riskSweepEnabled });
        setCanEdit(s.canEdit);
        setSampleData(s.sampleData);
      })
      .catch(() => toast({ title: 'Could not load scheduled job settings', description: 'Try again.', variant: 'destructive' }))
      .finally(() => setLoading(false));
  }, [provider]);

  const open = (job: ScheduledJobKey, enabled: boolean) => { setPending({ job, enabled }); setJustification(''); setConfirmed(false); };
  const valid = justification.trim().length >= MIN_JUSTIFICATION && confirmed;
  const pendingJob = pending ? JOBS.find((j) => j.key === pending.job) : null;

  const save = async () => {
    if (!pending || !valid) return;
    setSaving(true);
    try {
      await provider.institutionSettings.setScheduledJob(pending.job, pending.enabled, justification.trim());
      setState((s) => ({ ...s, [pending.job]: pending.enabled }));
      toast({ title: `${pendingJob?.label} turned ${pending.enabled ? 'on' : 'off'}`, description: 'The change has been recorded in the audit log.' });
      setPending(null);
    } catch (e) {
      toast({ title: 'Could not change the setting', description: e instanceof Error ? e.message : 'Try again.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><CalendarClock className="h-5 w-5" />Scheduled jobs</CardTitle>
        <CardDescription>
          Off by default. Each run is recorded in the audit log.
          {sampleData && ' This institution is marked as holding sample data, so these jobs do not run for it.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Loading…</div>
        ) : JOBS.map((job) => (
          <div key={job.key} className="flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <Label htmlFor={`job-${job.key}`}>{job.label}</Label>
              <p className="text-xs text-muted-foreground">
                {job.detail}
                {!canEdit && ' Only your institution administrator can change this.'}
              </p>
            </div>
            <Switch id={`job-${job.key}`} checked={state[job.key]} disabled={!canEdit} onCheckedChange={(v) => open(job.key, v)} />
          </div>
        ))}
      </CardContent>

      <Dialog open={pending !== null} onOpenChange={(o) => { if (!o && !saving) setPending(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Turn {pending?.enabled ? 'on' : 'off'} {pendingJob?.label.toLowerCase()}</DialogTitle>
            <DialogDescription>{pendingJob?.detail}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="job-reason">Justification (at least {MIN_JUSTIFICATION} characters)</Label>
              <Textarea id="job-reason" value={justification} maxLength={2000} onChange={(e) => setJustification(e.target.value)} />
              <p className="text-xs text-muted-foreground">{justification.trim().length}/{MIN_JUSTIFICATION} minimum</p>
            </div>
            <div className="flex items-start gap-2">
              <Checkbox id="job-confirm" checked={confirmed} onCheckedChange={(v) => setConfirmed(v === true)} />
              <Label htmlFor="job-confirm" className="text-sm font-normal leading-snug">
                I confirm my institution has approved this change.
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPending(null)} disabled={saving}>Cancel</Button>
            <Button onClick={save} disabled={!valid || saving}>
              {saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}{pending?.enabled ? 'Turn on' : 'Turn off'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
