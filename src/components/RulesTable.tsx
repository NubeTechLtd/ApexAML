import { useState } from 'react';
import { MoreHorizontal, Pencil, Pause, Trash2, FlaskConical, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export interface Rule {
  id: string;
  name: string;
  typology: string;
  threshold: number;
  alertsTriggered7d: number;
  falsePositivePct: number;
  validationStatus: 'Validated' | 'Pending' | 'Overdue';
  lastValidated: string;
  enabled: boolean;
}

const mockRules: Rule[] = [
  { id: 'R-001', name: 'POS Round-Trip Detection', typology: 'POS Round-Trip', threshold: 5000000, alertsTriggered7d: 47, falsePositivePct: 12, validationStatus: 'Validated', lastValidated: '2026-02-15', enabled: true },
  { id: 'R-002', name: 'BDC Smurfing Pattern', typology: 'BDC Smurfing', threshold: 4900000, alertsTriggered7d: 124, falsePositivePct: 28, validationStatus: 'Overdue', lastValidated: '2025-01-20', enabled: true },
  { id: 'R-003', name: 'USSD Layering Monitor', typology: 'USSD Layering', threshold: 2000000, alertsTriggered7d: 31, falsePositivePct: 18, validationStatus: 'Validated', lastValidated: '2026-03-10', enabled: true },
  { id: 'R-004', name: 'Dormant Account Activation', typology: 'Dormant Activation', threshold: 10000000, alertsTriggered7d: 8, falsePositivePct: 5, validationStatus: 'Pending', lastValidated: '2025-11-05', enabled: true },
  { id: 'R-005', name: 'Crypto P2P Velocity', typology: 'Crypto P2P', threshold: 3000000, alertsTriggered7d: 56, falsePositivePct: 22, validationStatus: 'Validated', lastValidated: '2026-01-28', enabled: false },
  { id: 'R-006', name: 'Salary Mule Detection', typology: 'Salary Mule', threshold: 1500000, alertsTriggered7d: 19, falsePositivePct: 35, validationStatus: 'Overdue', lastValidated: '2024-12-01', enabled: true },
  { id: 'R-007', name: 'Real Estate Front Flows', typology: 'Real Estate Front', threshold: 50000000, alertsTriggered7d: 3, falsePositivePct: 8, validationStatus: 'Pending', lastValidated: '2025-09-15', enabled: true },
  { id: 'R-008', name: 'PEP Spending Spike', typology: 'PEP Spending Spike', threshold: 20000000, alertsTriggered7d: 12, falsePositivePct: 15, validationStatus: 'Validated', lastValidated: '2026-03-22', enabled: true },
  { id: 'R-009', name: 'Cash Limit Smurfing Detector — $200 CBN Threshold', typology: 'IMTO Cash Smurfing', threshold: 316000, alertsTriggered7d: 23, falsePositivePct: 9, validationStatus: 'Validated', lastValidated: '2026-04-01', enabled: true },
  { id: 'R-010', name: 'IMTO Outbound Transfer Violation', typology: 'IMTO Direction Check', threshold: 1, alertsTriggered7d: 2, falsePositivePct: 0, validationStatus: 'Validated', lastValidated: '2026-04-05', enabled: true },
  { id: 'R-011', name: 'IMTO Non-Naira Settlement Violation', typology: 'IMTO FX Settlement', threshold: 1, alertsTriggered7d: 1, falsePositivePct: 0, validationStatus: 'Validated', lastValidated: '2026-04-05', enabled: true },
  { id: 'R-012', name: 'IMTO → BDC Round-Trip Detector (48h)', typology: 'BDC Round-Tripping', threshold: 1000000, alertsTriggered7d: 4, falsePositivePct: 11, validationStatus: 'Validated', lastValidated: '2026-04-02', enabled: true },
];

const validationBadgeClass: Record<string, string> = {
  Validated: 'bg-[hsl(var(--risk-low)/0.15)] text-[hsl(var(--risk-low))] border-0',
  Pending: 'bg-[hsl(var(--risk-medium)/0.15)] text-[hsl(var(--risk-medium))] border-0',
  Overdue: 'bg-[hsl(var(--risk-critical)/0.15)] text-[hsl(var(--risk-critical))] border-0',
};

const formatNaira = (v: number) => '₦' + v.toLocaleString('en-NG');

export function RulesTable() {
  const [rules, setRules] = useState<Rule[]>(mockRules);
  const [search, setSearch] = useState('');
  const { toast } = useToast();

  const filtered = rules.filter(r =>
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    r.typology.toLowerCase().includes(search.toLowerCase()) ||
    r.id.toLowerCase().includes(search.toLowerCase())
  );

  const pauseRule = (id: string) => {
    setRules(prev => prev.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));
    const rule = rules.find(r => r.id === id);
    toast({ title: rule?.enabled ? 'Rule Paused' : 'Rule Resumed', description: `"${rule?.name}" updated.` });
  };

  const deleteRule = (id: string) => {
    const rule = rules.find(r => r.id === id);
    setRules(prev => prev.filter(r => r.id !== id));
    toast({ title: 'Rule Deleted', description: `"${rule?.name}" removed.` });
  };

  const sandboxTest = (rule: Rule) => {
    toast({ title: 'Sandbox Test Started', description: `Running "${rule.name}" against 30-day historical data…` });
  };

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search rules…" value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9 bg-card" />
      </div>

      <div className="rounded-lg border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="text-xs">Rule ID</TableHead>
              <TableHead className="text-xs">Name</TableHead>
              <TableHead className="text-xs">Typology</TableHead>
              <TableHead className="text-xs text-right">Threshold</TableHead>
              <TableHead className="text-xs text-center">Alerts (7d)</TableHead>
              <TableHead className="text-xs text-center">FP %</TableHead>
              <TableHead className="text-xs">CBN Validation</TableHead>
              <TableHead className="text-xs">Last Validated</TableHead>
              <TableHead className="w-[50px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(rule => (
              <TableRow key={rule.id} className={cn(!rule.enabled && 'opacity-50')}>
                <TableCell className="text-xs font-mono text-muted-foreground">{rule.id}</TableCell>
                <TableCell className="text-sm font-medium text-foreground">{rule.name}</TableCell>
                <TableCell><Badge variant="outline" className="text-[11px] font-normal">{rule.typology}</Badge></TableCell>
                <TableCell className="text-sm text-right font-medium text-foreground">{formatNaira(rule.threshold)}</TableCell>
                <TableCell className="text-sm text-center font-medium text-foreground">{rule.alertsTriggered7d}</TableCell>
                <TableCell className="text-sm text-center">
                  <span className={cn('font-medium', rule.falsePositivePct > 25 ? 'text-[hsl(var(--risk-high))]' : 'text-foreground')}>
                    {rule.falsePositivePct}%
                  </span>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={cn('text-[10px] font-semibold', validationBadgeClass[rule.validationStatus])}>
                    {rule.validationStatus}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {new Date(rule.lastValidated).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem className="gap-2 text-xs"><Pencil className="h-3.5 w-3.5" /> Edit</DropdownMenuItem>
                      <DropdownMenuItem className="gap-2 text-xs" onClick={() => pauseRule(rule.id)}>
                        <Pause className="h-3.5 w-3.5" /> {rule.enabled ? 'Pause' : 'Resume'}
                      </DropdownMenuItem>
                      <DropdownMenuItem className="gap-2 text-xs" onClick={() => sandboxTest(rule)}>
                        <FlaskConical className="h-3.5 w-3.5" /> Run Sandbox Test
                      </DropdownMenuItem>
                      <DropdownMenuItem className="gap-2 text-xs text-destructive" onClick={() => deleteRule(rule.id)}>
                        <Trash2 className="h-3.5 w-3.5" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
