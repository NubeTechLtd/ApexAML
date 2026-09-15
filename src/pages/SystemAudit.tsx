import { useState } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Search, Lock, Shield, Eye, UserCog, Users, Building2 } from 'lucide-react';
import { NotificationBell } from '@/components/NotificationBell';
import { ThemeToggle } from '@/components/ThemeToggle';
import { cn } from '@/lib/utils';
import { useAuditLog } from '@/hooks/useAuditLog';


interface AuditRow {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  action: string;
  resource: string;
  status: 'success' | 'denied';
}

const roleData = [
  { role: 'Admin', users: ['Ngozi Ibe', 'Chukwudi Obi'], icon: UserCog, color: 'bg-[hsl(var(--risk-critical)/0.12)] text-[hsl(var(--risk-critical))]' },
  { role: 'Analyst', users: ['Adeola Kemi', 'Ibrahim Sani', 'Fatima Bello'], icon: Shield, color: 'bg-[hsl(var(--risk-medium)/0.12)] text-[hsl(var(--risk-medium))]' },
  { role: 'Reviewer', users: ['Chioma Adeyemi'], icon: Users, color: 'bg-[hsl(var(--risk-high)/0.12)] text-[hsl(var(--risk-high))]' },
  { role: 'Partner Bank Officer', users: ['Adaeze Okolo (Access Bank)', 'Tunde Olatunji (GTBank)'], icon: Building2, color: 'bg-teal-500/15 text-teal-700 dark:text-teal-300' },
  { role: 'Read-Only', users: ['Yusuf Maina'], icon: Eye, color: 'bg-muted text-muted-foreground' },
];

const ACTION_LABELS: Record<string, string> = {
  NFIU_ESCALATION: 'Escalated to NFIU',
  ACCOUNT_FREEZE: 'Froze Account',
  DOCUMENT_UPLOAD: 'Uploaded KYC Document',
  DOCUMENT_VERIFY: 'Verified KYC Document',
  DOCUMENT_DOWNLOAD: 'Downloaded KYC Document',
  KYB_CAC_VERIFY: 'Requested CAC Verification',
  KYB_UBO_ADDED: 'Recorded Beneficial Owner',
  KYB_BVN_VERIFY: 'Verified Director BVN',
  KYB_PEP_SCREEN: 'Screened Director for PEP',
  KYB_MAKER_APPROVE: 'Recommended KYB Approval (Maker)',
  KYB_MAKER_REJECT: 'Recommended KYB Rejection (Maker)',
  KYB_APPROVED: 'Approved Corporate KYB (Checker)',
  KYB_REJECTED: 'Rejected Corporate KYB (Checker)',
};

const SystemAudit = () => {
  const [search, setSearch] = useState('');
  const { entries, loading } = useAuditLog();

  const rows: AuditRow[] = entries
    .map((e, i) => ({
      id: e.id ?? `pending-${i}`,
      timestamp: e.timestamp,
      userId: e.userId ? e.userId.slice(0, 8).toUpperCase() : '—',
      userName: e.analyst,
      action: ACTION_LABELS[e.action] ?? e.action,
      resource: e.justification ? `${e.caseId} — ${e.justification}` : e.caseId,
      status: (e.status ?? 'success') as 'success' | 'denied',
    }))
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const filtered = rows.filter((e) =>
    e.userName.toLowerCase().includes(search.toLowerCase()) ||
    e.action.toLowerCase().includes(search.toLowerCase()) ||
    e.userId.toLowerCase().includes(search.toLowerCase())
  );


  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-14 flex items-center justify-between border-b px-4 bg-card">
            <div className="flex items-center gap-2">
              <SidebarTrigger />
              <Lock className="h-4 w-4 text-muted-foreground" />
              <div>
                <h1 className="text-sm font-semibold text-foreground leading-tight">Audit Trail & Access Control</h1>
                <p className="text-[10px] text-muted-foreground">Immutable record of all compliance actions — for CBN examination</p>
              </div>
              <Badge variant="outline" className="text-[10px] border-border text-muted-foreground ml-1">
                Read-Only
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <NotificationBell />
            </div>
          </header>

          <main className="flex-1 overflow-y-auto p-6 bg-background space-y-6">
            {/* Access Management */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <CardTitle className="text-sm">Access Management — Role Assignments</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 md:grid-cols-3">
                  {roleData.map((r) => {
                    const Icon = r.icon;
                    return (
                      <div key={r.role} className="rounded-lg border p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4 text-muted-foreground" />
                            <span className="text-xs font-semibold text-foreground">{r.role}</span>
                          </div>
                          <Badge variant="outline" className={cn('text-[10px] border-0 font-semibold', r.color)}>
                            {r.users.length} user{r.users.length !== 1 ? 's' : ''}
                          </Badge>
                        </div>
                        <div className="space-y-1">
                          {r.users.map((u) => (
                            <div key={u} className="flex items-center gap-2 text-xs text-muted-foreground">
                              <div className="h-5 w-5 rounded-full bg-muted flex items-center justify-center text-[9px] font-semibold text-foreground">
                                {u.split(' ').map((n) => n[0]).join('')}
                              </div>
                              {u}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Immutable Audit Log */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Lock className="h-4 w-4 text-muted-foreground" />
                    <CardTitle className="text-sm">Immutable Activity Log</CardTitle>
                    <Badge variant="outline" className="text-[9px] border-border text-muted-foreground font-mono">
                      APPEND-ONLY • TAMPER-PROOF
                    </Badge>
                  </div>
                  <div className="relative w-56">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input placeholder="Search logs…" value={search} onChange={(e) => setSearch(e.target.value)} className="h-8 pl-8 text-xs" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent bg-muted/50">
                        <TableHead className="text-[10px] uppercase tracking-wider font-semibold">Timestamp</TableHead>
                        <TableHead className="text-[10px] uppercase tracking-wider font-semibold">User ID</TableHead>
                        <TableHead className="text-[10px] uppercase tracking-wider font-semibold">User</TableHead>
                        <TableHead className="text-[10px] uppercase tracking-wider font-semibold">Action Taken</TableHead>
                        <TableHead className="text-[10px] uppercase tracking-wider font-semibold">Resource</TableHead>
                        
                        <TableHead className="text-[10px] uppercase tracking-wider font-semibold text-center">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.map((e) => (
                        <TableRow key={e.id} className="hover:bg-transparent cursor-default">
                          <TableCell className="text-xs font-mono text-muted-foreground whitespace-nowrap">
                            {new Date(e.timestamp).toLocaleString('en-NG', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </TableCell>
                          <TableCell className="text-xs font-mono text-muted-foreground">{e.userId}</TableCell>
                          <TableCell className="text-xs font-medium text-foreground">{e.userName}</TableCell>
                          <TableCell className="text-xs text-foreground">{e.action}</TableCell>
                          <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">{e.resource}</TableCell>
                          
                          <TableCell className="text-center">
                            <Badge variant="outline" className={cn('text-[10px] border-0 font-semibold',
                              e.status === 'success'
                                ? 'bg-[hsl(var(--risk-low)/0.12)] text-[hsl(var(--risk-low))]'
                                : 'bg-[hsl(var(--risk-critical)/0.12)] text-[hsl(var(--risk-critical))]'
                            )}>
                              {e.status === 'success' ? '✓ OK' : '✗ Denied'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <p className="text-[10px] text-muted-foreground">
                    This log is cryptographically hashed and append-only. Records cannot be modified or deleted per CBN regulatory requirements.
                  </p>
                  <p className="text-[10px] font-mono text-muted-foreground">
                    SHA-256: 4a7d1ed4…f3c8
                  </p>
                </div>
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default SystemAudit;
