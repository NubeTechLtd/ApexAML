import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { ShieldAlert, ShieldCheck } from 'lucide-react';

interface BulkConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  action: 'flag' | 'clear';
  customerNames: string[];
  onConfirmed: () => void;
}

const config = {
  flag: {
    title: 'Flag for Review',
    description: 'Mark the following customers for compliance review. They will be moved to "Under Review" status.',
    icon: ShieldAlert,
    iconClass: 'text-yellow-600',
    badgeClass: 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20',
    confirmLabel: 'Flag for Review',
    confirmVariant: 'default' as const,
  },
  clear: {
    title: 'Clear Customers',
    description: 'Clear the following customers and restore them to "Active" status.',
    icon: ShieldCheck,
    iconClass: 'text-emerald-600',
    badgeClass: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20',
    confirmLabel: 'Clear Customers',
    confirmVariant: 'default' as const,
  },
};

export function BulkConfirmDialog({ open, onOpenChange, action, customerNames, onConfirmed }: BulkConfirmDialogProps) {
  const c = config[action];
  const Icon = c.icon;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Icon className={`h-5 w-5 ${c.iconClass}`} />
            {c.title} — {customerNames.length} customer{customerNames.length > 1 ? 's' : ''}
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">{c.description}</p>
              <div className="rounded-md border border-border bg-muted/30 p-3 max-h-32 overflow-y-auto">
                <div className="flex flex-wrap gap-1">
                  {customerNames.map(n => (
                    <Badge key={n} variant="outline" className={`text-xs ${c.badgeClass}`}>{n}</Badge>
                  ))}
                </div>
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirmed}>{c.confirmLabel}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
