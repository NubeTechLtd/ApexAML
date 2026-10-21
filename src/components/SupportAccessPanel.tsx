import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ShieldCheck } from 'lucide-react';

export function SupportAccessPanel() {
  const [institutions, setInstitutions] = useState<{ id: string; name: string }[]>([]);
  const [institution, setInstitution] = useState('');
  const [reason, setReason] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [active, setActive] = useState<{ institution_id: string; expires_at: string } | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const load = async () => {
    const { data: options, error: listError } = await supabase.rpc('support_institutions');
    if (listError) setError(listError.message);
    setInstitutions(options ?? []);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from('support_access_grants').select('institution_id,expires_at').eq('user_id', user.id).is('revoked_at', null).gt('expires_at', new Date().toISOString()).order('created_at', { ascending: false }).limit(1).maybeSingle();
    setActive(data);
  };
  useEffect(() => { void load(); const timer = window.setInterval(() => void load(), 30_000); return () => window.clearInterval(timer); }, []);
  const act = async (end: boolean) => {
    setBusy(true); setError('');
    const result = end ? await supabase.rpc('end_support_access') : await supabase.rpc('start_support_access', { _institution_id: institution, _justification: reason, _confirmed: confirmed });
    if (result.error) setError(result.error.message);
    else { setReason(''); setConfirmed(false); await load(); }
    setBusy(false);
  };
  return <section className="border-b border-border px-6 py-4 space-y-3">
    <h2 className="flex items-center gap-2 text-sm font-semibold"><ShieldCheck className="h-4 w-4" />Support access</h2>
    {active ? <div className="flex flex-wrap items-center gap-3 text-sm">
      <span>{institutions.find(i => i.id === active.institution_id)?.name} · Read-only · Until {new Date(active.expires_at).toLocaleTimeString()}</span>
      <Button variant="outline" size="sm" disabled={busy} onClick={() => void act(true)}>End support access</Button>
    </div> : <div className="flex flex-wrap items-end gap-3">
      <div className="space-y-1 min-w-56"><Label>Institution</Label><Select value={institution} onValueChange={setInstitution}><SelectTrigger><SelectValue placeholder="Select institution" /></SelectTrigger><SelectContent>{institutions.map(i => <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>)}</SelectContent></Select></div>
      <div className="space-y-1 flex-1 min-w-56"><Label htmlFor="support-reason">Support justification</Label><Input id="support-reason" value={reason} onChange={e => setReason(e.target.value)} /></div>
      <Label className="flex items-center gap-2"><Checkbox checked={confirmed} onCheckedChange={v => setConfirmed(v === true)} />I confirm institution-scoped support access</Label>
      <Button size="sm" disabled={busy || !institution || reason.trim().length < 20 || !confirmed} onClick={() => void act(false)}>Start support access</Button>
    </div>}
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
  </section>;
}