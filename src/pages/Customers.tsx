import { useState } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Users, Search, Filter } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Customer360Content } from '@/components/customer360/Customer360Content';

const customers = [
  { id: 1, name: 'Adebayo Ogunlesi', bvn: '22345678901', riskLevel: 'High', kycTier: 'Tier 3', alerts: 5 },
  { id: 2, name: 'Chioma Adekunle', bvn: '22345678902', riskLevel: 'Medium', kycTier: 'Tier 2', alerts: 2 },
  { id: 3, name: 'Emeka Obi', bvn: '22345678903', riskLevel: 'Low', kycTier: 'Tier 3', alerts: 0 },
  { id: 4, name: 'Fatima Bello', bvn: '22345678904', riskLevel: 'High', kycTier: 'Tier 1', alerts: 8 },
  { id: 5, name: 'Ibrahim Musa', bvn: '22345678905', riskLevel: 'Low', kycTier: 'Tier 3', alerts: 1 },
  { id: 6, name: 'Ngozi Okafor', bvn: '22345678906', riskLevel: 'Medium', kycTier: 'Tier 2', alerts: 3 },
];

const riskColors: Record<string, string> = {
  High: 'bg-destructive/10 text-destructive border-destructive/20',
  Medium: 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20',
  Low: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20',
};

export default function Customers() {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [search, setSearch] = useState('');

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.bvn.includes(search)
  );

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
              <Input placeholder="Search by name or BVN..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <button className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-sm text-muted-foreground hover:bg-accent">
              <Filter className="h-3.5 w-3.5" /> Filter
            </button>
          </div>

          <div className="rounded-xl border border-border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer Name</TableHead>
                  <TableHead>BVN</TableHead>
                  <TableHead>Risk Level</TableHead>
                  <TableHead>KYC Tier</TableHead>
                  <TableHead className="text-right">Alerts</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((c) => (
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
