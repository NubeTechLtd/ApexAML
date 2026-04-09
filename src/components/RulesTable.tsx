import { useState } from 'react';
import { Plus, MoreHorizontal, Power, PowerOff, Pencil, Trash2, Search, Filter } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { CreateRuleModal } from '@/components/CreateRuleModal';
import { useToast } from '@/hooks/use-toast';

export interface Rule {
  id: string;
  name: string;
  description: string;
  targetSegment: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  framework: 'banks' | 'fintechs' | 'both';
  conditions: number;
  alertsTriggered: number;
  lastTriggered: string;
  enabled: boolean;
  lastModified: string;
}

const mockRules: Rule[] = [
  {
    id: 'R-001', name: 'High-Velocity Crypto P2P',
    description: 'Detects rapid peer-to-peer crypto transfers exceeding velocity thresholds',
    targetSegment: 'Fintechs/MMOs', severity: 'critical', framework: 'fintechs',
    conditions: 3, alertsTriggered: 47, lastTriggered: '2h ago', enabled: true, lastModified: '2026-04-08',
  },
  {
    id: 'R-002', name: 'Structuring below 5M NGN',
    description: 'Identifies deposits split to avoid ₦5,000,000 reporting threshold',
    targetSegment: 'Tier 1 Accounts', severity: 'high', framework: 'both',
    conditions: 4, alertsTriggered: 124, lastTriggered: '45m ago', enabled: true, lastModified: '2026-04-06',
  },
  {
    id: 'R-003', name: 'PEP Sanction Match',
    description: 'Flags transactions involving politically exposed persons on sanction lists',
    targetSegment: 'All Tiers — Banks', severity: 'critical', framework: 'banks',
    conditions: 2, alertsTriggered: 12, lastTriggered: '1d ago', enabled: true, lastModified: '2026-04-05',
  },
  {
    id: 'R-004', name: 'Dormant Account Reactivation',
    description: 'Alerts when dormant accounts (>12 months) receive large inflows',
    targetSegment: 'Tier 2 & 3 Accounts', severity: 'medium', framework: 'both',
    conditions: 3, alertsTriggered: 31, lastTriggered: '3d ago', enabled: false, lastModified: '2026-03-28',
  },
  {
    id: 'R-005', name: 'Cross-Border Round-Tripping',
    description: 'Detects funds sent abroad and returned via different channels',
    targetSegment: 'Tier 3 — Banks', severity: 'high', framework: 'banks',
    conditions: 5, alertsTriggered: 8, lastTriggered: '5d ago', enabled: true, lastModified: '2026-04-01',
  },
  {
    id: 'R-006', name: 'Rapid Onboarding Abuse',
    description: 'Flags multiple accounts created from same device/IP within 24h',
    targetSegment: 'Fintechs/MMOs', severity: 'medium', framework: 'fintechs',
    conditions: 3, alertsTriggered: 56, lastTriggered: '12h ago', enabled: true, lastModified: '2026-04-03',
  },
];

export function RulesTable() {
  const [rules, setRules] = useState<Rule[]>(mockRules);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const { toast } = useToast();

  const filtered = rules.filter(
    (r) =>
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.targetSegment.toLowerCase().includes(search.toLowerCase()),
  );

  const toggleRule = (id: string) => {
    setRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r)),
    );
    const rule = rules.find((r) => r.id === id);
    toast({
      title: rule?.enabled ? 'Rule Disabled' : 'Rule Enabled',
      description: `"${rule?.name}" has been ${rule?.enabled ? 'disabled' : 'enabled'}.`,
    });
  };

  const deleteRule = (id: string) => {
    const rule = rules.find((r) => r.id === id);
    setRules((prev) => prev.filter((r) => r.id !== id));
    toast({ title: 'Rule Deleted', description: `"${rule?.name}" has been removed.` });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-foreground tracking-tight">
            Transaction Monitoring Rules
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Configure detection scenarios for suspicious activity monitoring.
          </p>
        </div>
        <Button size="sm" className="h-9 gap-1.5 shadow-sm" onClick={() => setModalOpen(true)}>
          <Plus className="h-3.5 w-3.5" /> Create New Rule
        </Button>
      </div>

      {/* Stats Strip */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Rules', value: rules.length, accent: 'text-foreground' },
          { label: 'Active', value: rules.filter((r) => r.enabled).length, accent: 'text-[hsl(var(--risk-low))]' },
          { label: 'Alerts (30d)', value: rules.reduce((s, r) => s + r.alertsTriggered, 0), accent: 'text-[hsl(var(--risk-high))]' },
          { label: 'Critical Rules', value: rules.filter((r) => r.severity === 'critical').length, accent: 'text-[hsl(var(--risk-critical))]' },
        ].map((stat) => (
          <div key={stat.label} className="rounded-lg border bg-card p-4">
            <p className="text-xs text-muted-foreground">{stat.label}</p>
            <p className={`text-2xl font-semibold mt-1 ${stat.accent}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search rules…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 bg-card"
          />
        </div>
        <Button variant="outline" size="sm" className="h-9 gap-1.5">
          <Filter className="h-3.5 w-3.5" /> Filter
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="w-[60px]">Status</TableHead>
              <TableHead>Rule Name</TableHead>
              <TableHead>Target Segment</TableHead>
              <TableHead className="text-center">Triggers (30d)</TableHead>
              <TableHead>Last Triggered</TableHead>
              <TableHead className="w-[50px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((rule) => (
              <TableRow key={rule.id} className={!rule.enabled ? 'opacity-50' : ''}>
                <TableCell>
                  <Switch
                    checked={rule.enabled}
                    onCheckedChange={() => toggleRule(rule.id)}
                    className="scale-75"
                  />
                </TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium text-foreground text-sm">{rule.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{rule.description}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-xs font-normal">
                    {rule.targetSegment}
                  </Badge>
                </TableCell>
                <TableCell className="text-center">
                  <span className="text-sm font-medium text-foreground">{rule.alertsTriggered}</span>
                </TableCell>
                <TableCell>
                  <span className="text-xs text-muted-foreground">{rule.lastTriggered}</span>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem className="gap-2">
                        <Pencil className="h-3.5 w-3.5" /> Edit Rule
                      </DropdownMenuItem>
                      <DropdownMenuItem className="gap-2" onClick={() => toggleRule(rule.id)}>
                        {rule.enabled ? <PowerOff className="h-3.5 w-3.5" /> : <Power className="h-3.5 w-3.5" />}
                        {rule.enabled ? 'Disable' : 'Enable'}
                      </DropdownMenuItem>
                      <DropdownMenuItem className="gap-2 text-destructive" onClick={() => deleteRule(rule.id)}>
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

      <CreateRuleModal open={modalOpen} onOpenChange={setModalOpen} />
    </div>
  );
}
