import { useState, useMemo } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Users, Search, Filter, ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Customer360Content } from '@/components/customer360/Customer360Content';

type Customer = typeof customers[number];
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
    let result = customers.filter(c =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.bvn.includes(search)
    );
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
  }, [search, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleSearchChange = (val: string) => {
    setSearch(val);
    setPage(1);
  };

  const handlePageSizeChange = (val: string) => {
    setPageSize(Number(val));
    setPage(1);
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <main className="flex-1 p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <Users className="h-6 w-6" /> Customers
              </h1>
              <p className="text-sm text-muted-foreground mt-1">Manage customer profiles, risk levels, and KYC tiers</p>
            </div>
            <ThemeToggle />
          </div>

          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search by name or BVN..." className="pl-9" value={search} onChange={e => handleSearchChange(e.target.value)} />
            </div>
            <button className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-sm text-muted-foreground hover:bg-accent">
              <Filter className="h-3.5 w-3.5" /> Filter
            </button>
          </div>

          <div className="rounded-xl border border-border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
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
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginated.map((c) => (
                  <TableRow key={c.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedId(c.id)}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{c.bvn}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={riskColors[c.riskLevel]}>{c.riskLevel}</Badge>
                    </TableCell>
                    <TableCell>{c.kycTier}</TableCell>
                    <TableCell className="text-right">{c.alerts}</TableCell>
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
