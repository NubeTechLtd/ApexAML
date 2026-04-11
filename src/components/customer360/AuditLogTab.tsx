import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Customer360Data } from '@/data/mockCustomer360';

interface AuditEntry {
  id: string;
  timestamp: string;
  action: string;
  analyst: string;
  justification: string;
  category: 'KYC' | 'Risk' | 'EDD' | 'Account' | 'Alert';
}

function generateAuditLog(customer: Customer360Data): AuditEntry[] {
  const entries: AuditEntry[] = [
    { id: 'AUD-001', timestamp: '2026-04-10 14:32', action: 'KYC Tier upgraded from Tier 1 to Tier 2', analyst: 'Amina Bello', justification: 'All Tier 2 requirements satisfied — utility bill and employer verified.', category: 'KYC' },
    { id: 'AUD-002', timestamp: '2026-04-08 09:15', action: 'Risk tier changed to ' + customer.riskLevel, analyst: 'Olusegun Adeyemi', justification: 'Automated risk model recalculation based on 30-day transaction pattern.', category: 'Risk' },
    { id: 'AUD-003', timestamp: '2026-04-05 16:48', action: 'EDD investigation triggered', analyst: 'Fatima Yusuf', justification: 'Unusual transaction velocity detected — 12 transfers in 4 hours exceeding normal baseline.', category: 'EDD' },
    { id: 'AUD-004', timestamp: '2026-03-28 11:22', action: 'Account temporarily frozen', analyst: 'Chukwu Emeka', justification: 'Pending sanctions screening clearance — partial name match on OFAC SDN list.', category: 'Account' },
    { id: 'AUD-005', timestamp: '2026-03-28 15:10', action: 'Account unfrozen — sanctions match cleared', analyst: 'Chukwu Emeka', justification: 'False positive confirmed — DOB and nationality mismatch with listed entity.', category: 'Account' },
    { id: 'AUD-006', timestamp: '2026-03-20 10:05', action: 'Alert SAR-2026-0031 resolved as True Positive', analyst: 'Ngozi Okafor', justification: 'Structuring pattern confirmed — STR filed with NFIU ref: STR-2026-0038.', category: 'Alert' },
    { id: 'AUD-007', timestamp: '2026-03-15 13:45', action: 'BVN re-verification completed', analyst: 'System', justification: 'Periodic BVN reverification — match confirmed with NIBSS records.', category: 'KYC' },
    { id: 'AUD-008', timestamp: '2026-03-01 08:30', action: 'Risk score recalculated: ' + customer.riskScore + '/100', analyst: 'System', justification: 'Monthly automated risk model refresh — crypto exposure factor increased.', category: 'Risk' },
  ];
  return entries;
}

const categoryColors: Record<string, string> = {
  KYC: 'bg-primary/10 text-primary border-0',
  Risk: 'bg-[hsl(var(--risk-high)/0.15)] text-[hsl(var(--risk-high))] border-0',
  EDD: 'bg-[hsl(var(--risk-medium)/0.15)] text-[hsl(var(--risk-medium))] border-0',
  Account: 'bg-[hsl(var(--risk-critical)/0.15)] text-[hsl(var(--risk-critical))] border-0',
  Alert: 'bg-muted text-muted-foreground border-0',
};

interface Props {
  customer: Customer360Data;
}

export function AuditLogTab({ customer }: Props) {
  const entries = generateAuditLog(customer);

  return (
    <Card>
      <CardContent className="pt-4">
        <div className="space-y-0">
          {entries.map((entry, i) => (
            <div key={entry.id} className="relative flex gap-4 pb-5 last:pb-0">
              {/* Timeline connector */}
              {i < entries.length - 1 && (
                <div className="absolute left-[15px] top-[32px] w-px bottom-0 bg-border" />
              )}
              {/* Dot */}
              <div className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted border border-border">
                <span className="text-[9px] font-bold text-muted-foreground">{i + 1}</span>
              </div>
              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-mono text-muted-foreground">{entry.timestamp}</span>
                  <Badge variant="outline" className={`text-[10px] font-semibold ${categoryColors[entry.category]}`}>
                    {entry.category}
                  </Badge>
                </div>
                <p className="text-sm font-medium text-foreground mt-0.5">{entry.action}</p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{entry.justification}</p>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Analyst: <span className="font-medium text-foreground">{entry.analyst}</span>
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
