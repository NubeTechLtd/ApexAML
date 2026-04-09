import { useParams, useNavigate } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, ShieldAlert, Snowflake, User, Fingerprint, Network, FileText, AlertTriangle, Clock } from 'lucide-react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { customer360Data } from '@/data/mockCustomer360';
import { mockLegacyAlerts as mockAlerts } from '@/data/mockLegacyAlerts';
import { motion } from 'framer-motion';

const riskColors: Record<string, string> = {
  High: 'bg-destructive/10 text-destructive border-destructive/20',
  Medium: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20',
  Low: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
};

const entityIcons: Record<string, typeof Network> = {
  'Shared Device ID': Fingerprint,
  'Frequent Transfer Target': ArrowLeft,
  'Shared Address': User,
  'Common Beneficiary': Network,
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(amount);
}

export default function Customer360() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const customer = customer360Data[Number(id)];

  if (!customer) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full bg-background">
          <AppSidebar />
          <main className="flex-1 p-6 flex items-center justify-center">
            <div className="text-center space-y-3">
              <ShieldAlert className="h-12 w-12 text-muted-foreground mx-auto" />
              <h2 className="text-xl font-semibold text-foreground">Customer not found</h2>
              <Button variant="outline" onClick={() => navigate('/customers')}>
                <ArrowLeft className="h-4 w-4 mr-2" /> Back to Customers
              </Button>
            </div>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  const customerAlerts = mockAlerts.filter(a =>
    a.customerName.toLowerCase().includes(customer.name.split(' ')[0].toLowerCase())
  );

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <main className="flex-1 overflow-auto">
          {/* Header */}
          <div className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate('/customers')}>
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-lg">
                    {customer.name.charAt(0)}
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-foreground">{customer.name}</h1>
                    <p className="text-xs text-muted-foreground">Customer #{customer.id} · {customer.kycTier}</p>
                  </div>
                  <Badge variant="outline" className={`ml-2 text-sm px-3 py-1 ${riskColors[customer.riskLevel]}`}>
                    {customer.riskLevel} Risk
                  </Badge>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="destructive" size="sm" className="gap-1.5">
                  <Snowflake className="h-3.5 w-3.5" /> Freeze Account
                </Button>
                <ThemeToggle />
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* 3-column grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Column 1: KYC & Identity */}
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
                <Card className="h-full">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <Fingerprint className="h-4 w-4 text-primary" /> KYC & Identity
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-muted-foreground text-xs">BVN</p>
                        <p className="font-mono font-medium text-foreground">{customer.bvn}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">NIN</p>
                        <p className="font-mono font-medium text-foreground">{customer.nin}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">KYC Tier</p>
                        <p className="font-medium text-foreground">{customer.kycTier}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Active Alerts</p>
                        <p className="font-medium text-foreground">{customer.alerts}</p>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <p className="text-muted-foreground text-xs">Email</p>
                      <p className="text-sm text-foreground">{customer.email}</p>
                    </div>
                    <div className="space-y-1.5">
                      <p className="text-muted-foreground text-xs">Phone</p>
                      <p className="text-sm text-foreground">{customer.phone}</p>
                    </div>
                    <div className="space-y-1.5">
                      <p className="text-muted-foreground text-xs">Verified Selfie</p>
                      <div className="flex h-28 items-center justify-center rounded-lg border border-dashed border-border bg-muted/30">
                        <div className="text-center text-muted-foreground">
                          <User className="h-8 w-8 mx-auto mb-1 opacity-40" />
                          <span className="text-[11px]">Liveness photo placeholder</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Column 2: Behavioral & Risk Radar */}
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <Card className="h-full">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <ShieldAlert className="h-4 w-4 text-primary" /> Behavioral & Risk Profile
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={260}>
                      <RadarChart data={customer.radarScores} cx="50%" cy="50%" outerRadius="75%">
                        <PolarGrid stroke="hsl(var(--border))" />
                        <PolarAngleAxis
                          dataKey="axis"
                          tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                        />
                        <PolarRadiusAxis
                          angle={90}
                          domain={[0, 100]}
                          tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}
                        />
                        <Radar
                          name="Risk"
                          dataKey="value"
                          stroke="hsl(var(--primary))"
                          fill="hsl(var(--primary))"
                          fillOpacity={0.2}
                          strokeWidth={2}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                      {customer.radarScores.map(s => (
                        <div key={s.axis} className="flex items-center justify-between rounded-md bg-muted/50 px-2.5 py-1.5">
                          <span className="text-muted-foreground">{s.axis}</span>
                          <span className="font-semibold text-foreground">{s.value}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Column 3: Connected Entities */}
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                <Card className="h-full">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <Network className="h-4 w-4 text-primary" /> Connected Entities
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {customer.connectedEntities.length === 0 ? (
                      <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
                        No connected entities detected
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {customer.connectedEntities.map(entity => {
                          const Icon = entityIcons[entity.type] || Network;
                          return (
                            <div key={entity.id} className="rounded-lg border border-border p-3 space-y-1 hover:bg-muted/30 transition-colors">
                              <div className="flex items-center gap-2">
                                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10">
                                  <Icon className="h-3.5 w-3.5 text-primary" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-medium text-foreground truncate">{entity.label}</p>
                                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">{entity.type}</Badge>
                                </div>
                              </div>
                              <p className="text-xs text-muted-foreground pl-9">{entity.detail}</p>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Bottom tabbed section */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <Tabs defaultValue="transactions" className="w-full">
                <TabsList>
                  <TabsTrigger value="transactions" className="gap-1.5">
                    <Clock className="h-3.5 w-3.5" /> Transaction History
                  </TabsTrigger>
                  <TabsTrigger value="alerts" className="gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5" /> Active Alerts
                  </TabsTrigger>
                  <TabsTrigger value="documents" className="gap-1.5">
                    <FileText className="h-3.5 w-3.5" /> Uploaded EDD Documents
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
                              <TableHead className="text-right">Flagged Amount</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {customerAlerts.map(a => (
                              <TableRow key={a.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/?status=${a.status}`)}>
                                <TableCell className="font-mono text-xs">{a.id}</TableCell>
                                <TableCell className="text-sm">{a.alertType}</TableCell>
                                <TableCell>
                                  <Badge variant="outline" className={riskColors[a.riskLevel] || ''}>{a.riskLevel}</Badge>
                                </TableCell>
                                <TableCell className="text-sm">{a.status}</TableCell>
                                <TableCell className="text-right font-mono text-sm">{formatCurrency(a.totalFlagged)}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      ) : (
                        <p className="text-sm text-muted-foreground py-8 text-center">No active alerts</p>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="documents">
                  <Card>
                    <CardContent className="pt-4">
                      {customer.eddDocuments.length > 0 ? (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Document Name</TableHead>
                              <TableHead>Type</TableHead>
                              <TableHead>Uploaded</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {customer.eddDocuments.map((doc, i) => (
                              <TableRow key={i}>
                                <TableCell className="text-sm font-medium">{doc.name}</TableCell>
                                <TableCell className="text-sm">{doc.type}</TableCell>
                                <TableCell className="text-sm text-muted-foreground">{doc.uploadedAt}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      ) : (
                        <p className="text-sm text-muted-foreground py-8 text-center">No EDD documents uploaded</p>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </motion.div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
