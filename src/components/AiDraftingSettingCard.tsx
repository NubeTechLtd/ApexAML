import { useEffect, useState } from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { useDataProvider } from '@/data-layer/hooks';
import { AI_DRAFTING_MIN_JUSTIFICATION } from '@/lib/aiDrafting';

/** Live settings: institution consent for AI STR drafting (institution_admin only). */
export function AiDraftingSettingCard() {
  const provider = useDataProvider();
  const [enabled, setEnabled] = useState(false);
  const [canEdit, setCanEdit] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState<boolean | null>(null);
  const [justification, setJustification] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    provider.institutionSettings.get()
      .then((s) => { setEnabled(s.aiDraftingEnabled); setCanEdit(s.canEdit); })
      .catch(() => toast({ title: 'Could not load AI drafting setting', description: 'Try again.', variant: 'destructive' }))
      .finally(() => setLoading(false));
  }, [provider]);

  const open = (next: boolean) => { setPending(next); setJustification(''); setConfirmed(false); };
  const valid = justification.trim().length >= AI_DRAFTING_MIN_JUSTIFICATION && confirmed;

  const save = async () => {
    if (pending === null || !valid) return;
    setSaving(true);
    try {
      await provider.institutionSettings.setAiDrafting(pending, justification.trim());
      setEnabled(pending);
      setPending(null);
      toast({ title: pending ? 'AI drafting turned on' : 'AI drafting turned off', description: 'The change has been recorded in the audit log.' });
    } catch (e) {
      toast({ title: 'Could not change the setting', description: e instanceof Error ? e.message : 'Try again.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5" />AI drafting</CardTitle>
        <CardDescription>
          When on, analysts can ask the AI to draft and refine STR narratives. Before case details are sent to the AI
          service, names, BVN, NIN, NUBAN, phone numbers and email addresses are replaced with placeholders such as
          CUST_1 and BVN_1, and the real values are put back in the returned draft. Amounts, dates, channels and
          locations are sent as they are. Off by default until your institution consents.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Loading…</div>
        ) : (
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <Label htmlFor="ai-drafting">AI drafting enabled</Label>
              <p className="text-xs text-muted-foreground">
                {enabled ? 'On for your institution.' : 'Off. Analysts write STR narratives without AI.'}
                {!canEdit && ' Only your institution administrator can change this.'}
              </p>
            </div>
            <Switch id="ai-drafting" checked={enabled} disabled={!canEdit} onCheckedChange={open} />
          </div>
        )}
      </CardContent>

      <Dialog open={pending !== null} onOpenChange={(o) => { if (!o && !saving) setPending(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{pending ? 'Turn on AI drafting' : 'Turn off AI drafting'}</DialogTitle>
            <DialogDescription>
              {pending
                ? 'Pseudonymised case details will be sent to the AI service whenever an analyst drafts or refines an STR.'
                : 'Analysts will no longer be able to use AI to draft or refine STRs.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="ai-drafting-reason">Justification (at least {AI_DRAFTING_MIN_JUSTIFICATION} characters)</Label>
              <Textarea id="ai-drafting-reason" value={justification} maxLength={2000}
                onChange={(e) => setJustification(e.target.value)}
                placeholder={pending ? 'e.g. Board approved AI-assisted STR drafting on 10 Nov 2026, ref. MLRO-2026-14' : 'Reason for turning AI drafting off'} />
              <p className="text-xs text-muted-foreground">{justification.trim().length}/{AI_DRAFTING_MIN_JUSTIFICATION} minimum</p>
            </div>
            <div className="flex items-start gap-2">
              <Checkbox id="ai-drafting-confirm" checked={confirmed} onCheckedChange={(v) => setConfirmed(v === true)} />
              <Label htmlFor="ai-drafting-confirm" className="text-sm font-normal leading-snug">
                {pending
                  ? 'I confirm my institution has consented to sending pseudonymised case details to the AI service for STR drafting, and that analysts will review every draft.'
                  : 'I understand AI drafting stops for every analyst in my institution immediately.'}
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPending(null)} disabled={saving}>Cancel</Button>
            <Button onClick={save} disabled={!valid || saving}>
              {saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}{pending ? 'Turn on' : 'Turn off'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
