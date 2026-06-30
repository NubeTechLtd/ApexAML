import { useState, useMemo } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { ThemeToggle } from '@/components/ThemeToggle';
import { NotificationBell } from '@/components/NotificationBell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { Tag, Banknote, Building2, Search, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import {
  mockSettlementAccounts,
  isIMTOSettlement,
  type ManagedAccount,
  type IMTOSettlementAccount,
} from '@/data/mockSettlementAccounts';

/** Distinct teal token used for the IMTO Settlement badge. */
const tealBadge =
  'bg-teal-500/15 text-teal-700 dark:text-teal-300 border-teal-500/30';

function formatNaira(v: number) {
  return '₦' + v.toLocaleString('en-NG');
}

interface TagDialogProps {
  account: ManagedAccount;
  onTag: (acc: IMTOSettlementAccount) => void;
}

function TagAsIMTODialog({ account, onTag }: TagDialogProps) {
  const [open, setOpen] = useState(false);
  const [imtoName, setImtoName] = useState('');
  const [licence, setLicence] = useState('');
  const [correspondents, setCorrespondents] = useState('');
  const [activation, setActivation] = useState(
    new Date().toISOString().slice(0, 10),
  );

  const submit = () => {
    if (!imtoName || !licence || !correspondents) {
      toast.error('All fields are required to tag a settlement account.');
      return;
    }
    onTag({
      id: account.id,
      nuban: account.nuban,
      partnerBank: account.partnerBank,
      isIMTOSettlement: true,
      imtoName,
      cbnLicenceNumber: licence,
      approvedCorrespondents: correspondents
        .split('\n')
        .map(s => s.trim())
        .filter(Boolean),
      activationDate: activation,
      recentCredits: [],
    });
    toast.success(`Account ${account.nuban} tagged as IMTO Settlement`, {
      description: `Operator: ${imtoName} · Licence: ${licence}`,
    });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5">
          <Tag className="h-3 w-3" /> Register as IMTO designated settlement account
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Tag Account as IMTO Designated Settlement</DialogTitle>
          <DialogDescription>
            NUBAN <span className="font-mono">{account.nuban}</span> at{' '}
            {account.partnerBank}. This metadata is used by the
            <span className="font-medium"> IMTO_ACCOUNT_COMMINGLING</span> rule
            to detect non-remittance credits.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="imto-name" className="text-xs">
              IMTO operator name
            </Label>
            <Input
              id="imto-name"
              placeholder="WorldRemit, LemFi, Sendwave…"
              value={imtoName}
              onChange={e => setImtoName(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="licence" className="text-xs">
              CBN IMTO licence number
            </Label>
            <Input
              id="licence"
              placeholder="CBN/IMTO/2024/00xxx"
              value={licence}
              onChange={e => setLicence(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="correspondents" className="text-xs">
              Approved correspondent banks (one per line)
            </Label>
            <Textarea
              id="correspondents"
              rows={4}
              placeholder={'WorldRemit Ltd (UK)\nWorldRemit Corp (US)'}
              value={correspondents}
              onChange={e => setCorrespondents(e.target.value)}
              className="font-mono text-xs"
            />
            <p className="text-[10px] text-muted-foreground">
              Only credits originating from these entities will be considered
              approved remittance settlement.
            </p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="activation" className="text-xs">
              Account activation date
            </Label>
            <Input
              id="activation"
              type="date"
              value={activation}
              onChange={e => setActivation(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={submit}>
            <ShieldCheck className="h-3.5 w-3.5 mr-1.5" />
            Apply IMTO Settlement Tag
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AccountsPage() {
  const [accounts, setAccounts] = useState<ManagedAccount[]>(mockSettlementAccounts);
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return accounts;
    return accounts.filter(a => {
      const meta = isIMTOSettlement(a)
        ? `${a.imtoName} ${a.cbnLicenceNumber}`
        : a.accountName;
      return (
        a.nuban.includes(q) ||
        a.partnerBank.toLowerCase().includes(q) ||
        meta.toLowerCase().includes(q)
      );
    });
  }, [accounts, search]);

  const tagged = accounts.filter(isIMTOSettlement).length;

  const handleTag = (next: IMTOSettlementAccount) => {
    setAccounts(prev => prev.map(a => (a.id === next.id ? next : a)));
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-14 flex items-center justify-between border-b px-4 bg-card">
            <div className="flex items-center gap-2">
              <SidebarTrigger />
              <h1 className="text-sm font-semibold text-foreground">Accounts</h1>
              <span className="text-xs text-muted-foreground">
                — Settlement &amp; operating account registry
              </span>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <NotificationBell />
            </div>
          </header>

          <main className="flex-1 overflow-y-auto p-6 bg-background space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                    <Banknote className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">
                      IMTO Settlement Accounts
                    </p>
                    <p className="text-xl font-semibold">{tagged}</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Total accounts</p>
                    <p className="text-xl font-semibold">{accounts.length}</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                    <ShieldCheck className="h-5 w-5 text-[hsl(var(--risk-low))]" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Commingling rule status
                    </p>
                    <p className="text-sm font-semibold text-[hsl(var(--risk-low))]">
                      Active · monitoring tagged accounts
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="flex items-center justify-between gap-3">
              <div className="relative max-w-sm flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-9 h-9 bg-card"
                  placeholder="Search by NUBAN, IMTO operator, or partner bank…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                May 2026 CBN Circular requires segregated remittance settlement.
              </p>
            </div>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Account Registry</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40 hover:bg-muted/40">
                      <TableHead className="text-xs">NUBAN</TableHead>
                      <TableHead className="text-xs">Partner Bank</TableHead>
                      <TableHead className="text-xs">Type / IMTO</TableHead>
                      <TableHead className="text-xs">CBN Licence</TableHead>
                      <TableHead className="text-xs">Approved Correspondents</TableHead>
                      <TableHead className="text-xs">Activation</TableHead>
                      <TableHead className="text-xs text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map(a => (
                      <TableRow key={a.id}>
                        <TableCell className="font-mono text-xs">{a.nuban}</TableCell>
                        <TableCell className="text-xs">{a.partnerBank}</TableCell>
                        <TableCell>
                          {isIMTOSettlement(a) ? (
                            <div className="flex items-center gap-2">
                              <Badge
                                variant="outline"
                                className={`text-[10px] font-semibold ${tealBadge}`}
                              >
                                IMTO Settlement
                              </Badge>
                              <span className="text-xs font-medium">
                                {a.imtoName}
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <Badge
                                variant="outline"
                                className="text-[10px] bg-muted text-muted-foreground"
                              >
                                {a.accountType}
                              </Badge>
                              <span className="text-xs">{a.accountName}</span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-[11px] font-mono text-muted-foreground">
                          {isIMTOSettlement(a) ? a.cbnLicenceNumber : '—'}
                        </TableCell>
                        <TableCell className="text-xs">
                          {isIMTOSettlement(a) ? (
                            <div className="flex flex-wrap gap-1 max-w-[280px]">
                              {a.approvedCorrespondents.map(c => (
                                <Badge
                                  key={c}
                                  variant="outline"
                                  className="text-[10px] font-normal"
                                >
                                  {c}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {isIMTOSettlement(a)
                            ? new Date(a.activationDate).toLocaleDateString(
                                'en-NG',
                                { day: 'numeric', month: 'short', year: 'numeric' },
                              )
                            : '—'}
                        </TableCell>
                        <TableCell className="text-right">
                          {!isIMTOSettlement(a) && (
                            <TagAsIMTODialog account={a} onTag={handleTag} />
                          )}
                          {isIMTOSettlement(a) && (
                            <span className="text-[10px] text-muted-foreground">
                              Tagged · monitored
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

export default AccountsPage;
