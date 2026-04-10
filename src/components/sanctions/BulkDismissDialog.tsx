import { useState, useEffect } from 'react';
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { ShieldCheck } from 'lucide-react';

interface BulkDismissDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  count: number;
  onConfirmed: (justification: string) => void;
}

export function BulkDismissDialog({ open, onOpenChange, count, onConfirmed }: BulkDismissDialogProps) {
  const [justification, setJustification] = useState('');

  useEffect(() => {
    if (!open) setJustification('');
  }, [open]);

  const valid = justification.trim().length >= 20;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-muted-foreground" />
            Bulk Dismiss — {count} match{count > 1 ? 'es' : ''}
          </AlertDialogTitle>
          <AlertDialogDescription>
            You are dismissing {count} match{count > 1 ? 'es' : ''} — each will be logged to the audit trail as a false positive resolution.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-2 pt-1">
          <label className="text-xs font-medium text-muted-foreground">
            Shared justification for all dismissed matches
          </label>
          <Textarea
            rows={3}
            placeholder="Provide justification (min 20 characters)..."
            value={justification}
            onChange={e => setJustification(e.target.value)}
          />
          <p className={`text-xs ${valid ? 'text-emerald-600' : 'text-muted-foreground'}`}>
            {justification.trim().length}/20 characters
          </p>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <Button disabled={!valid} onClick={() => { onConfirmed(justification.trim()); onOpenChange(false); }}>
            Confirm Dismiss
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
