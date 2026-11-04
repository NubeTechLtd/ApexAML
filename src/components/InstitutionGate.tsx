import { useEffect, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Building2, CheckCircle2, Loader2, LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { getInstitutionMembership } from '@/lib/institution';
import { PILOT_INSTITUTION_TYPES, submitPilotRequest, type PilotRequestForm } from '@/lib/pilotRequest';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type GateState = 'checking' | 'member' | 'not_provisioned' | 'error';

/** Opens the live zone only for users with an institution membership. Sign-in is checked by ProtectedRoute above it. */
export function InstitutionGate({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const [state, setState] = useState<GateState>('checking');

  useEffect(() => {
    if (loading || !user) return;
    let cancelled = false;
    setState('checking');
    getInstitutionMembership(user.id)
      .then((m) => { if (!cancelled) setState(m ? 'member' : 'not_provisioned'); })
      .catch(() => { if (!cancelled) setState('error'); });
    return () => { cancelled = true; };
  }, [loading, user?.id]);

  if (state === 'member') return <>{children}</>;
  if (state === 'not_provisioned') return <NotProvisioned />;
  if (state === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <p className="text-sm text-muted-foreground">We couldn't check your institution access. Refresh the page to try again.</p>
      </div>
    );
  }
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" aria-label="Checking institution access" />
    </div>
  );
}

const EMPTY: PilotRequestForm = { name: '', institutionName: '', institutionType: '', role: '', phone: '', message: '', website: '' };

function NotProvisioned() {
  const { user, signOut } = useAuth();
  const [form, setForm] = useState<PilotRequestForm>(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = (k: keyof PilotRequestForm) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  const valid = form.name.trim().length >= 2 && form.institutionName.trim().length >= 2 && form.institutionType !== ''
    && form.role.trim().length >= 2 && (!form.phone.trim() || /^\+?[0-9 ()-]{7,20}$/.test(form.phone.trim()));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid || submitting) return;
    setSubmitting(true);
    setError(null);
    const res = await submitPilotRequest(form);
    setSubmitting(false);
    if (res.ok) { setDone(true); return; }
    setError(res.reason === 'rate_limited'
      ? "You've sent several requests in a short time. Please wait a while and try again."
      : res.reason === 'unauthorized'
        ? 'Your session has expired. Sign in again and resubmit.'
        : "We couldn't send your request. Please try again, or email hello@apexaml.com.");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <Card className="w-full max-w-lg">
        <CardHeader className="space-y-2">
          <div className="flex items-center gap-2 text-primary"><Building2 className="h-5 w-5" /></div>
          <CardTitle className="text-xl">Your institution is not provisioned yet</CardTitle>
          <CardDescription>
            You're signed in as <span className="font-medium text-foreground">{user?.email}</span>, but this account isn't linked to an institution.
            Request pilot access and we'll set up your institution's workspace.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {done ? (
            <div className="space-y-4">
              <div className="flex items-start gap-2 rounded-md border border-border bg-muted/40 p-4">
                <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <p className="text-sm text-foreground">Request received. We'll contact you at {user?.email} about pilot access.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button asChild variant="outline"><Link to="/demo">Explore the demo meanwhile</Link></Button>
                <Button variant="ghost" onClick={() => void signOut()}><LogOut className="h-4 w-4 mr-1" />Sign out</Button>
              </div>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4" noValidate>
              <h2 className="text-sm font-semibold text-foreground">Request pilot access</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="pr-name">Your name</Label>
                  <Input id="pr-name" value={form.name} maxLength={100} onChange={(e) => set('name')(e.target.value)} required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="pr-role">Your role</Label>
                  <Input id="pr-role" value={form.role} maxLength={100} placeholder="e.g. Chief Compliance Officer" onChange={(e) => set('role')(e.target.value)} required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="pr-inst">Institution name</Label>
                  <Input id="pr-inst" value={form.institutionName} maxLength={150} onChange={(e) => set('institutionName')(e.target.value)} required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="pr-type">Institution type</Label>
                  <Select value={form.institutionType} onValueChange={set('institutionType')}>
                    <SelectTrigger id="pr-type"><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>
                      {PILOT_INSTITUTION_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="pr-phone">Phone (optional)</Label>
                  <Input id="pr-phone" type="tel" value={form.phone} maxLength={20} onChange={(e) => set('phone')(e.target.value)} />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="pr-msg">Anything we should know? (optional)</Label>
                  <Textarea id="pr-msg" value={form.message} maxLength={2000} rows={3} onChange={(e) => set('message')(e.target.value)} />
                </div>
              </div>
              {/* Honeypot: hidden from people, filled by bots */}
              <div className="hidden" aria-hidden="true">
                <label htmlFor="pr-website">Website</label>
                <input id="pr-website" tabIndex={-1} autoComplete="off" value={form.website} onChange={(e) => set('website')(e.target.value)} />
              </div>
              {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
              <div className="flex flex-wrap items-center gap-2">
                <Button type="submit" disabled={!valid || submitting}>
                  {submitting && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}Request pilot access
                </Button>
                <Button type="button" variant="ghost" onClick={() => void signOut()}><LogOut className="h-4 w-4 mr-1" />Sign out</Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
