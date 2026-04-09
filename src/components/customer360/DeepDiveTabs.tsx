import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Clock, AlertTriangle, FileText, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Customer360Data } from '@/data/mockCustomer360';

const riskColors: Record<string, string> = {
  High: 'bg-destructive/10 text-destructive border-destructive/20',
  Medium: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20',
  Low: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(amount);
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
        <TabsTrigger value="transactions" className="gap-1.5">
          <Clock className="h-3.5 w-3.5" /> Transaction History
        </TabsTrigger>
        <TabsTrigger value="alerts" className="gap-1.5">
          <AlertTriangle className="h-3.5 w-3.5" /> Case & Alert History
        </TabsTrigger>
        <TabsTrigger value="documents" className="gap-1.5">
          <FileText className="h-3.5 w-3.5" /> EDD Documents
        </TabsTrigger>
      </TabsList>

      <TabsContent value="transactions">
        <Card>
          <CardContent className="pt-4">
            {customerAlerts.length > 0 && customerAlerts[0].transactionTimeline.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Channel</TableHead>
                    <TableHead>Counterparty</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Flag</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customerAlerts.flatMap(a => a.transactionTimeline).map(tx => (
                    <TableRow key={tx.id}>
                      <TableCell className="text-xs text-muted-foreground">{new Date(tx.date).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}</TableCell>
                      <TableCell className="text-sm">{tx.type}</TableCell>
                      <TableCell className="text-sm">{tx.channel}</TableCell>
                      <TableCell className="text-sm truncate max-w-[200px]">{tx.counterparty}</TableCell>
                      <TableCell className="text-right font-mono text-sm">{formatCurrency(tx.amount)}</TableCell>
                      <TableCell>
                        {tx.flagReason && (
                          <Badge variant="outline" className="text-[10px] bg-destructive/10 text-destructive border-destructive/20">
                            {tx.flagReason}
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-sm text-muted-foreground py-8 text-center">No transaction history available</p>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="alerts">
        <Card>
          <CardContent className="pt-4">
            {customerAlerts.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Alert ID</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Risk</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Resolution</TableHead>
                    <TableHead className="text-right">Flagged Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customerAlerts.map(a => (
                    <TableRow key={a.id}>
                      <TableCell className="font-mono text-xs">{a.id}</TableCell>
                      <TableCell className="text-sm">{a.alertType}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={riskColors[a.riskLevel] || ''}>{a.riskLevel}</Badge>
                      </TableCell>
                      <TableCell className="text-sm">{a.status}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{a.status === 'Closed' ? 'Resolved' : 'Pending'}</TableCell>
                      <TableCell className="text-right font-mono text-sm">{formatCurrency(a.totalFlagged)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-sm text-muted-foreground py-8 text-center">No case or alert history</p>
            )}
          </CardContent>
        </Card>
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
    </Tabs>
  );
}
