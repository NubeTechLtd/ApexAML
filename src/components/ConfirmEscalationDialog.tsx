import { useState } from 'react';
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useAuditLog, type AuditEntry } from '@/hooks/useAuditLog';
import { ShieldAlert } from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerName: string;
  caseId: string;
  action?: AuditEntry['action'];
  onConfirmed?: () => void;
}

export function ConfirmEscalationDialog({
  open, onOpenChange, customerName, caseId,
  action = 'NFIU_ESCALATION', onConfirmed,
}: Props) {
  const { append } = useAuditLog();
  const [justification, setJustification] = useState('');
  const [confirmed, setConfirmed] = useState(false);

  const isFreeze = action === 'ACCOUNT_FREEZE';
  const title = isFreeze ? 'Account Freeze — Regulatory Action' : 'NFIU Escalation — Regulatory Action';
  const valid = justification.trim().length >= 30 && confirmed;

  const handleConfirm = () => {
    append({ action, analyst: 'mock-analyst-001', caseId, justification: justification.trim() });
    onConfirmed?.();
    setJustification('');
    setConfirmed(false);
    onOpenChange(false);
  };

  const handleOpenChange = (v: boolean) => {
    if (!v) { setJustification(''); setConfirmed(false); }
    onOpenChange(v);
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent className="max-w-lg">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
            <ShieldAlert className="h-5 w-5" /> {title}
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-1 text-sm text-muted-foreground">
              <p><span className="font-semibold text-foreground">{customerName}</span> — Case / Account ID: <span className="font-mono">{caseId}</span></p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="justification" className="text-xs font-medium">
              Analyst justification — this will be submitted to NFIU alongside the STR
            </Label>
            <Textarea
              id="justification"
              placeholder="Describe the AML/CFT risk basis (min 30 characters)…"
              value={justification}
              onChange={e => setJustification(e.target.value)}
              className="min-h-[100px]"
            />
            <p className="text-[11px] text-muted-foreground">
              {justification.trim().length}/30 characters minimum
            </p>
          </div>

          <div className="flex items-start gap-2">
            <Checkbox
              id="confirm-checkbox"
              checked={confirmed}
              onCheckedChange={v => setConfirmed(v === true)}
              className="mt-0.5"
            />
            <Label htmlFor="confirm-checkbox" className="text-xs leading-relaxed cursor-pointer">
              I confirm this is a genuine AML/CFT risk and understand this action will freeze the customer's account and file an STR with the NFIU
            </Label>
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <Button variant="destructive" disabled={!valid} onClick={handleConfirm}>
            Confirm {isFreeze ? 'Freeze' : 'Escalation'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
