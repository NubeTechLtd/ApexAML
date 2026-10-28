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
import { useDemoDataset, demoActions, useDemoCollection } from '@/data-layer/demoDataset';
import { useAuditLog } from '@/hooks/useAuditLog';

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


const validationBadgeClass: Record<string, string> = {
  Validated: 'bg-[hsl(var(--risk-low)/0.15)] text-[hsl(var(--risk-low))] border-0',
  Pending: 'bg-[hsl(var(--risk-medium)/0.15)] text-[hsl(var(--risk-medium))] border-0',
  Overdue: 'bg-[hsl(var(--risk-critical)/0.15)] text-[hsl(var(--risk-critical))] border-0',
};

const formatNaira = (v: number) => '₦' + v.toLocaleString('en-NG');

export function RulesTable() {
  const { rules: allRules } = useDemoDataset();
  const [deletedIds, setDeletedIds] = useDemoCollection<string[]>('deleted_rules', () => []);
  const rules = allRules.filter(r => !deletedIds.includes(r.id));
  const { append } = useAuditLog();
  const [search, setSearch] = useState('');
  const { toast } = useToast();

  const filtered = rules.filter(r =>
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    r.typology.toLowerCase().includes(search.toLowerCase()) ||
    r.id.toLowerCase().includes(search.toLowerCase())
  );

  const pauseRule = (id: string) => {
    const rule = rules.find(r => r.id === id);
    if (!rule) return;
    demoActions.setRuleEnabled(id, !rule.enabled);
    void append({ action: rule.enabled ? 'RULE_PAUSED' : 'RULE_RESUMED', analyst: '', caseId: id, justification: `"${rule.name}" ${rule.enabled ? 'paused' : 'resumed'} from the rules table.` }).catch(() => undefined);
    toast({ title: rule?.enabled ? 'Rule Paused' : 'Rule Resumed', description: `"${rule?.name}" updated.` });
  };

  const deleteRule = (id: string) => {
    const rule = rules.find(r => r.id === id);
    setDeletedIds(prev => [...prev, id]);
    void append({ action: 'RULE_DELETED', analyst: '', caseId: id, justification: `"${rule?.name}" removed from the rules table.` }).catch(() => undefined);
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
