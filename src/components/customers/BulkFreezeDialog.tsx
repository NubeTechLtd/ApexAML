import { useState, useEffect } from 'react';
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Snowflake } from 'lucide-react';

interface BulkFreezeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerNames: string[];
  onConfirmed: (justification: string) => void;
}

export function BulkFreezeDialog({ open, onOpenChange, customerNames, onConfirmed }: BulkFreezeDialogProps) {
  const [justification, setJustification] = useState('');
  const [confirmText, setConfirmText] = useState('');

  useEffect(() => {
    if (!open) { setJustification(''); setConfirmText(''); }
  }, [open]);

  const valid = justification.trim().length >= 30 && confirmText === 'CONFIRM FREEZE';

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-lg">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
            <Snowflake className="h-5 w-5" />
            Account Freeze — {customerNames.length} customer{customerNames.length > 1 ? 's' : ''}
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                This action will freeze all accounts, file STRs with the NFIU, and cannot be easily reversed.
              </p>
              <div className="rounded-md border border-destructive/20 bg-destructive/5 p-3 max-h-32 overflow-y-auto">
                <p className="text-xs font-medium text-muted-foreground mb-1.5">Affected customers:</p>
                <div className="flex flex-wrap gap-1">
                  {customerNames.map(n => (
                    <Badge key={n} variant="outline" className="text-xs bg-destructive/10 text-destructive border-destructive/20">{n}</Badge>
                  ))}
                </div>
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-3 pt-2">
          <div>
            <label className="text-xs font-medium text-muted-foreground">
              Analyst justification — this will be submitted to NFIU alongside the STR
            </label>
            <Textarea
              className="mt-1.5"
              rows={3}
              placeholder="Provide detailed justification (min 30 characters)..."
              value={justification}
              onChange={e => setJustification(e.target.value)}
            />
            <p className={`text-xs mt-1 ${justification.trim().length >= 30 ? 'text-emerald-600' : 'text-muted-foreground'}`}>
              {justification.trim().length}/30 characters
            </p>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">
              Type <span className="font-mono font-bold text-destructive">CONFIRM FREEZE</span> to proceed
            </label>
            <Input
              className="mt-1.5 font-mono"
              placeholder="CONFIRM FREEZE"
              value={confirmText}
              onChange={e => setConfirmText(e.target.value)}
            />
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <Button variant="destructive" disabled={!valid} onClick={() => { onConfirmed(justification.trim()); onOpenChange(false); }}>
            <Snowflake className="h-4 w-4 mr-1.5" /> Freeze Accounts
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
