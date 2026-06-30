import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ActiveFilterChip } from '@/components/ActiveFilterChip';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Users, Search, Filter, ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown, Download, ShieldAlert, ShieldCheck, X, UserCheck, Clock, Snowflake, Building2, Globe2, Briefcase, Banknote } from 'lucide-react';
import { customer360Data } from '@/data/mockCustomer360';
import type { EntityType } from '@/data/mockCustomer360';
import { NotificationBell } from '@/components/NotificationBell';
import { ThemeToggle } from '@/components/ThemeToggle';
import { AuditBell } from '@/components/AuditBell';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Customer360Content } from '@/components/customer360/Customer360Content';
import { BulkFreezeDialog } from '@/components/customers/BulkFreezeDialog';
import { BulkConfirmDialog } from '@/components/customers/BulkConfirmDialog';
import { BulkAuditLog, BulkAuditEntry } from '@/components/customers/BulkAuditLog';
import { useAuditLog } from '@/hooks/useAuditLog';
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

const entityIconFor = (type?: EntityType) => {
  switch (type) {
    case 'Foreign Business': return Globe2;
    case 'Nigerian Business': return Building2;
    case 'Sole Trader': return Briefcase;
    case 'IMTO Agent': return Banknote;
    default: return null;
  }
};
const isBusiness = (type?: EntityType) =>
  type === 'Foreign Business' || type === 'Nigerian Business' || type === 'Sole Trader' || type === 'IMTO Agent';
const PAGE_SIZE_OPTIONS = [5, 10, 20];

function SortIcon({ column, sortKey, sortDir }: { column: SortKey; sortKey: SortKey | null; sortDir: SortDir }) {
  if (sortKey !== column) return <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground/50" />;
  return sortDir === 'asc'
    ? <ArrowUp className="h-3.5 w-3.5 text-foreground" />
    : <ArrowDown className="h-3.5 w-3.5 text-foreground" />;
}

export default function Customers() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const riskParam = searchParams.get('risk');
  const statusParam = searchParams.get('status');
  const [riskFilter, setRiskFilter] = useState<string>(riskParam || 'all');
  const [statusFilter, setStatusFilter] = useState<string>(statusParam || 'all');
  const [checkedIds, setCheckedIds] = useState<Set<number>>(new Set());
  const [statuses, setStatuses] = useState<Record<number, CustomerStatus>>({});

  const activeFilterLabel = riskParam ? `${riskParam} risk` : statusParam ? `${statusParam} customers` : null;
  const clearFilterParams = useCallback(() => {
    setSearchParams({});
    setRiskFilter('all');
    setStatusFilter('all');
  }, [setSearchParams]);
  const [bulkFreezeOpen, setBulkFreezeOpen] = useState(false);
  const [bulkFlagOpen, setBulkFlagOpen] = useState(false);
  const [bulkClearOpen, setBulkClearOpen] = useState(false);
  const [bulkAuditEntries, setBulkAuditEntries] = useState<BulkAuditEntry[]>([]);
  const { append } = useAuditLog();
  const searchRef = useRef<HTMLInputElement>(null);
  const undoRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchRef.current?.focus();
      }
      if (e.key === 'Escape') {
        if (selectedId !== null) {
          setSelectedId(null);
        } else if (search || riskFilter !== 'all' || statusFilter !== 'all') {
          setSearch('');
          setRiskFilter('all');
          setStatusFilter('all');
          setPage(1);
          searchRef.current?.blur();
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [selectedId, search, riskFilter, statusFilter]);

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

  const selectedNames = useMemo(() => customers.filter(c => checkedIds.has(c.id)).map(c => c.name), [checkedIds]);
  const selectedIds = useMemo(() => Array.from(checkedIds), [checkedIds]);

  const applyBulkAction = useCallback((action: 'flag' | 'clear' | 'escalate', justification?: string) => {
    const ids = Array.from(checkedIds);
    const names = customers.filter(c => checkedIds.has(c.id)).map(c => c.name);
    const prevStatuses = { ...statuses };
    const newStatus: CustomerStatus = action === 'flag' ? 'Under Review' : action === 'clear' ? 'Active' : 'Frozen';
    setStatuses(prev => { const next = { ...prev }; ids.forEach(id => next[id] = newStatus); return next; });

    const auditEntry: BulkAuditEntry = {
      id: crypto.randomUUID(), timestamp: new Date().toISOString(),
      type: action, analyst: 'mock-analyst-001', customers: names, justification,
    };

    if (action === 'escalate') {
      toast.error(`Froze ${names.length} customer account(s)`, {
        description: names.join(', '), duration: 5000,
        action: { label: 'Undo', onClick: () => { setStatuses(prevStatuses); if (undoRef.current) clearTimeout(undoRef.current); toast.info('Freeze undone'); } },
      });
      undoRef.current = setTimeout(() => {
        setBulkAuditEntries(prev => [...prev, auditEntry]);
        append({ action: 'ACCOUNT_FREEZE', analyst: 'mock-analyst-001', caseId: `BULK-${ids.join('-')}`, justification: justification || '' });
      }, 5000);
    } else {
      setBulkAuditEntries(prev => [...prev, auditEntry]);
      (action === 'flag' ? toast.warning : toast.success)(`${action === 'flag' ? 'Flagged' : 'Cleared'} ${names.length} customer(s)`, { description: names.join(', ') });
    }
    setCheckedIds(new Set());
  }, [checkedIds, statuses, append]);

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
                <Users className="h-6 w-6" /> Customer Risk Profiles
              </h1>
              <p className="text-sm text-muted-foreground mt-1">Monitor customer risk levels and manage KYC compliance</p>
            </div>
            <div className="flex items-center gap-2">
              <AuditBell />
              <NotificationBell />
              <ThemeToggle />
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input ref={searchRef} placeholder="Search by name or BVN... (⌘K)" className="pl-9" value={search} onChange={e => handleSearchChange(e.target.value)} />
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
            <BulkAuditLog entries={bulkAuditEntries} />
          </div>

          {activeFilterLabel && (
            <div className="flex items-center">
              <ActiveFilterChip label={activeFilterLabel} onClear={clearFilterParams} />
            </div>
          )}

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
                    <TableCell className="font-medium" onClick={() => setSelectedId(c.id)}>
                      {(() => {
                        const et = customer360Data[c.id]?.entityType;
                        const Icon = entityIconFor(et);
                        return (
                          <span className="inline-flex items-center gap-1.5">
                            {Icon && (
                              <span
                                className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-primary/10 text-primary shrink-0"
                                title={et}
                                aria-label={et}
                              >
                                <Icon className="h-3 w-3" />
                              </span>
                            )}
                            <span>{c.name}</span>
                            {isBusiness(et) && (
                              <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 bg-primary/5 text-primary border-primary/20">
                                {et}
                              </Badge>
                            )}
                          </span>
                        );
                      })()}
                    </TableCell>
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
                <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setBulkFlagOpen(true)}>
                  <ShieldAlert className="h-3.5 w-3.5" /> Flag for Review
                </Button>
                <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setBulkClearOpen(true)}>
                  <ShieldCheck className="h-3.5 w-3.5" /> Clear
                </Button>
                <Button size="sm" variant="destructive" className="gap-1.5" onClick={() => setBulkFreezeOpen(true)}>
                  <Snowflake className="h-3.5 w-3.5" /> Freeze / Escalate
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
      <BulkConfirmDialog open={bulkFlagOpen} onOpenChange={setBulkFlagOpen} action="flag" customerNames={selectedNames} onConfirmed={() => applyBulkAction('flag')} />
      <BulkConfirmDialog open={bulkClearOpen} onOpenChange={setBulkClearOpen} action="clear" customerNames={selectedNames} onConfirmed={() => applyBulkAction('clear')} />
      <BulkFreezeDialog open={bulkFreezeOpen} onOpenChange={setBulkFreezeOpen} customerNames={selectedNames} onConfirmed={(j) => applyBulkAction('escalate', j)} />
    </SidebarProvider>
  );
}
