import { useState } from 'react';
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuditLog } from '@/hooks/useAuditLog';
import { Snowflake } from 'lucide-react';

const FREEZE_REASONS = [
  'Sanctions match',
  'STR filed',
  'Court order',
  'Internal risk decision',
  'CBN directive',
] as const;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerName: string;
  caseId: string;
  bvn: string;
  kycTier: string;
  accountStatus: string;
  onConfirmed: () => void;
}

export function FreezeAccountDialog({
  open, onOpenChange, customerName, caseId, bvn, kycTier, accountStatus, onConfirmed,
}: Props) {
  const { append } = useAuditLog();
  const [justification, setJustification] = useState('');
  const [reason, setReason] = useState('');
  const [confirmed, setConfirmed] = useState(false);

  const valid = justification.trim().length >= 20 && confirmed && reason.length > 0;

  const handleConfirm = () => {
    append({
      action: 'ACCOUNT_FREEZE',
      analyst: 'mock-analyst-001',
      caseId,
      justification: `[${reason}] ${justification.trim()}`,
    });
    onConfirmed();
    reset();
    onOpenChange(false);
  };

  const reset = () => {
    setJustification('');
    setReason('');
    setConfirmed(false);
  };

  const handleOpenChange = (v: boolean) => {
    if (!v) reset();
    onOpenChange(v);
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent className="max-w-lg">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
            <Snowflake className="h-5 w-5" /> Freeze Account — {customerName}
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3 text-sm text-muted-foreground">
              <div className="grid grid-cols-3 gap-2 rounded-md border border-border bg-muted/40 p-3 text-xs">
                <div><span className="font-medium text-foreground">BVN</span><br />{bvn}</div>
                <div><span className="font-medium text-foreground">KYC Tier</span><br />{kycTier}</div>
                <div><span className="font-medium text-foreground">Status</span><br />{accountStatus}</div>
              </div>
              <p className="text-destructive/90 font-medium leading-relaxed">
                This action will immediately suspend all transactions on this account. The customer will be unable to send or receive funds.
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label className="text-xs font-medium">Freeze reason</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger><SelectValue placeholder="Select reason…" /></SelectTrigger>
              <SelectContent>
                {FREEZE_REASONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="freeze-justification" className="text-xs font-medium">Justification</Label>
            <Textarea
              id="freeze-justification"
              placeholder="Describe the basis for this freeze (min 20 characters)…"
              value={justification}
              onChange={e => setJustification(e.target.value)}
              className="min-h-[90px]"
            />
            <p className="text-[11px] text-muted-foreground">{justification.trim().length}/20 characters minimum</p>
          </div>

          <div className="flex items-start gap-2">
            <Checkbox
              id="freeze-confirm"
              checked={confirmed}
              onCheckedChange={v => setConfirmed(v === true)}
              className="mt-0.5"
            />
            <Label htmlFor="freeze-confirm" className="text-xs leading-relaxed cursor-pointer">
              I have the authority to freeze this account under our institution's AML policy
            </Label>
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <Button variant="destructive" disabled={!valid} onClick={handleConfirm}>
            Confirm Freeze
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
