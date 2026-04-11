import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CreditCard, Network, AlertTriangle, FileText, Download, ClipboardList } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Customer360Data } from '@/data/mockCustomer360';
import { TransactionsTab } from './TransactionsTab';
import { NetworkGraph } from './NetworkGraph';
import { AuditLogTab } from './AuditLogTab';

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
}

export function Customer360Tabs({ customer, customerAlerts }: Props) {
  return (
    <Tabs defaultValue="transactions" className="w-full">
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
              <p className="text-sm text-muted-foreground py-8 text-center">No alert history for this customer</p>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="network">
        <NetworkGraph customer={customer} />
      </TabsContent>

      <TabsContent value="documents">
        <Card>
          <CardContent className="pt-4">
            {customer.eddDocuments.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {customer.eddDocuments.map((doc, i) => (
                  <div key={i} className="rounded-lg border border-border p-4 space-y-2 hover:bg-muted/30 transition-colors">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted/50 text-2xl">
                      {docIcons[doc.type] || '📄'}
                    </div>
                    <p className="text-sm font-medium text-foreground truncate">{doc.name}</p>
                    <p className="text-xs text-muted-foreground">{doc.type} • {doc.uploadedAt}</p>
                    <Button variant="ghost" size="sm" className="w-full gap-1.5 text-xs">
                      <Download className="h-3 w-3" /> Download
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-8 text-center">No EDD documents uploaded</p>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="audit">
        <AuditLogTab customer={customer} />
      </TabsContent>
    </Tabs>
  );
}
