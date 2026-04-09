import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowUpRight, ArrowDownRight, Send, Target, ShieldCheck, TrendingUp } from 'lucide-react';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, AreaChart, Area, CartesianGrid } from 'recharts';

const nfiuData = [
  { day: 'Mon', strs: 12, ctrs: 34 },
  { day: 'Tue', strs: 8, ctrs: 29 },
  { day: 'Wed', strs: 15, ctrs: 41 },
  { day: 'Thu', strs: 10, ctrs: 38 },
  { day: 'Fri', strs: 18, ctrs: 45 },
  { day: 'Sat', strs: 5, ctrs: 12 },
  { day: 'Sun', strs: 3, ctrs: 8 },
];

const fpData = [
  { week: 'W1', rate: 42 },
  { week: 'W2', rate: 38 },
  { week: 'W3', rate: 35 },
  { week: 'W4', rate: 31 },
  { week: 'W5', rate: 28 },
  { week: 'W6', rate: 24 },
  { week: 'W7', rate: 22 },
  { week: 'W8', rate: 19 },
];

const auditChecks = [
  { name: 'Transaction Monitoring Engine', status: 'pass' },
  { name: 'goAML Integration (NFIU)', status: 'pass' },
  { name: 'Sanctions Screening Module', status: 'pass' },
  { name: 'PEP Database Sync', status: 'warning' },
  { name: 'KYC/CDD Data Completeness', status: 'pass' },
  { name: 'Record Retention (5yr)', status: 'pass' },
  { name: 'Staff Training Records', status: 'fail' },
  { name: 'Board Compliance Reporting', status: 'pass' },
];

const nfiuConfig = {
  strs: { label: 'STRs', color: 'hsl(var(--primary))' },
  ctrs: { label: 'CTRs', color: 'hsl(var(--risk-medium))' },
};

const fpConfig = {
  rate: { label: 'FP Rate %', color: 'hsl(var(--risk-low))' },
};

export function ComplianceMetrics() {
  const totalSTRs = nfiuData.reduce((a, b) => a + b.strs, 0);
  const totalCTRs = nfiuData.reduce((a, b) => a + b.ctrs, 0);
  const currentFP = fpData[fpData.length - 1].rate;
  const passCount = auditChecks.filter(c => c.status === 'pass').length;
  const auditScore = Math.round((passCount / auditChecks.length) * 100);

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {/* NFIU Submissions */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">Daily NFIU Submissions</CardTitle>
            <Send className="h-4 w-4 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline gap-3 mb-1">
            <span className="text-2xl font-bold text-foreground">{totalSTRs}</span>
            <span className="text-xs text-muted-foreground">STRs this week</span>
          </div>
          <div className="flex items-center gap-1 text-xs mb-4">
            <ArrowUpRight className="h-3 w-3 text-[hsl(var(--risk-low))]" />
            <span className="text-[hsl(var(--risk-low))] font-medium">+12%</span>
            <span className="text-muted-foreground">vs last week</span>
          </div>
          <ChartContainer config={nfiuConfig} className="h-[120px] w-full">
            <BarChart data={nfiuData} barGap={2}>
              <XAxis dataKey="day" tickLine={false} axisLine={false} fontSize={10} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="strs" fill="var(--color-strs)" radius={[3, 3, 0, 0]} barSize={12} />
              <Bar dataKey="ctrs" fill="var(--color-ctrs)" radius={[3, 3, 0, 0]} barSize={12} />
            </BarChart>
          </ChartContainer>
          <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-primary" />
              <span>STRs ({totalSTRs})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-[hsl(var(--risk-medium))]" />
              <span>CTRs ({totalCTRs})</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* False Positive Rate */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">False Positive Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline gap-3 mb-1">
            <span className="text-2xl font-bold text-foreground">{currentFP}%</span>
            <Badge variant="secondary" className="text-[10px] bg-[hsl(var(--risk-low)/0.12)] text-[hsl(var(--risk-low))] border-0">
              On Target
            </Badge>
          </div>
          <div className="flex items-center gap-1 text-xs mb-4">
            <ArrowDownRight className="h-3 w-3 text-[hsl(var(--risk-low))]" />
            <span className="text-[hsl(var(--risk-low))] font-medium">-54%</span>
            <span className="text-muted-foreground">over 8 weeks</span>
          </div>
          <ChartContainer config={fpConfig} className="h-[120px] w-full">
            <AreaChart data={fpData}>
              <defs>
                <linearGradient id="fpGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--risk-low))" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="hsl(var(--risk-low))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
              <XAxis dataKey="week" tickLine={false} axisLine={false} fontSize={10} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area type="monotone" dataKey="rate" stroke="var(--color-rate)" fill="url(#fpGradient)" strokeWidth={2} />
            </AreaChart>
          </ChartContainer>
          <p className="text-[10px] text-muted-foreground mt-3">
            CBN target: ≤20% by Sept 2027. Currently trending ahead of schedule.
          </p>
        </CardContent>
      </Card>

      {/* System Audit Status */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">System Audit Status</CardTitle>
            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline gap-3 mb-1">
            <span className="text-2xl font-bold text-foreground">{auditScore}%</span>
            <Badge variant="secondary" className="text-[10px] bg-[hsl(var(--risk-medium)/0.12)] text-[hsl(var(--risk-medium))] border-0">
              {passCount}/{auditChecks.length} Passed
            </Badge>
          </div>
          <div className="flex items-center gap-1 text-xs mb-4">
            <TrendingUp className="h-3 w-3 text-[hsl(var(--risk-low))]" />
            <span className="text-muted-foreground">Last audit: 2 days ago</span>
          </div>
          <div className="space-y-1.5">
            {auditChecks.map((check) => (
              <div key={check.name} className="flex items-center justify-between text-xs">
                <span className="text-foreground truncate mr-2">{check.name}</span>
                <span className={
                  check.status === 'pass'
                    ? 'text-[hsl(var(--risk-low))] font-semibold shrink-0'
                    : check.status === 'warning'
                    ? 'text-[hsl(var(--risk-medium))] font-semibold shrink-0'
                    : 'text-[hsl(var(--risk-critical))] font-semibold shrink-0'
                }>
                  {check.status === 'pass' ? '✓ Pass' : check.status === 'warning' ? '⚠ Warning' : '✗ Fail'}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
