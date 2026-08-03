import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CreditCard, Network, AlertTriangle, FileText, Download, ClipboardList, ShieldCheck, TrendingUp, Newspaper } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Customer360Data } from '@/data/mockCustomer360';
import type { ComplianceNote } from './AddNoteSheet';
import { TransactionsTab } from './TransactionsTab';
import { NetworkGraph } from './NetworkGraph';
import { AuditLogTab } from './AuditLogTab';
import { Customer360DocumentsTab } from './DocumentsTab';
import { RiskHistoryTab } from './RiskHistoryTab';
import { riskScoreKey } from '@/lib/riskScore';



const riskColors: Record<string, string> = {
  High: 'bg-[hsl(var(--risk-critical)/0.1)] text-[hsl(var(--risk-critical))] border-[hsl(var(--risk-critical)/0.2)]',
  Medium: 'bg-[hsl(var(--risk-medium)/0.1)] text-[hsl(var(--risk-medium))] border-[hsl(var(--risk-medium)/0.2)]',
  Low: 'bg-[hsl(var(--risk-low)/0.1)] text-[hsl(var(--risk-low))] border-[hsl(var(--risk-low)/0.2)]',
};

function formatCurrency(amount: number) {
  return '₦' + amount.toLocaleString('en-NG');
}

const docIcons: Record<string, string> = {
  EDD: '📋',
  Financial: '💰',
  'Address Verification': '🏠',
  Corporate: '🏢',
};

interface Props {
  customer: Customer360Data;
  customerAlerts: any[];
  notes?: ComplianceNote[];
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  filterNotesOnly?: boolean;
  onAddToCaseNotes?: (content: string) => void;
}

export function Customer360Tabs({ customer, customerAlerts, notes = [], activeTab, onTabChange, filterNotesOnly = false, onAddToCaseNotes }: Props) {
  return (
    <Tabs value={activeTab} defaultValue="transactions" onValueChange={onTabChange} className="w-full">
      <TabsList>
        <TabsTrigger value="transactions" className="gap-1.5 text-xs">
          <CreditCard className="h-3.5 w-3.5" /> Transactions
        </TabsTrigger>
        <TabsTrigger value="alerts" className="gap-1.5 text-xs">
          <AlertTriangle className="h-3.5 w-3.5" /> Alerts
        </TabsTrigger>
        <TabsTrigger value="network" className="gap-1.5 text-xs">
          <Network className="h-3.5 w-3.5" /> Network
        </TabsTrigger>
        <TabsTrigger value="documents" className="gap-1.5 text-xs">
          <FileText className="h-3.5 w-3.5" /> Documents
        </TabsTrigger>
        <TabsTrigger value="adverse-media" className="gap-1.5 text-xs">
          <Newspaper className="h-3.5 w-3.5" /> Adverse Media
        </TabsTrigger>
        <TabsTrigger value="risk-history" className="gap-1.5 text-xs">
          <TrendingUp className="h-3.5 w-3.5" /> Risk History
        </TabsTrigger>
        <TabsTrigger value="audit" className="gap-1.5 text-xs">
          <ClipboardList className="h-3.5 w-3.5" /> Audit Log
        </TabsTrigger>
      </TabsList>


      <TabsContent value="transactions">
        <TransactionsTab customer={customer} />
      </TabsContent>

      <TabsContent value="alerts">
        <Card>
          <CardContent className="pt-4">
            {customerAlerts.length > 0 ? (
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40 hover:bg-muted/40">
                      <TableHead className="text-xs">Alert ID</TableHead>
                      <TableHead className="text-xs">Type</TableHead>
                      <TableHead className="text-xs">Risk</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                      <TableHead className="text-xs">Resolution</TableHead>
                      <TableHead className="text-xs text-right">Flagged Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customerAlerts.map(a => (
                      <TableRow key={a.id}>
                        <TableCell className="font-mono text-xs text-muted-foreground">{a.id}</TableCell>
                        <TableCell className="text-xs">{a.alertType}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`text-[10px] ${riskColors[a.riskLevel] || ''}`}>{a.riskLevel}</Badge>
                        </TableCell>
                        <TableCell className="text-xs">{a.status}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{a.status === 'Closed' ? 'Resolved' : 'Pending'}</TableCell>
                        <TableCell className="text-right font-mono text-xs">{formatCurrency(a.totalFlagged)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center space-y-3">
                <ShieldCheck className="h-10 w-10 text-[hsl(var(--risk-low))]" />
                <p className="text-sm font-medium text-foreground">No active alerts for this customer</p>
                <p className="text-xs text-muted-foreground">All clear — no flagged transactions or compliance alerts on file.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="network">
        <NetworkGraph customer={customer} />
      </TabsContent>

      <TabsContent value="documents">
        <Customer360DocumentsTab customerId={String(customer.id)} kycTier={customer.kycTier} />
      </TabsContent>

      <TabsContent value="adverse-media">
        <AdverseMediaPanel
          customerId={riskScoreKey(customer.bvn) ?? String(customer.id)}
          customerName={customer.name}
          bvn={customer.bvn}
          onAddToCaseNotes={onAddToCaseNotes}
        />
      </TabsContent>


      <TabsContent value="risk-history">
        <RiskHistoryTab
          customerId={riskScoreKey(customer.bvn) ?? String(customer.id)}
          fallbackScore={customer.riskScore}
          kycTier={customer.kycTier}
          customerName={customer.name}
        />
      </TabsContent>

      <TabsContent value="audit">

        <AuditLogTab customer={customer} notes={notes} filterNotesOnly={filterNotesOnly} />
      </TabsContent>
    </Tabs>
  );
}
