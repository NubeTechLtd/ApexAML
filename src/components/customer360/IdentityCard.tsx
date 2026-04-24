import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Fingerprint, User, CheckCircle2, Building2, Globe2, Plus, Trash2, Briefcase, Banknote,
} from 'lucide-react';
import type {
  Customer360Data, EntityType, BeneficialOwner, ForeignBusinessKYB, RemittancePurpose,
} from '@/data/mockCustomer360';

const livenessColors: Record<string, string> = {
  Pass: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
  Fail: 'bg-destructive/10 text-destructive border-destructive/20',
  Pending: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20',
};

const ENTITY_TYPES: EntityType[] = [
  'Individual', 'Sole Trader', 'Nigerian Business', 'Foreign Business', 'IMTO Agent',
];

const PURPOSES: RemittancePurpose[] = ['Payroll', 'Trade Payment', 'Family Support', 'Business Expense'];

const pepBadgeClass: Record<BeneficialOwner['pepStatus'], string> = {
  Clear: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
  Match: 'bg-destructive/10 text-destructive border-destructive/20',
  Pending: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20',
};

const isBusinessEntity = (e?: EntityType) =>
  e === 'Nigerian Business' || e === 'Foreign Business' || e === 'Sole Trader' || e === 'IMTO Agent';

function entityIcon(entity: EntityType) {
  switch (entity) {
    case 'Foreign Business': return Globe2;
    case 'Nigerian Business': return Building2;
    case 'Sole Trader': return Briefcase;
    case 'IMTO Agent': return Banknote;
    default: return User;
  }
}

const formatNGN = (n: number) =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(n);

export function Customer360IdentityCard({ customer }: { customer: Customer360Data }) {
  const [entityType, setEntityType] = useState<EntityType>(customer.entityType ?? 'Individual');
  const [cacNumber, setCacNumber] = useState(customer.cacNumber ?? '');
  const [foreignKYB, setForeignKYB] = useState<ForeignBusinessKYB>(
    customer.foreignKYB ?? {
      countryOfRegistration: '',
      companyRegistrationNumber: '',
      beneficialOwners: [],
      declaredRemittancePurpose: 'Trade Payment',
      averageMonthlyTransferVolumeNGN: 0,
    },
  );

  const EntityIcon = entityIcon(entityType);
  const showCAC = entityType === 'Nigerian Business';
  const showForeignKYB = entityType === 'Foreign Business';

  const updateOwner = (id: string, patch: Partial<BeneficialOwner>) => {
    setForeignKYB(prev => ({
      ...prev,
      beneficialOwners: prev.beneficialOwners.map(o => o.id === id ? { ...o, ...patch } : o),
    }));
  };

  const addOwner = () => {
    if (foreignKYB.beneficialOwners.length >= 5) return;
    setForeignKYB(prev => ({
      ...prev,
      beneficialOwners: [
        ...prev.beneficialOwners,
        { id: `bo-${crypto.randomUUID().slice(0, 6)}`, name: '', ownershipPct: 0, pepStatus: 'Pending' },
      ],
    }));
  };

  const removeOwner = (id: string) => {
    setForeignKYB(prev => ({
      ...prev,
      beneficialOwners: prev.beneficialOwners.filter(o => o.id !== id),
    }));
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Fingerprint className="h-4 w-4 text-primary" /> Identity & KYC
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Entity Type Toggle */}
        <div className="space-y-1.5">
          <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Entity Type</Label>
          <div className="flex items-center gap-2">
            <Select value={entityType} onValueChange={(v) => setEntityType(v as EntityType)}>
              <SelectTrigger className="h-8 text-xs flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ENTITY_TYPES.map(t => (
                  <SelectItem key={t} value={t} className="text-xs">{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Badge
              variant="outline"
              className={`text-[10px] gap-1 ${isBusinessEntity(entityType) ? 'bg-primary/10 text-primary border-primary/30' : 'text-muted-foreground'}`}
            >
              <EntityIcon className="h-3 w-3" />
              {isBusinessEntity(entityType) ? 'Business' : 'Person'}
            </Badge>
          </div>
        </div>

        {/* ID photo + Liveness */}
        <div className="flex items-start gap-3">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg border border-dashed border-border bg-muted/30">
            <EntityIcon className="h-8 w-8 text-muted-foreground opacity-40" />
          </div>
          <div className="space-y-1.5 pt-1">
            <Badge variant="outline" className={`text-xs ${livenessColors[customer.livenessCheck]}`}>
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Liveness Check: {customer.livenessCheck}
            </Badge>
            <p className="text-xs text-muted-foreground">
              {isBusinessEntity(entityType) ? 'Director/UBO photo on file' : 'ID Photo on file'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-muted-foreground text-xs">BVN</p>
            <p className="font-mono font-medium text-foreground">{customer.bvn}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">NIN</p>
            <p className="font-mono font-medium text-foreground">{customer.nin}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Date of Birth</p>
            <p className="font-medium text-foreground">{customer.dob}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Active Alerts</p>
            <p className="font-medium text-foreground">{customer.alerts}</p>
          </div>
        </div>

        {/* Nigerian Business — CAC field */}
        {showCAC && (
          <div className="space-y-1.5 rounded-lg border border-primary/20 bg-primary/[0.03] p-3">
            <Label className="text-[10px] uppercase tracking-wider text-primary flex items-center gap-1">
              <Building2 className="h-3 w-3" /> CAC Registration Number
              <span className="text-destructive ml-0.5">*</span>
            </Label>
            <Input
              value={cacNumber}
              onChange={e => setCacNumber(e.target.value)}
              placeholder="RC-XXXXXXX"
              className="h-8 text-xs font-mono"
            />
          </div>
        )}

        {/* Foreign Business — extended KYB */}
        {showForeignKYB && (
          <div className="space-y-3 rounded-lg border border-primary/20 bg-primary/[0.03] p-3">
            <p className="text-[10px] uppercase tracking-wider text-primary font-semibold flex items-center gap-1">
              <Globe2 className="h-3 w-3" /> Foreign Business KYB
            </p>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Country of Registration <span className="text-destructive">*</span>
                </Label>
                <Input
                  value={foreignKYB.countryOfRegistration}
                  onChange={e => setForeignKYB(p => ({ ...p, countryOfRegistration: e.target.value }))}
                  placeholder="e.g. United Kingdom"
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Company Reg. No. <span className="text-destructive">*</span>
                </Label>
                <Input
                  value={foreignKYB.companyRegistrationNumber}
                  onChange={e => setForeignKYB(p => ({ ...p, companyRegistrationNumber: e.target.value }))}
                  placeholder="e.g. UK-CRN-12345"
                  className="h-8 text-xs font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Declared Remittance Purpose
                </Label>
                <Select
                  value={foreignKYB.declaredRemittancePurpose}
                  onValueChange={v => setForeignKYB(p => ({ ...p, declaredRemittancePurpose: v as RemittancePurpose }))}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PURPOSES.map(p => (
                      <SelectItem key={p} value={p} className="text-xs">{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Avg. Monthly Volume
                </Label>
                <Input
                  type="number"
                  value={foreignKYB.averageMonthlyTransferVolumeNGN}
                  onChange={e => setForeignKYB(p => ({ ...p, averageMonthlyTransferVolumeNGN: Number(e.target.value) || 0 }))}
                  className="h-8 text-xs tabular-nums"
                />
                <p className="text-[10px] text-muted-foreground">{formatNGN(foreignKYB.averageMonthlyTransferVolumeNGN)}</p>
              </div>
            </div>

            {/* Beneficial Owners */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Beneficial Owners ({foreignKYB.beneficialOwners.length}/5)
                </Label>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-6 px-2 text-[10px] gap-1"
                  onClick={addOwner}
                  disabled={foreignKYB.beneficialOwners.length >= 5}
                >
                  <Plus className="h-3 w-3" /> Add
                </Button>
              </div>
              <div className="space-y-1.5">
                {foreignKYB.beneficialOwners.length === 0 && (
                  <p className="text-[10px] text-muted-foreground italic">No beneficial owners declared.</p>
                )}
                {foreignKYB.beneficialOwners.map(owner => (
                  <div key={owner.id} className="flex items-center gap-1.5 rounded-md border bg-card p-1.5">
                    <Input
                      value={owner.name}
                      onChange={e => updateOwner(owner.id, { name: e.target.value })}
                      placeholder="Owner name"
                      className="h-7 text-xs flex-1"
                    />
                    <Input
                      type="number"
                      value={owner.ownershipPct}
                      onChange={e => updateOwner(owner.id, { ownershipPct: Number(e.target.value) || 0 })}
                      className="h-7 text-xs w-16 tabular-nums"
                      placeholder="%"
                    />
                    <Select
                      value={owner.pepStatus}
                      onValueChange={v => updateOwner(owner.id, { pepStatus: v as BeneficialOwner['pepStatus'] })}
                    >
                      <SelectTrigger className={`h-7 text-[10px] w-20 px-1.5 ${pepBadgeClass[owner.pepStatus]}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Clear" className="text-xs">PEP: Clear</SelectItem>
                        <SelectItem value="Match" className="text-xs">PEP: Match</SelectItem>
                        <SelectItem value="Pending" className="text-xs">PEP: Pending</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 shrink-0"
                      onClick={() => removeOwner(owner.id)}
                      aria-label="Remove owner"
                    >
                      <Trash2 className="h-3 w-3 text-muted-foreground" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="space-y-1.5">
          <p className="text-muted-foreground text-xs">Registered Address</p>
          <p className="text-sm text-foreground">{customer.address}</p>
        </div>
      </CardContent>
    </Card>
  );
}
