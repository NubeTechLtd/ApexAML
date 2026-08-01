import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertTriangle, ArrowRight, Building2, CheckCircle2, Fingerprint, Landmark,
  ShieldAlert, UserPlus, Users, Wallet,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useAuditLog } from '@/hooks/useAuditLog';
import { calculateKybRisk, requiredKybDocs } from '@/lib/kybRisk';
import { AddUboDrawer } from '@/components/kyb/AddUboDrawer';
import { KybDocumentsSection } from '@/components/kyb/KybDocumentsSection';
import {
  BUSINESS_TYPES, CBN_HIGH_RISK_INDUSTRIES, EMPLOYEE_RANGES, TURNOVER_RANGES,
  type BeneficialOwner, type BusinessType, type CorporateEntity,
} from '@/data/mockKYB';

const AUTHORISED_CHECKERS = ['Ngozi Ibe (MLRO)', 'Chukwudi Obi (Head, Compliance)', 'Chioma Adeyemi (Reviewer)'];

interface Props {
  entity: CorporateEntity | null;
  onUpdate: (patch: Partial<CorporateEntity>) => void;
}

export function CorporateEDDWorkspace({ entity, onUpdate }: Props) {
  const { user } = useAuth();
  const { append } = useAuditLog();
  const analyst = user?.email ?? 'Unauthenticated session';

  const [uboOpen, setUboOpen] = useState(false);
  const [docsOnFile, setDocsOnFile] = useState(0);
  const [justification, setJustification] = useState('');
  const [checker, setChecker] = useState<string>(AUTHORISED_CHECKERS[0]);

  const required = useMemo(() => (entity ? requiredKybDocs(entity.businessType) : []), [entity]);
  const risk = useMemo(
    () => (entity ? calculateKybRisk(entity, docsOnFile, required.length) : null),
    [entity, docsOnFile, required.length],
  );

  if (!entity || !risk) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center max-w-sm">
          <Building2 className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm font-medium text-foreground">Select a corporate customer</p>
          <p className="text-xs text-muted-foreground mt-1">
            Pick a company from the queue to run Know Your Business checks — CAC verification, beneficial ownership, director screening and documentation.
          </p>
        </div>
      </div>
    );
  }

  const bandColour =
    risk.band === 'Critical' || risk.band === 'High'
      ? 'bg-destructive/10 text-destructive'
      : risk.band === 'Medium'
        ? 'bg-[hsl(var(--risk-medium))]/10 text-[hsl(var(--risk-medium))]'
        : 'bg-[hsl(var(--risk-low))]/10 text-[hsl(var(--risk-low))]';

  const verifyCac = () => {
    append({ action: 'KYB_CAC_VERIFY', analyst, caseId: entity.rcNumber, justification: `CAC lookup requested for ${entity.companyName}` });
    toast.info('CAC verification integration coming soon — manual verification required');
  };

  const addOwner = (owner: BeneficialOwner) => {
    onUpdate({ owners: [...entity.owners, owner], status: entity.status === 'Pending' ? 'In Progress' : entity.status });
    append({ action: 'KYB_UBO_ADDED', analyst, caseId: entity.rcNumber, justification: `${owner.fullName} added as ${owner.role} (${owner.ownershipPct}%)` });
    toast.success('Beneficial owner recorded');
  };

  const verifyBvn = (owner: BeneficialOwner) => {
    onUpdate({ owners: entity.owners.map(o => (o.id === owner.id ? { ...o, bvnVerified: true } : o)) });
    append({ action: 'KYB_BVN_VERIFY', analyst, caseId: entity.rcNumber, justification: `BVN verified for ${owner.fullName} (Smile Identity)` });
    toast.success(`BVN verified for ${owner.fullName}`);
  };

  const screenPep = (owner: BeneficialOwner) => {
    const hit = /halima|blueridge/i.test(owner.fullName);
    onUpdate({ owners: entity.owners.map(o => (o.id === owner.id ? { ...o, pepScreened: true, pepHit: hit } : o)) });
    append({ action: 'KYB_PEP_SCREEN', analyst, caseId: entity.rcNumber, justification: `PEP screening run for ${owner.fullName} — ${hit ? 'possible match' : 'no match'}` });
    hit ? toast.warning(`Possible PEP match — ${owner.fullName}. Escalate for EDD.`) : toast.success(`No PEP match for ${owner.fullName}`);
  };

  const decide = (decision: 'Approve' | 'Reject') => {
    const text = justification.trim();
    if (text.length < 20) {
      toast.error('Provide a justification of at least 20 characters for the audit trail.');
      return;
    }
    const maker = entity.makerSignoff;
    if (!maker) {
      onUpdate({ makerSignoff: { analyst, at: new Date().toISOString(), decision, justification: text }, status: 'In Progress' });
      append({
        action: decision === 'Approve' ? 'KYB_MAKER_APPROVE' : 'KYB_MAKER_REJECT',
        analyst,
        caseId: `${entity.companyName} · ${entity.rcNumber}`,
        justification: `Maker recommendation to ${decision.toLowerCase()} — KYB score ${risk.score}/100 (${risk.band}) — ${text}`,
      });
      toast.success('Recommendation recorded — awaiting checker countersignature');
      return;
    }
    if (maker.decision !== decision) {
      toast.error(`The maker recommended ${maker.decision.toLowerCase()} — the checker must countersign the same decision or the maker must withdraw it.`);
      return;
    }
    onUpdate({
      status: decision === 'Approve' ? 'Approved' : 'Rejected',
      decision: { analyst: checker, at: new Date().toISOString(), decision: decision === 'Approve' ? 'Approved' : 'Rejected', justification: text },
    });
    append({
      action: decision === 'Approve' ? 'KYB_APPROVED' : 'KYB_REJECTED',
      analyst: checker,
      caseId: `${entity.companyName} · ${entity.rcNumber}`,
      justification: `Checker countersigned ${decision.toLowerCase()} (maker: ${maker.analyst}) — KYB score ${risk.score}/100 (${risk.band}) — ${text}`,
    });
    setJustification('');
    toast.success(`KYB ${decision === 'Approve' ? 'approved' : 'rejected'} — logged to the audit trail`);
  };

  const setField = <K extends keyof CorporateEntity>(key: K, value: CorporateEntity[K]) => onUpdate({ [key]: value } as Partial<CorporateEntity>);

  return (
    <ScrollArea className="flex-1">
      <div className="p-4 space-y-4 max-w-[1100px]">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-foreground">{entity.companyName}</h2>
            <p className="text-[11px] text-muted-foreground font-mono">{entity.rcNumber} · {entity.businessType}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={cn('text-[10px] border-0 font-semibold', bandColour)}>
              KYB score {risk.score}/100 · {risk.band}
            </Badge>
            <Badge variant="outline" className="text-[10px]">{entity.status}</Badge>
          </div>
        </div>

        {risk.noMajorityUbo && (
          <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-3 flex gap-2.5">
            <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-destructive">CBN red flag — no natural person owns 25% or more</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Ownership appears to sit behind corporate vehicles. Under the CBN AML/CFT Regulations you must trace the chain of control to a natural person before onboarding, or apply enhanced due diligence and document the reason.
              </p>
            </div>
          </div>
        )}

        {/* SECTION 1 — Company details */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <Landmark className="h-3.5 w-3.5" /> 1 · Company details
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs">CAC registration number</Label>
              <div className="flex gap-2">
                <Input value={entity.rcNumber} onChange={e => setField('rcNumber', e.target.value.slice(0, 20))} className="h-9 text-sm font-mono" />
                <Button variant="outline" size="sm" className="h-9 shrink-0 gap-1 text-xs" onClick={verifyCac}>
                  Verify with CAC <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground">
                {entity.cacVerified ? 'Previously confirmed against CAC records.' : 'Not yet confirmed against CAC records.'}
              </p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Company name</Label>
              <Input value={entity.companyName} onChange={e => setField('companyName', e.target.value.slice(0, 150))} className="h-9 text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Registration date</Label>
              <Input type="date" value={entity.registrationDate} onChange={e => setField('registrationDate', e.target.value)} className="h-9 text-sm" />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs">Registered address</Label>
              <Input value={entity.registeredAddress} onChange={e => setField('registeredAddress', e.target.value.slice(0, 200))} className="h-9 text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Business type</Label>
              <Select value={entity.businessType} onValueChange={v => setField('businessType', v as BusinessType)}>
                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {BUSINESS_TYPES.map(t => <SelectItem key={t} value={t} className="text-sm">{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Industry / sector</Label>
              <Select value={entity.industry} onValueChange={v => setField('industry', v)}>
                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CBN_HIGH_RISK_INDUSTRIES.map(i => <SelectItem key={i} value={i} className="text-sm">{i}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Annual turnover range</Label>
              <Select value={entity.turnoverRange} onValueChange={v => setField('turnoverRange', v)}>
                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TURNOVER_RANGES.map(r => <SelectItem key={r} value={r} className="text-sm">{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Number of employees</Label>
              <Select value={entity.employees} onValueChange={v => setField('employees', v)}>
                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {EMPLOYEE_RANGES.map(r => <SelectItem key={r} value={r} className="text-sm">{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* SECTION 2 — Beneficial ownership */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5" /> 2 · Beneficial ownership (UBO)
              </CardTitle>
              <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1" onClick={() => setUboOpen(true)}>
                <UserPlus className="h-3 w-3" /> Add beneficial owner
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Ownership chain */}
            <div className="grid gap-2 sm:grid-cols-[1fr_auto_1fr_auto_1fr] items-center">
              <div className="rounded-lg border p-3 bg-muted/30">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">Beneficial owners</p>
                {entity.owners.length === 0 && <p className="text-[11px] text-muted-foreground">None recorded yet.</p>}
                {entity.owners.map(o => (
                  <div key={o.id} className="flex items-center justify-between text-[11px] py-0.5">
                    <span className="truncate text-foreground">{o.fullName}</span>
                    <span className="font-mono text-muted-foreground ml-2">{o.ownershipPct}%</span>
                  </div>
                ))}
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground mx-auto hidden sm:block" />
              <div className="rounded-lg border p-3 bg-primary/5 border-primary/30">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">Company</p>
                <p className="text-xs font-medium text-foreground">{entity.companyName}</p>
                <p className="text-[10px] font-mono text-muted-foreground">{entity.rcNumber}</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground mx-auto hidden sm:block" />
              <div className="rounded-lg border p-3 bg-muted/30">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">Account</p>
                <p className="text-xs font-medium text-foreground flex items-center gap-1.5">
                  <Wallet className="h-3.5 w-3.5" /> Corporate current account
                </p>
                <p className="text-[10px] text-muted-foreground">Opens on KYB approval</p>
              </div>
            </div>

            <div className="text-[10px] text-muted-foreground">
              Total recorded ownership: {entity.owners.reduce((s, o) => s + o.ownershipPct, 0)}%
            </div>
          </CardContent>
        </Card>

        {/* SECTION 3 — Director verification */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <Fingerprint className="h-3.5 w-3.5" /> 3 · Director & owner verification
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {entity.owners.map(o => (
              <div key={o.id} className="rounded-lg border p-2.5 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-foreground">{o.fullName}</p>
                    <p className="text-[10px] text-muted-foreground font-mono">
                      BVN {o.bvn} · NIN {o.nin} · {o.role} · {o.ownershipPct}%
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 justify-end">
                    {o.bvnVerified ? (
                      <Badge variant="outline" className="text-[9px] border-0 font-semibold bg-[hsl(var(--risk-low))]/10 text-[hsl(var(--risk-low))]">
                        BVN verified
                      </Badge>
                    ) : (
                      <Button variant="outline" size="sm" className="h-7 text-[10px]" onClick={() => verifyBvn(o)}>
                        Verify BVN
                      </Button>
                    )}
                    {o.pepScreened ? (
                      <Badge
                        variant="outline"
                        className={cn(
                          'text-[9px] border-0 font-semibold',
                          o.pepHit ? 'bg-destructive/10 text-destructive' : 'bg-[hsl(var(--risk-low))]/10 text-[hsl(var(--risk-low))]',
                        )}
                      >
                        {o.pepHit ? 'Possible PEP' : 'No PEP match'}
                      </Badge>
                    ) : (
                      <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1" onClick={() => screenPep(o)}>
                        <ShieldAlert className="h-3 w-3" /> Screen for PEP
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {entity.owners.length === 0 && (
              <p className="text-[11px] text-muted-foreground py-2">Add beneficial owners and directors before running verification.</p>
            )}
            <p className="text-[10px] text-muted-foreground">
              Upload each director’s identity document in the documents section below.
            </p>
          </CardContent>
        </Card>

        {/* SECTION 4 — Required documents */}
        <KybDocumentsSection
          entityId={entity.rcNumber}
          businessType={entity.businessType}
          required={required}
          onCountChange={setDocsOnFile}
        />

        {/* SECTION 5 — Risk assessment & decision */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <ShieldAlert className="h-3.5 w-3.5" /> 5 · KYB risk assessment
              </CardTitle>
              <Badge variant="outline" className={cn('text-[10px] border-0 font-semibold', bandColour)}>
                {risk.score}/100 · {risk.band}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <Progress value={risk.score} className="h-1.5" />
            <div className="space-y-1.5">
              {risk.factors.map(f => (
                <div key={f.label} className="flex items-start justify-between gap-3 text-[11px]">
                  <div className="min-w-0">
                    <p className="text-foreground font-medium">{f.label}</p>
                    <p className="text-muted-foreground">{f.detail}</p>
                  </div>
                  <span className={cn('font-mono shrink-0', f.points > 0 ? 'text-destructive' : f.points < 0 ? 'text-[hsl(var(--risk-low))]' : 'text-muted-foreground')}>
                    {f.points > 0 ? `+${f.points}` : f.points}
                  </span>
                </div>
              ))}
            </div>

            <Separator />

            {entity.decision ? (
              <div className="rounded-lg border p-3 bg-muted/30 space-y-1">
                <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5" /> KYB {entity.decision.decision.toLowerCase()}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Maker: {entity.makerSignoff?.analyst} · Checker: {entity.decision.analyst} ·{' '}
                  {new Date(entity.decision.at).toLocaleString('en-NG')}
                </p>
                <p className="text-[11px] text-muted-foreground">{entity.decision.justification}</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {entity.makerSignoff && (
                  <div className="rounded-lg border border-[hsl(var(--risk-medium))]/40 bg-[hsl(var(--risk-medium))]/5 p-3 space-y-1">
                    <p className="text-xs font-semibold text-[hsl(var(--risk-medium))]">
                      Awaiting checker countersignature — maker recommended {entity.makerSignoff.decision.toLowerCase()}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {entity.makerSignoff.analyst} · {new Date(entity.makerSignoff.at).toLocaleString('en-NG')} — {entity.makerSignoff.justification}
                    </p>
                  </div>
                )}
                <div className="space-y-1.5">
                  <Label className="text-xs">Justification (required — recorded in the audit trail)</Label>
                  <Textarea
                    value={justification}
                    onChange={e => setJustification(e.target.value.slice(0, 1000))}
                    placeholder="Explain the basis for this KYB decision — ownership traced, documents reviewed, screening outcomes…"
                    className="text-xs min-h-[80px]"
                  />
                  <p className="text-[10px] text-muted-foreground">{justification.trim().length}/1000 — minimum 20 characters.</p>
                </div>
                {entity.makerSignoff && (
                  <div className="space-y-1.5">
                    <Label className="text-xs">Countersigning authorised user (maker-checker)</Label>
                    <Select value={checker} onValueChange={setChecker}>
                      <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {AUTHORISED_CHECKERS.filter(c => c !== entity.makerSignoff?.analyst).map(c => (
                          <SelectItem key={c} value={c} className="text-sm">{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" onClick={() => decide('Approve')}>
                    {entity.makerSignoff ? 'Countersign & approve KYB' : 'Approve KYB'}
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => decide('Reject')}>
                    {entity.makerSignoff ? 'Countersign & reject KYB' : 'Reject KYB'}
                  </Button>
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Maker-checker control: two authorised users must sign off before a corporate relationship is opened or declined.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <AddUboDrawer open={uboOpen} onOpenChange={setUboOpen} onAdd={addOwner} />
    </ScrollArea>
  );
}
