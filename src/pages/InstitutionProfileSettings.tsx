import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Building2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { useDataProvider } from '@/data-layer/hooks';
import { LIVE_EXPORT_LABEL, PROFILE_FIELDS, missingProfileFields, type ReportingEntity } from '@/lib/reportingEntity';
import { APP_HOME } from '@/lib/zones';
import { AiDraftingSettingCard } from '@/components/AiDraftingSettingCard';

type Fields = Omit<ReportingEntity, 'version'>;
const EMPTY: Fields = { legalName: '', cbnLicenceNumber: '', goamlEntityId: '', address: '', mlroName: '', contactEmail: '', contactPhone: '' };

export default function InstitutionProfileSettings() {
  const provider = useDataProvider();
  const [fields, setFields] = useState<Fields>(EMPTY);
  const [version, setVersion] = useState<number | null>(null);
  const [canEdit, setCanEdit] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    provider.institutionProfile.get()
      .then(({ profile, canEdit }) => {
        setCanEdit(canEdit);
        if (profile) { const { version: v, ...rest } = profile; setFields(rest); setVersion(v); }
      })
      .catch((e) => toast({ title: 'Could not load profile', description: e instanceof Error ? e.message : 'Try again.', variant: 'destructive' }))
      .finally(() => setLoading(false));
  }, [provider]);

  const missing = missingProfileFields({ ...fields, version });

  const save = async () => {
    setSaving(true);
    try {
      const v = await provider.institutionProfile.save(fields);
      setVersion(v);
      toast({ title: 'Institution profile saved', description: `Version ${v} will be used for new exports.` });
    } catch (e) {
      toast({ title: 'Could not save profile', description: e instanceof Error ? e.message : 'Try again.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-3xl mx-auto space-y-4">
        <Button asChild variant="ghost" size="sm"><Link to={APP_HOME}><ArrowLeft className="h-4 w-4 mr-1" />Back to workspace</Link></Button>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Building2 className="h-5 w-5" />Institution profile</CardTitle>
            <CardDescription>
              These details fill the reporting institution section of every STR and CTR XML export.
              Exports are blocked until all required fields are complete. Every export is labelled "{LIVE_EXPORT_LABEL}".
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Loading…</div>
            ) : (
              <>
                {!canEdit && (
                  <p className="text-sm text-muted-foreground">Only your institution administrator can edit this profile.</p>
                )}
                {PROFILE_FIELDS.map((f) => (
                  <div key={f.key} className="space-y-1.5">
                    <Label htmlFor={f.key}>{f.label}{f.required ? ' *' : ' (optional)'}</Label>
                    {f.key === 'address' ? (
                      <Textarea id={f.key} value={fields[f.key]} disabled={!canEdit} maxLength={1000}
                        onChange={(e) => setFields((p) => ({ ...p, [f.key]: e.target.value }))} />
                    ) : (
                      <Input id={f.key} value={fields[f.key]} disabled={!canEdit}
                        type={f.key === 'contactEmail' ? 'email' : 'text'} maxLength={f.key === 'legalName' ? 300 : 254}
                        onChange={(e) => setFields((p) => ({ ...p, [f.key]: e.target.value }))} />
                    )}
                  </div>
                ))}
                <div className="flex items-center justify-between gap-4 pt-2">
                  <p className="text-xs text-muted-foreground">
                    {version ? `Current version: ${version}. ` : 'Not saved yet. '}
                    {missing.length ? `Missing: ${missing.join(', ')}.` : 'All required fields complete.'}
                  </p>
                  {canEdit && <Button onClick={save} disabled={saving}>{saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}Save profile</Button>}
                </div>
              </>
            )}
          </CardContent>
        </Card>
        <AiDraftingSettingCard />
      </div>
    </div>
  );
}
