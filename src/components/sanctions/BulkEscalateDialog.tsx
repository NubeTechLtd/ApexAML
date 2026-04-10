import { useState, useEffect } from 'react';
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { XCircle } from 'lucide-react';

interface BulkEscalateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  count: number;
  onConfirmed: (justification: string) => void;
}

export function BulkEscalateDialog({ open, onOpenChange, count, onConfirmed }: BulkEscalateDialogProps) {
  const [justification, setJustification] = useState('');
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    if (!open) { setJustification(''); setConfirmed(false); }
  }, [open]);

  const valid = justification.trim().length >= 20 && confirmed;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
            <XCircle className="h-5 w-5" />
            Bulk Escalate — {count} match{count > 1 ? 'es' : ''}
          </AlertDialogTitle>
          <AlertDialogDescription>
            You are confirming {count} sanctions match{count > 1 ? 'es' : ''} as true positives. This will freeze associated accounts and queue STRs for NFIU submission.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-3 pt-1">
          <div>
            <label className="text-xs font-medium text-muted-foreground">
              Shared justification for all escalated matches
            </label>
            <Textarea
              className="mt-1.5"
              rows={3}
              placeholder="Provide justification (min 20 characters)..."
              value={justification}
              onChange={e => setJustification(e.target.value)}
            />
            <p className={`text-xs mt-1 ${justification.trim().length >= 20 ? 'text-emerald-600' : 'text-muted-foreground'}`}>
              {justification.trim().length}/20 characters
            </p>
          </div>
          <div className="flex items-start gap-2.5 rounded-md border border-destructive/20 bg-destructive/5 p-3">
            <Checkbox
              id="severity-ack"
              checked={confirmed}
              onCheckedChange={(v) => setConfirmed(!!v)}
              className="mt-0.5"
            />
            <label htmlFor="severity-ack" className="text-xs text-muted-foreground leading-relaxed cursor-pointer">
              I confirm these are true sanctions matches and understand accounts will be frozen and STRs filed.
            </label>
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <Button variant="destructive" disabled={!valid} onClick={() => { onConfirmed(justification.trim()); onOpenChange(false); }}>
            Confirm Escalation
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
