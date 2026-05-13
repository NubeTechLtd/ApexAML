import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ShieldAlert, Snowflake, Download, ChevronDown, X, ExternalLink, StickyNote } from 'lucide-react';
import { customer360Data } from '@/data/mockCustomer360';
import { mockLegacyAlerts as mockAlerts } from '@/data/mockLegacyAlerts';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { Customer360IdentityCard } from './IdentityCard';
import { Customer360RiskRadar } from './RiskRadar';
import { Customer360Entities } from './EntitiesCard';
import { Customer360Tabs } from './DeepDiveTabs';
import { ConfirmEscalationDialog } from '@/components/ConfirmEscalationDialog';
import { FreezeAccountDialog } from '@/components/FreezeAccountDialog';
import { AddNoteSheet, type ComplianceNote } from './AddNoteSheet';

const riskColors: Record<string, string> = {
  High: 'bg-destructive/10 text-destructive border-destructive/20',
  Medium: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20',
  Low: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
};

interface Props {
  customerId: number;
  onClose?: () => void;
}

export function Customer360Content({ customerId, onClose }: Props) {
  const navigate = useNavigate();
  const customer = customer360Data[customerId];
  const [freezeOpen, setFreezeOpen] = useState(false);
  const [escalateOpen, setEscalateOpen] = useState(false);
  const [accountStatus, setAccountStatus] = useState(customer?.accountStatus ?? 'Active');
  const [noteSheetOpen, setNoteSheetOpen] = useState(false);
  const [notes, setNotes] = useState<ComplianceNote[]>([]);
  const [activeTab, setActiveTab] = useState('transactions');
  const [filterNotesOnly, setFilterNotesOnly] = useState(false);

  const handleNoteBadgeClick = () => {
    setActiveTab('audit');
    setFilterNotesOnly(true);
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (tab !== 'audit') setFilterNotesOnly(false);
  };

  if (!customer) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-3">
          <ShieldAlert className="h-12 w-12 text-muted-foreground mx-auto" />
          <h2 className="text-xl font-semibold text-foreground">Customer not found</h2>
        </div>
      </div>
    );
  }

  const customerAlerts = mockAlerts.filter(a => a.customer360Id === customer.id);

  return (
    <div className="flex flex-col h-full overflow-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-lg">
              {customer.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-foreground">{customer.name}</h2>
                {notes.length > 0 && (
                  <button onClick={handleNoteBadgeClick} className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary px-2 py-0.5 text-xs font-semibold hover:bg-primary/20 transition-colors">
                    <StickyNote className="h-3 w-3" /> {notes.length}
                  </button>
                )}
                <Badge variant="outline" className={`text-sm px-3 py-1 ${riskColors[customer.riskLevel]}`}>
                  Risk: {customer.riskLevel.toUpperCase()} ({customer.riskScore}/100)
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {customer.kycTier} Account • {customer.bvnVerified ? 'BVN Verified' : 'BVN Unverified'} • {accountStatus === 'Frozen' ? (<span className="inline-flex items-center gap-1 text-destructive font-semibold"><Snowflake className="h-3 w-3" />Frozen</span>) : accountStatus}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => navigate(`/customers/${customerId}`)}
            >
              <ExternalLink className="h-3.5 w-3.5" /> Open Full Page
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setNoteSheetOpen(true)}>
              <StickyNote className="h-3.5 w-3.5" /> Add Note
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5">
                  Actions <ChevronDown className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setFreezeOpen(true)}>
                  <Snowflake className="h-4 w-4 mr-2" /> Freeze Account
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setEscalateOpen(true)}>
                  <ShieldAlert className="h-4 w-4 mr-2" /> Trigger EDD / Escalate
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => toast.success('NFIU profile downloaded')}>
                  <Download className="h-4 w-4 mr-2" /> Download NFIU Profile
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            {onClose && (
              <Button variant="ghost" size="icon" onClick={onClose} className="ml-1">
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <Customer360IdentityCard customer={customer} />
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Customer360RiskRadar radarScores={customer.radarScores} riskLevel={customer.riskLevel} />
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <Customer360Entities entities={customer.connectedEntities} customerName={customer.name} />
          </motion.div>
        </div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Customer360Tabs
            customer={customer}
            customerAlerts={customerAlerts}
            notes={notes}
            activeTab={activeTab}
            onTabChange={handleTabChange}
            filterNotesOnly={filterNotesOnly}
          />
        </motion.div>
      </div>

      <FreezeAccountDialog
        open={freezeOpen}
        onOpenChange={setFreezeOpen}
        customerName={customer.name}
        caseId={`ACCT-${customerId}`}
        bvn={customer.bvn || '22012345678'}
        kycTier={customer.kycTier}
        accountStatus={accountStatus}
        onConfirmed={() => {
          setAccountStatus('Frozen');
          toast.warning('Account frozen — Ref: FRZ-2026-0089');
        }}
      />
      <ConfirmEscalationDialog
        open={escalateOpen}
        onOpenChange={setEscalateOpen}
        customerName={customer.name}
        caseId={`ACCT-${customerId}`}
        action="NFIU_ESCALATION"
        onConfirmed={() => toast.error('Escalated to NFIU')}
      />
      <AddNoteSheet
        open={noteSheetOpen}
        onOpenChange={setNoteSheetOpen}
        onSave={(note) => {
          setNotes(prev => [...prev, note]);
          toast.success('Compliance note saved');
        }}
      />
    </div>
  );
}
