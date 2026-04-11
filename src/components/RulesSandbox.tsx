import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Play, Loader2, Rocket, FileDown, FlaskConical, CheckCircle2, AlertTriangle, BarChart3, Activity } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const RULES = [
  { id: 'R-001', name: 'POS Round-Trip Detection' },
  { id: 'R-002', name: 'BDC Smurfing Pattern' },
  { id: 'R-003', name: 'USSD Layering Monitor' },
  { id: 'R-004', name: 'Dormant Account Activation' },
  { id: 'R-005', name: 'Crypto P2P Velocity' },
  { id: 'R-006', name: 'Salary Mule Detection' },
  { id: 'R-007', name: 'Real Estate Front Flows' },
  { id: 'R-008', name: 'PEP Spending Spike' },
];

const SAMPLE_RESULTS = [
  { txnId: 'TXN-80421', amount: 4850000, channel: 'POS', tier: 'Tier 2', reason: 'Round-trip pattern: cash-out followed by re-deposit within 45 minutes' },
  { txnId: 'TXN-80455', amount: 3200000, channel: 'USSD', tier: 'Tier 1', reason: 'Rapid layering across 4 wallets in under 10 minutes' },
  { txnId: 'TXN-80512', amount: 9750000, channel: 'Internet Banking', tier: 'Tier 3', reason: 'Amount split to stay below ₦10M reporting threshold' },
  { txnId: 'TXN-80530', amount: 1500000, channel: 'Mobile Banking', tier: 'Tier 1', reason: 'Salary credit immediately forwarded to 3 external accounts' },
  { txnId: 'TXN-80601', amount: 25000000, channel: 'Branch', tier: 'Tier 3', reason: 'Dormant account (14 months) received large inflow from PEP-linked entity' },
];

const formatNaira = (v: number) => '₦' + v.toLocaleString('en-NG');

export function RulesSandbox() {
  const [selectedRule, setSelectedRule] = useState('');
  const [dateRange, setDateRange] = useState('30');
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<null | {
    totalTxns: number;
    alerts: number;
    fpRate: number;
  }>(null);
  const { toast } = useToast();

  const runTest = () => {
    if (!selectedRule) return;
    setRunning(true);
    setResults(null);
    setProgress(0);

    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 5;
      });
    }, 100);

    setTimeout(() => {
      clearInterval(interval);
      setProgress(100);
      setRunning(false);
      setResults({
        totalTxns: 142387,
        alerts: 47,
        fpRate: 14.9,
      });
    }, 2000);
  };

  const promoteToLive = () => {
    const rule = RULES.find(r => r.id === selectedRule);
    toast({
      title: 'Rule Promoted to Live',
      description: `"${rule?.name}" is now active in production monitoring.`,
    });
    setResults(null);
    setSelectedRule('');
  };

  const downloadCertificate = () => {
    if (!results) return;
    const rule = RULES.find(r => r.id === selectedRule);
    const now = new Date();
    const content = `
SENTINEL — AML/CFT COMPLIANCE PLATFORM
VALIDATION CERTIFICATE
${'='.repeat(50)}

Reference: CBN Circular BSD/DIR/PUB/LAB/019/002
Document Type: Annual Model Validation Report

RULE DETAILS
Rule ID: ${selectedRule}
Rule Name: ${rule?.name || 'N/A'}
Test Date: ${now.toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' })}
Test Period: Last ${dateRange} days

TEST PARAMETERS
Data Window: ${dateRange} days of historical transaction data
Environment: Sandbox (non-production)
Execution Time: ${now.toLocaleTimeString('en-NG')}

RESULTS SUMMARY
Total Transactions Analysed: ${results.totalTxns.toLocaleString()}
Alerts Triggered: ${results.alerts}
Estimated False Positive Rate: ${results.fpRate}%
Detection Rate: ${((results.alerts / results.totalTxns) * 100).toFixed(4)}%

SAMPLE FLAGGED TRANSACTIONS
${SAMPLE_RESULTS.map((s, i) => `${i + 1}. ${s.txnId} | ${formatNaira(s.amount)} | ${s.channel} | ${s.tier} | ${s.reason}`).join('\n')}

CERTIFICATION
This validation was performed in accordance with CBN
AML/CFT/CPF Compliance Framework requirements for
annual model validation of automated detection rules.

Validated by: Sentinel Compliance Platform
Timestamp: ${now.toISOString()}

${'='.repeat(50)}
END OF CERTIFICATE
    `.trim();

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Validation_Certificate_${selectedRule}_${now.toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Certificate Downloaded', description: 'Validation certificate saved for CBN submission.' });
  };

  const ruleName = RULES.find(r => r.id === selectedRule)?.name;

  return (
    <div className="space-y-6">
      {/* Config panel */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <FlaskConical className="h-4 w-4 text-primary" />
            <CardTitle className="text-base">Rule Sandbox</CardTitle>
          </div>
          <p className="text-xs text-muted-foreground">Test detection rules against historical transaction data before promoting to production.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Select Rule</label>
              <Select value={selectedRule} onValueChange={setSelectedRule}>
                <SelectTrigger className="h-10 bg-background"><SelectValue placeholder="Choose a rule…" /></SelectTrigger>
                <SelectContent>
                  {RULES.map(r => (
                    <SelectItem key={r.id} value={r.id}>
                      <span className="font-mono text-muted-foreground mr-2">{r.id}</span>{r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Date Range</label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="h-10 bg-background"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="60">Last 60 days</SelectItem>
                  <SelectItem value="90">Last 90 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button className="h-10 w-full gap-2" onClick={runTest} disabled={!selectedRule || running}>
                {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                {running ? 'Analysing…' : 'Run Test'}
              </Button>
            </div>
          </div>

          {running && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Analysing {dateRange}-day transaction history…</span>
                <span className="font-medium text-foreground">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      {results && (
        <>
          {/* KPI row */}
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Transactions Analysed', value: results.totalTxns.toLocaleString(), icon: Activity, accent: 'text-foreground' },
              { label: 'Alerts Triggered', value: String(results.alerts), icon: AlertTriangle, accent: 'text-[hsl(var(--risk-high))]' },
              { label: 'Est. False Positive Rate', value: `${results.fpRate}%`, icon: BarChart3, accent: 'text-[hsl(var(--risk-medium))]' },
              { label: 'Detection Rate', value: `${((results.alerts / results.totalTxns) * 100).toFixed(4)}%`, icon: CheckCircle2, accent: 'text-[hsl(var(--risk-low))]' },
            ].map(kpi => {
              const Icon = kpi.icon;
              return (
                <Card key={kpi.label}>
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                      <Icon className={cn('h-5 w-5', kpi.accent)} />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{kpi.label}</p>
                      <p className={cn('text-xl font-semibold mt-0.5', kpi.accent)}>{kpi.value}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Sample flagged transactions */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Sample Flagged Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40 hover:bg-muted/40">
                      <TableHead className="text-xs">Transaction</TableHead>
                      <TableHead className="text-xs text-right">Amount</TableHead>
                      <TableHead className="text-xs">Channel</TableHead>
                      <TableHead className="text-xs">Customer Tier</TableHead>
                      <TableHead className="text-xs">Reason</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {SAMPLE_RESULTS.map(s => (
                      <TableRow key={s.txnId}>
                        <TableCell className="text-xs font-mono text-muted-foreground">{s.txnId}</TableCell>
                        <TableCell className="text-sm text-right font-medium text-foreground">{formatNaira(s.amount)}</TableCell>
                        <TableCell><Badge variant="outline" className="text-[10px] font-normal">{s.channel}</Badge></TableCell>
                        <TableCell className="text-xs text-muted-foreground">{s.tier}</TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-[250px] truncate" title={s.reason}>{s.reason}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button className="gap-2">
                  <Rocket className="h-4 w-4" /> Promote to Live
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Promote Rule to Production</AlertDialogTitle>
                  <AlertDialogDescription>
                    You are about to activate <span className="font-semibold text-foreground">"{ruleName}"</span> in the live monitoring environment. This rule will begin generating real alerts immediately. This action is logged to the audit trail.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={promoteToLive}>Confirm & Activate</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <Button variant="outline" className="gap-2" onClick={downloadCertificate}>
              <FileDown className="h-4 w-4" /> Download Validation Certificate
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
