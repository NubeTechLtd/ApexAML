import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { CheckCircle2, Circle, ArrowRight, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { KYCCustomer } from '@/data/mockKYC';

const TIERS = ['Tier 1', 'Tier 2', 'Tier 3'] as const;

interface Requirement {
  label: string;
  tier: string;
  check: (c: KYCCustomer) => boolean;
}

const REQUIREMENTS: Requirement[] = [
  { label: 'BVN Verified', tier: 'Tier 1', check: c => c.bvnMatch === 'match' },
  { label: 'Phone Number', tier: 'Tier 1', check: c => !!c.phone },
  { label: 'NIN Verified', tier: 'Tier 1', check: c => c.ninMatch === 'match' },
  { label: 'Utility Bill', tier: 'Tier 2', check: c => c.documents.some(d => d.type === 'Proof of Address') },
  { label: 'Home Address', tier: 'Tier 2', check: c => !!c.address },
  { label: 'Employer Info', tier: 'Tier 2', check: c => c.documents.length >= 1 },
  { label: 'Source of Funds', tier: 'Tier 3', check: c => c.documents.some(d => d.type === 'Financial Document') },
  { label: 'Beneficial Ownership', tier: 'Tier 3', check: c => c.documents.some(d => d.type === 'Corporate Registry') },
  { label: 'Face-to-Face / Video KYC', tier: 'Tier 3', check: c => c.livenessCheck === 'pass' && c.livenessConfidence >= 80 },
];

interface TierManagementProps {
  customer: KYCCustomer;
  onTierUpgrade: (newTier: string) => void;
  addAudit: (action: string, detail: string) => void;
}

export function TierManagement({ customer, onTierUpgrade, addAudit }: TierManagementProps) {
  const [dialogOpen, setDialogOpen] = useState(false);

  const currentIdx = TIERS.indexOf(customer.kycTier as typeof TIERS[number]);
  const nextTier = currentIdx < 2 ? TIERS[currentIdx + 1] : null;

  const nextTierReqs = nextTier
    ? REQUIREMENTS.filter(r => {
        const reqIdx = TIERS.indexOf(r.tier as typeof TIERS[number]);
        return reqIdx <= TIERS.indexOf(nextTier);
      })
    : [];

  const allNextMet = nextTier ? nextTierReqs.every(r => r.check(customer)) : false;

  const handleConfirmUpgrade = () => {
    if (!nextTier) return;
    onTierUpgrade(nextTier);
    addAudit('TIER_UPGRADE', `${customer.name} upgraded from ${customer.kycTier} to ${nextTier}`);
    toast.success(`${customer.name} upgraded to ${nextTier}`);
    setDialogOpen(false);
  };

  // Group requirements by tier for display
  const groupedReqs = TIERS.map(tier => ({
    tier,
    reqs: REQUIREMENTS.filter(r => r.tier === tier),
  }));

  return (
    <div className="space-y-3">
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">KYC Tier Management</h3>

      {/* Segmented Tier Indicator */}
      <div className="flex items-center gap-1">
        {TIERS.map((tier, i) => (
          <div key={tier} className="flex items-center gap-1">
            <div className={cn(
              'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors',
              i <= currentIdx
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground'
            )}>
              {i <= currentIdx ? <CheckCircle2 className="h-3 w-3" /> : <Circle className="h-3 w-3" />}
              {tier}
            </div>
            {i < TIERS.length - 1 && (
              <ArrowRight className={cn('h-3.5 w-3.5', i < currentIdx ? 'text-primary' : 'text-muted-foreground/40')} />
            )}
          </div>
        ))}
      </div>

      {/* Requirements Checklist */}
      <div className="space-y-3 rounded-lg border bg-card p-3">
        {groupedReqs.map(({ tier, reqs }) => (
          <div key={tier} className="space-y-1.5">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{tier} Requirements</p>
            {reqs.map(req => {
              const met = req.check(customer);
              return (
                <div key={req.label} className="flex items-center gap-2 py-1 px-2 rounded text-xs">
                  {met ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-[hsl(var(--risk-low))] shrink-0" />
                  ) : (
                    <Circle className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
                  )}
                  <span className={cn(met ? 'text-foreground' : 'text-muted-foreground')}>{req.label}</span>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Upgrade Button */}
      {nextTier ? (
        <Button
          size="sm"
          className="w-full gap-1.5 text-xs"
          disabled={!allNextMet}
          onClick={() => setDialogOpen(true)}
        >
          <ShieldCheck className="h-3.5 w-3.5" />
          Approve Tier Upgrade to {nextTier}
        </Button>
      ) : (
        <p className="text-xs text-center text-muted-foreground py-2">Maximum tier reached.</p>
      )}

      {/* Confirmation Dialog */}
      <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-sm">Confirm Tier Upgrade</AlertDialogTitle>
            <AlertDialogDescription className="text-xs">
              Upgrading <strong>{customer.name}</strong> from <strong>{customer.kycTier}</strong> to{' '}
              <strong>{nextTier}</strong> — this action is irreversible and will be logged to the audit trail.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-xs">Cancel</AlertDialogCancel>
            <AlertDialogAction className="text-xs" onClick={handleConfirmUpgrade}>
              Confirm Upgrade
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
