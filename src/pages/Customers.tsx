import { useState, useMemo, useEffect, useRef } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Users, Search, Filter, ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown, Download, ShieldAlert, ShieldCheck, X, UserCheck, Clock, Snowflake } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Customer360Content } from '@/components/customer360/Customer360Content';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

type SortKey = 'name' | 'riskLevel' | 'alerts';
type SortDir = 'asc' | 'desc';

const customers = [
  { id: 1, name: 'Adebayo Ogunlesi', bvn: '22345678901', riskLevel: 'High', kycTier: 'Tier 3', alerts: 5 },
  { id: 2, name: 'Chioma Adekunle', bvn: '22345678902', riskLevel: 'Medium', kycTier: 'Tier 2', alerts: 2 },
  { id: 3, name: 'Emeka Obi', bvn: '22345678903', riskLevel: 'Low', kycTier: 'Tier 3', alerts: 0 },
  { id: 4, name: 'Fatima Bello', bvn: '22345678904', riskLevel: 'High', kycTier: 'Tier 1', alerts: 8 },
  { id: 5, name: 'Ibrahim Musa', bvn: '22345678905', riskLevel: 'Low', kycTier: 'Tier 3', alerts: 1 },
  { id: 6, name: 'Ngozi Okafor', bvn: '22345678906', riskLevel: 'Medium', kycTier: 'Tier 2', alerts: 3 },
  { id: 7, name: 'Olumide Adeyemi', bvn: '22345678907', riskLevel: 'Low', kycTier: 'Tier 3', alerts: 0 },
  { id: 8, name: 'Aisha Yusuf', bvn: '22345678908', riskLevel: 'High', kycTier: 'Tier 2', alerts: 6 },
  { id: 9, name: 'Chinedu Nwosu', bvn: '22345678909', riskLevel: 'Medium', kycTier: 'Tier 1', alerts: 1 },
  { id: 10, name: 'Halima Abdullahi', bvn: '22345678910', riskLevel: 'Low', kycTier: 'Tier 3', alerts: 0 },
  { id: 11, name: 'Tunde Bakare', bvn: '22345678911', riskLevel: 'High', kycTier: 'Tier 2', alerts: 4 },
  { id: 12, name: 'Blessing Eze', bvn: '22345678912', riskLevel: 'Medium', kycTier: 'Tier 3', alerts: 2 },
  { id: 13, name: 'Yemi Alade', bvn: '22345678913', riskLevel: 'Low', kycTier: 'Tier 2', alerts: 0 },
  { id: 14, name: 'Obinna Okechukwu', bvn: '22345678914', riskLevel: 'High', kycTier: 'Tier 1', alerts: 7 },
  { id: 15, name: 'Zainab Mohammed', bvn: '22345678915', riskLevel: 'Medium', kycTier: 'Tier 3', alerts: 1 },
  { id: 16, name: 'Kunle Afolabi', bvn: '22345678916', riskLevel: 'Low', kycTier: 'Tier 2', alerts: 0 },
  { id: 17, name: 'Amina Suleiman', bvn: '22345678917', riskLevel: 'High', kycTier: 'Tier 3', alerts: 9 },
  { id: 18, name: 'Ifeanyi Agu', bvn: '22345678918', riskLevel: 'Medium', kycTier: 'Tier 1', alerts: 3 },
];

const riskColors: Record<string, string> = {
  High: 'bg-destructive/10 text-destructive border-destructive/20',
  Medium: 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20',
  Low: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20',
};

type CustomerStatus = 'Active' | 'Under Review' | 'Frozen';
const statusColors: Record<CustomerStatus, string> = {
  Active: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20',
  'Under Review': 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20',
  Frozen: 'bg-destructive/10 text-destructive border-destructive/20',
};

const RISK_ORDER: Record<string, number> = { High: 3, Medium: 2, Low: 1 };
const PAGE_SIZE_OPTIONS = [5, 10, 20];

function SortIcon({ column, sortKey, sortDir }: { column: SortKey; sortKey: SortKey | null; sortDir: SortDir }) {
  if (sortKey !== column) return <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground/50" />;
  return sortDir === 'asc'
    ? <ArrowUp className="h-3.5 w-3.5 text-foreground" />
    : <ArrowDown className="h-3.5 w-3.5 text-foreground" />;
}

export default function Customers() {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [riskFilter, setRiskFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [checkedIds, setCheckedIds] = useState<Set<number>>(new Set());
  const [statuses, setStatuses] = useState<Record<number, CustomerStatus>>({});
  const searchRef = useRef<HTMLInputElement>(null);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
    setPage(1);
  };

  const filtered = useMemo(() => {
    let result = customers.filter(c => {
      const status: CustomerStatus = statuses[c.id] || 'Active';
      return (c.name.toLowerCase().includes(search.toLowerCase()) || c.bvn.includes(search)) &&
        (riskFilter === 'all' || c.riskLevel === riskFilter) &&
        (statusFilter === 'all' || status === statusFilter);
    });
    if (sortKey) {
      result = [...result].sort((a, b) => {
        let cmp = 0;
        if (sortKey === 'name') cmp = a.name.localeCompare(b.name);
        else if (sortKey === 'riskLevel') cmp = (RISK_ORDER[a.riskLevel] ?? 0) - (RISK_ORDER[b.riskLevel] ?? 0);
        else if (sortKey === 'alerts') cmp = a.alerts - b.alerts;
        return sortDir === 'desc' ? -cmp : cmp;
      });
    }
    return result;
  }, [search, sortKey, sortDir, riskFilter, statusFilter, statuses]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const statusCounts = useMemo(() => {
    const counts = { Active: 0, 'Under Review': 0, Frozen: 0 };
    customers.forEach(c => { counts[statuses[c.id] || 'Active']++; });
    return counts;
  }, [statuses]);

  const allPageChecked = paginated.length > 0 && paginated.every(c => checkedIds.has(c.id));
  const somePageChecked = paginated.some(c => checkedIds.has(c.id));

  const toggleRow = (id: number) => {
    setCheckedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    setCheckedIds(prev => {
      const next = new Set(prev);
      if (allPageChecked) {
        paginated.forEach(c => next.delete(c.id));
      } else {
        paginated.forEach(c => next.add(c.id));
      }
      return next;
    });
  };

  const handleBulkAction = (action: string) => {
    const count = checkedIds.size;
    const names = customers.filter(c => checkedIds.has(c.id)).map(c => c.name);
    const ids = Array.from(checkedIds);
    if (action === 'flag') {
      setStatuses(prev => { const next = { ...prev }; ids.forEach(id => next[id] = 'Under Review'); return next; });
      toast.warning(`Flagged ${count} customer(s) for review`, { description: names.join(', ') });
    } else if (action === 'clear') {
      setStatuses(prev => { const next = { ...prev }; ids.forEach(id => next[id] = 'Active'); return next; });
      toast.success(`Cleared ${count} customer(s)`, { description: names.join(', ') });
    } else if (action === 'escalate') {
      setStatuses(prev => { const next = { ...prev }; ids.forEach(id => next[id] = 'Frozen'); return next; });
      toast.error(`Escalated ${count} customer(s) to compliance`, { description: names.join(', ') });
    }
    setCheckedIds(new Set());
  };

  const handleSearchChange = (val: string) => {
    setSearch(val);
    setPage(1);
  };

  const handlePageSizeChange = (val: string) => {
    setPageSize(Number(val));
    setPage(1);
  };

  const exportCsv = () => {
    const headers = ['Customer Name', 'BVN', 'Risk Level', 'KYC Tier', 'Alerts'];
    const rows = filtered.map(c => [c.name, c.bvn, c.riskLevel, c.kycTier, c.alerts]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'customers_export.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <main className="flex-1 p-6 space-y-6 relative">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <Users className="h-6 w-6" /> Customers
              </h1>
              <p className="text-sm text-muted-foreground mt-1">Manage customer profiles, risk levels, and KYC tiers</p>
            </div>
            <ThemeToggle />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search by name or BVN..." className="pl-9" value={search} onChange={e => handleSearchChange(e.target.value)} />
            </div>

            {([
              { status: 'all' as const, label: 'All', count: customers.length, icon: Users, iconClass: 'text-primary', bgClass: 'bg-primary/10' },
              { status: 'Active' as const, label: 'Active', count: statusCounts.Active, icon: UserCheck, iconClass: 'text-emerald-600', bgClass: 'bg-emerald-500/10' },
              { status: 'Under Review' as const, label: 'Review', count: statusCounts['Under Review'], icon: Clock, iconClass: 'text-yellow-600', bgClass: 'bg-yellow-500/10' },
              { status: 'Frozen' as const, label: 'Frozen', count: statusCounts.Frozen, icon: Snowflake, iconClass: 'text-destructive', bgClass: 'bg-destructive/10' },
            ]).map(({ status, label, count, icon: Icon, iconClass }) => (
              <button
                key={status}
                onClick={() => { setStatusFilter(status === 'all' ? 'all' : (statusFilter === status ? 'all' : status)); setPage(1); }}
                className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs transition-colors ${statusFilter === status ? 'border-primary bg-primary/5 ring-1 ring-primary/20' : 'border-border bg-card hover:bg-muted/50'}`}
              >
                <Icon className={`h-3 w-3 ${iconClass}`} />
                <span className="font-semibold text-foreground">{count}</span>
                <span className="text-muted-foreground">{label}</span>
              </button>
            ))}

            <Select value={riskFilter} onValueChange={(v) => { setRiskFilter(v); setPage(1); }}>
              <SelectTrigger className="h-8 w-[130px] gap-1.5 text-xs">
                <Filter className="h-3 w-3 text-muted-foreground" />
                <SelectValue placeholder="Risk Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Risks</SelectItem>
                <SelectItem value="High">High</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="Low">Low</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs" onClick={exportCsv}>
              <Download className="h-3 w-3" /> Export
            </Button>
          </div>

          <div className="rounded-xl border border-border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox
                      checked={allPageChecked ? true : somePageChecked ? 'indeterminate' : false}
                      onCheckedChange={toggleAll}
                    />
                  </TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => toggleSort('name')}>
                    <span className="inline-flex items-center gap-1.5">Customer Name <SortIcon column="name" sortKey={sortKey} sortDir={sortDir} /></span>
                  </TableHead>
                  <TableHead>BVN</TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => toggleSort('riskLevel')}>
                    <span className="inline-flex items-center gap-1.5">Risk Level <SortIcon column="riskLevel" sortKey={sortKey} sortDir={sortDir} /></span>
                  </TableHead>
                  <TableHead>KYC Tier</TableHead>
                  <TableHead className="text-right cursor-pointer select-none" onClick={() => toggleSort('alerts')}>
                    <span className="inline-flex items-center gap-1.5 justify-end">Alerts <SortIcon column="alerts" sortKey={sortKey} sortDir={sortDir} /></span>
                  </TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginated.map((c) => (
                  <TableRow key={c.id} className={`cursor-pointer hover:bg-muted/50 ${checkedIds.has(c.id) ? 'bg-muted/30' : ''}`}>
                    <TableCell onClick={e => e.stopPropagation()}>
                      <Checkbox checked={checkedIds.has(c.id)} onCheckedChange={() => toggleRow(c.id)} />
                    </TableCell>
                    <TableCell className="font-medium" onClick={() => setSelectedId(c.id)}>{c.name}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground" onClick={() => setSelectedId(c.id)}>{c.bvn}</TableCell>
                    <TableCell onClick={() => setSelectedId(c.id)}>
                      <Badge variant="outline" className={riskColors[c.riskLevel]}>{c.riskLevel}</Badge>
                    </TableCell>
                    <TableCell onClick={() => setSelectedId(c.id)}>{c.kycTier}</TableCell>
                    <TableCell className="text-right" onClick={() => setSelectedId(c.id)}>{c.alerts}</TableCell>
                    <TableCell onClick={() => setSelectedId(c.id)}>
                      <Badge variant="outline" className={statusColors[statuses[c.id] || 'Active']}>{statuses[c.id] || 'Active'}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Pagination footer */}
            <div className="flex items-center justify-between border-t border-border px-4 py-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Showing {((currentPage - 1) * pageSize) + 1}–{Math.min(currentPage * pageSize, filtered.length)} of {filtered.length}</span>
                <span className="text-border">|</span>
                <div className="flex items-center gap-1.5">
                  <span>Rows</span>
                  <Select value={String(pageSize)} onValueChange={handlePageSizeChange}>
                    <SelectTrigger className="h-8 w-[70px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PAGE_SIZE_OPTIONS.map(s => (
                        <SelectItem key={s} value={String(s)}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="icon" className="h-8 w-8" disabled={currentPage <= 1} onClick={() => setPage(p => p - 1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <Button
                    key={p}
                    variant={p === currentPage ? 'default' : 'outline'}
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setPage(p)}
                  >
                    {p}
                  </Button>
                ))}
                <Button variant="outline" size="icon" className="h-8 w-8" disabled={currentPage >= totalPages} onClick={() => setPage(p => p + 1)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Bulk actions bar */}
          <AnimatePresence>
            {checkedIds.size > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 rounded-xl border border-border bg-card px-5 py-3 shadow-lg"
              >
                <span className="text-sm font-medium text-foreground">{checkedIds.size} selected</span>
                <div className="h-4 w-px bg-border" />
                <Button size="sm" variant="outline" className="gap-1.5" onClick={() => handleBulkAction('flag')}>
                  <ShieldAlert className="h-3.5 w-3.5" /> Flag for Review
                </Button>
                <Button size="sm" variant="outline" className="gap-1.5 text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/10" onClick={() => handleBulkAction('clear')}>
                  <ShieldCheck className="h-3.5 w-3.5" /> Clear
                </Button>
                <Button size="sm" variant="destructive" className="gap-1.5" onClick={() => handleBulkAction('escalate')}>
                  <ShieldAlert className="h-3.5 w-3.5" /> Escalate
                </Button>
                <Button size="icon" variant="ghost" className="h-8 w-8 ml-1" onClick={() => setCheckedIds(new Set())}>
                  <X className="h-3.5 w-3.5" />
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      <Sheet open={selectedId !== null} onOpenChange={(open) => !open && setSelectedId(null)}>
        <SheetContent side="right" className="w-[85vw] sm:max-w-[85vw] p-0 overflow-hidden">
          {selectedId !== null && <Customer360Content customerId={selectedId} onClose={() => setSelectedId(null)} />}
        </SheetContent>
      </Sheet>
    </SidebarProvider>
  );
}
