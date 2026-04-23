import { useState } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { RulesTable } from '@/components/RulesTable';
import { RulesSandbox } from '@/components/RulesSandbox';
import { NewRuleSheet } from '@/components/NewRuleSheet';
import { ThemeToggle } from '@/components/ThemeToggle';
import { NotificationBell } from '@/components/NotificationBell';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, ShieldCheck, Zap, BarChart3, Clock, Info, BookOpen } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const kpis = [
  { label: 'Active Rules', value: '8', icon: ShieldCheck, accent: 'text-[hsl(var(--risk-low))]' },
  { label: 'Rules Triggered Today', value: '34', icon: Zap, accent: 'text-[hsl(var(--risk-high))]' },
  { label: 'False Positive Rate', value: '18.3%', icon: BarChart3, accent: 'text-[hsl(var(--risk-medium))]' },
  { label: 'Pending Validation', value: '2', icon: Clock, accent: 'text-[hsl(var(--risk-critical))]' },
];

type TypologyCategory = 'POS' | 'FX/BDC' | 'Digital Channels' | 'Account Lifecycle' | 'Crypto' | 'Insider/PEP' | 'Trade-Based' | 'IMTO';

interface TypologyTemplate {
  name: string;
  desc: string;
  risk: 'Critical' | 'High' | 'Medium';
  category: TypologyCategory;
  badge?: string;
}

const typologyTemplates: TypologyTemplate[] = [
  { name: 'POS Round-Trip', desc: 'Detects cash-out via POS followed by immediate re-deposit to evade monitoring thresholds.', risk: 'High', category: 'POS' },
  { name: 'BDC Smurfing', desc: 'Identifies structured foreign exchange purchases across multiple Bureau de Change operators.', risk: 'Critical', category: 'FX/BDC' },
  { name: 'USSD Layering', desc: 'Monitors rapid USSD-initiated transfers layered through multiple wallets within minutes.', risk: 'High', category: 'Digital Channels' },
  { name: 'Dormant Activation', desc: 'Flags dormant accounts (>12 months) receiving sudden large inflows without prior history.', risk: 'Medium', category: 'Account Lifecycle' },
  { name: 'Crypto P2P', desc: 'Detects peer-to-peer crypto patterns — fiat in, crypto out via unregistered exchanges.', risk: 'Critical', category: 'Crypto' },
  { name: 'Salary Mule', desc: 'Identifies salary accounts acting as mule conduits with rapid onward transfers post-credit.', risk: 'High', category: 'Account Lifecycle' },
  { name: 'Real Estate Front', desc: 'Flags disproportionate real-estate-linked transactions relative to declared income.', risk: 'Medium', category: 'Trade-Based' },
  { name: 'PEP Spending Spike', desc: 'Monitors PEP-linked accounts for expenditure spikes exceeding historical baseline.', risk: 'High', category: 'Insider/PEP' },
  {
    name: 'IMTO Cash Limit Smurfing',
    desc: 'Tracks cumulative cash payouts to the same beneficiary identity (full name + phone + NIN) across ALL IMTO agents in a rolling 24h window. Flags breaches of the $200 USD CBN threshold (CBN IMTO Guidelines 2021).',
    risk: 'Critical',
    category: 'IMTO',
    badge: 'Cross-agent · 24h window',
  },
];

const CATEGORY_ORDER: TypologyCategory[] = ['POS', 'FX/BDC', 'Digital Channels', 'IMTO', 'Account Lifecycle', 'Crypto', 'Insider/PEP', 'Trade-Based'];

const riskBadgeClass: Record<string, string> = {
  Critical: 'bg-[hsl(var(--risk-critical)/0.15)] text-[hsl(var(--risk-critical))] border-0',
  High: 'bg-[hsl(var(--risk-high)/0.15)] text-[hsl(var(--risk-high))] border-0',
  Medium: 'bg-[hsl(var(--risk-medium)/0.15)] text-[hsl(var(--risk-medium))] border-0',
};

const RulesEngine = () => {
  const [sheetOpen, setSheetOpen] = useState(false);
  const { toast } = useToast();

  const addTemplate = (name: string) => {
    toast({ title: 'Template Added', description: `"${name}" has been added to your rulebook as a draft.` });
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-14 flex items-center justify-between border-b px-4 bg-card">
            <div className="flex items-center gap-2">
              <SidebarTrigger />
              <h1 className="text-sm font-semibold text-foreground">Rules Engine</h1>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" className="h-9 gap-1.5" onClick={() => setSheetOpen(true)}>
                <Plus className="h-3.5 w-3.5" /> New Rule
              </Button>
              <ThemeToggle />
              <NotificationBell />
            </div>
          </header>

          <main className="flex-1 overflow-y-auto p-6 bg-background space-y-6">
            {/* CBN Info Banner */}
            <div className="flex items-start gap-3 rounded-lg border border-[hsl(var(--risk-medium)/0.3)] bg-[hsl(var(--risk-medium)/0.06)] p-3.5">
              <Info className="h-4 w-4 text-[hsl(var(--risk-medium))] mt-0.5 shrink-0" />
              <p className="text-xs text-foreground leading-relaxed">
                <span className="font-semibold">CBN Circular BSD/DIR/PUB/LAB/019/002</span> requires annual model validation for all automated detection rules. Rules with overdue validation are flagged in the table below.
              </p>
            </div>

            <Tabs defaultValue="rules" className="space-y-4">
              <TabsList>
                <TabsTrigger value="rules" className="text-xs">Rules & Typologies</TabsTrigger>
                <TabsTrigger value="sandbox" className="text-xs">Sandbox</TabsTrigger>
              </TabsList>

              <TabsContent value="rules" className="space-y-6">
                {/* KPI Cards */}
                <div className="grid grid-cols-4 gap-4">
                  {kpis.map(kpi => {
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

                {/* Rules Table */}
                <RulesTable />

                {/* Nigeria Typology Library */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-primary" />
                    <h2 className="text-sm font-semibold text-foreground">Nigeria Typology Library</h2>
                    <span className="text-xs text-muted-foreground">— Pre-built detection templates</span>
                  </div>
                  <div className="grid grid-cols-4 gap-3">
                    {typologyTemplates.map(t => (
                      <Card key={t.name} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4 space-y-2.5">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-semibold text-foreground">{t.name}</p>
                            <Badge variant="outline" className={cn('text-[10px] font-semibold', riskBadgeClass[t.risk])}>{t.risk}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">{t.desc}</p>
                          <Button variant="outline" size="sm" className="w-full h-7 text-xs gap-1" onClick={() => addTemplate(t.name)}>
                            <Plus className="h-3 w-3" /> Add to Rulebook
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="sandbox">
                <RulesSandbox />
              </TabsContent>
            </Tabs>
          </main>
        </div>
      </div>
      <NewRuleSheet open={sheetOpen} onOpenChange={setSheetOpen} />
    </SidebarProvider>
  );
};

export default RulesEngine;
