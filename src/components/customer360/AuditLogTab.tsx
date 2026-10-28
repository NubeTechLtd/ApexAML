import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StickyNote } from 'lucide-react';
import type { Customer360Data } from '@/data/models/customer360';
import type { ComplianceNote } from './AddNoteSheet';
import { useAuditLog, type AuditEntry as SharedAuditEntry } from '@/hooks/useAuditLog';
import { auditKeysFor } from '@/data-layer/seed/views';

interface AuditEntry {
  id: string;
  timestamp: string;
  action: string;
  analyst: string;
  justification: string;
  category: 'KYC' | 'Risk' | 'EDD' | 'Account' | 'Alert' | 'Note';
  visibility?: string;
}

function categoryFor(action: string): AuditEntry['category'] {
  if (/DOCUMENT|KYC|KYB/.test(action)) return 'KYC';
  if (/FREEZE|UNFREEZE|RESTRICT|CUSTOMER_/.test(action)) return 'Account';
  if (/EDD/.test(action)) return 'EDD';
  if (/RISK/.test(action)) return 'Risk';
  return 'Alert';
}

const readable = (action: string) => action.toLowerCase().replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase());

/** Real audit entries for this customer (their reference, BVN, cases and screenings), plus session notes. */
function buildAuditLog(customer: Customer360Data, entries: SharedAuditEntry[], notes: ComplianceNote[]): AuditEntry[] {
  const keys = auditKeysFor(customer.id);
  const logged: AuditEntry[] = entries
    .filter((e) => keys.has(e.caseId))
    .map((e) => ({
      id: e.id ?? `${e.timestamp}-${e.action}`,
      timestamp: new Date(e.timestamp).toLocaleString('en-NG', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }),
      action: `${readable(e.action)} — ${e.caseId}`,
      analyst: e.analyst,
      justification: e.justification,
      category: categoryFor(e.action),
    }));
  const noteEntries: AuditEntry[] = notes.map(n => ({
    id: n.id,
    timestamp: n.timestamp,
    action: 'Compliance note added',
    analyst: n.analyst,
    justification: n.content,
    category: 'Note' as const,
    visibility: n.visibility,
  }));
  return [...noteEntries, ...logged];
}

const categoryColors: Record<string, string> = {
  KYC: 'bg-primary/10 text-primary border-0',
  Risk: 'bg-[hsl(var(--risk-high)/0.15)] text-[hsl(var(--risk-high))] border-0',
  EDD: 'bg-[hsl(var(--risk-medium)/0.15)] text-[hsl(var(--risk-medium))] border-0',
  Account: 'bg-[hsl(var(--risk-critical)/0.15)] text-[hsl(var(--risk-critical))] border-0',
  Alert: 'bg-muted text-muted-foreground border-0',
  Note: 'bg-primary/10 text-primary border-0',
};

interface Props {
  customer: Customer360Data;
  notes?: ComplianceNote[];
  filterNotesOnly?: boolean;
}

export function AuditLogTab({ customer, notes = [], filterNotesOnly = false }: Props) {
  const { entries: auditEntries } = useAuditLog();
  const allEntries = buildAuditLog(customer, auditEntries, notes);
  const entries = filterNotesOnly ? allEntries.filter(e => e.category === 'Note') : allEntries;

  return (
    <Card>
      <CardContent className="pt-4">
        {filterNotesOnly && entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center space-y-3">
            <StickyNote className="h-10 w-10 text-muted-foreground" />
            <p className="text-sm font-medium text-foreground">No compliance notes yet</p>
            <p className="text-xs text-muted-foreground">Use the "Add Note" button to attach a compliance note to this customer.</p>
          </div>
        ) : (
          <div className="space-y-0">
            {entries.map((entry, i) => (
              <div key={entry.id} className="relative flex gap-4 pb-5 last:pb-0">
                {i < entries.length - 1 && (
                  <div className="absolute left-[15px] top-[32px] w-px bottom-0 bg-border" />
                )}
                <div className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted border border-border">
                  {entry.category === 'Note' ? (
                    <StickyNote className="h-3.5 w-3.5 text-primary" />
                  ) : (
                    <span className="text-[9px] font-bold text-muted-foreground">{i + 1}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono text-muted-foreground">{entry.timestamp}</span>
                    <Badge variant="outline" className={`text-[10px] font-semibold ${categoryColors[entry.category]}`}>
                      {entry.category}
                    </Badge>
                    {entry.visibility && (
                      <Badge variant="outline" className="text-[10px] bg-muted/50 border-0">
                        {entry.visibility}
                      </Badge>
                    )}
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
        )}
      </CardContent>
    </Card>
  );
}
