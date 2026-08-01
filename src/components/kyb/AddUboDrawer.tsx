import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle,
} from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import type { BeneficialOwner, UboRole } from '@/data/mockKYB';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (owner: BeneficialOwner) => void;
}

const roles: UboRole[] = ['Director', 'Shareholder', 'UBO'];

export function AddUboDrawer({ open, onOpenChange, onAdd }: Props) {
  const [fullName, setFullName] = useState('');
  const [bvn, setBvn] = useState('');
  const [nin, setNin] = useState('');
  const [pct, setPct] = useState('');
  const [role, setRole] = useState<UboRole>('UBO');

  const reset = () => { setFullName(''); setBvn(''); setNin(''); setPct(''); setRole('UBO'); };

  const submit = () => {
    const name = fullName.trim();
    const ownership = Number(pct);
    if (name.length < 3) return toast.error('Enter the beneficial owner’s full name.');
    if (!/^\d{11}$/.test(bvn)) return toast.error('BVN must be 11 digits.');
    if (!/^\d{11}$/.test(nin)) return toast.error('NIN must be 11 digits.');
    if (!Number.isFinite(ownership) || ownership <= 0 || ownership > 100) {
      return toast.error('Ownership percentage must be between 1 and 100.');
    }
    onAdd({
      id: `ubo-${Date.now()}`,
      fullName: name.slice(0, 120),
      bvn,
      nin,
      ownershipPct: ownership,
      role,
    });
    reset();
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={o => { onOpenChange(o); if (!o) reset(); }}>
      <SheetContent className="w-full sm:max-w-md flex flex-col">
        <SheetHeader>
          <SheetTitle className="text-base">Add beneficial owner</SheetTitle>
          <SheetDescription className="text-xs">
            CBN AML/CFT Regulations require every natural person holding 25% or more to be identified and verified.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-4 py-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Full name</Label>
            <Input value={fullName} onChange={e => setFullName(e.target.value)} maxLength={120} placeholder="e.g. Chidi Okafor" className="h-9 text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">BVN</Label>
              <Input value={bvn} onChange={e => setBvn(e.target.value.replace(/\D/g, '').slice(0, 11))} inputMode="numeric" placeholder="11 digits" className="h-9 text-sm font-mono" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">NIN</Label>
              <Input value={nin} onChange={e => setNin(e.target.value.replace(/\D/g, '').slice(0, 11))} inputMode="numeric" placeholder="11 digits" className="h-9 text-sm font-mono" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Ownership %</Label>
              <Input value={pct} onChange={e => setPct(e.target.value.replace(/[^\d.]/g, '').slice(0, 5))} inputMode="decimal" placeholder="e.g. 30" className="h-9 text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Role</Label>
              <Select value={role} onValueChange={v => setRole(v as UboRole)}>
                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {roles.map(r => <SelectItem key={r} value={r} className="text-sm">{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <SheetFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button size="sm" onClick={submit}>Add beneficial owner</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
