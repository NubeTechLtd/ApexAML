import { useCallback, useMemo, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, Users, Network, ShieldAlert, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import type { PhantomPayrollContext, PhantomPayrollRecipient } from '@/data/mockAlerts';

/** Distinct colour per Nigerian bank — used to colour the spokes/dots. */
const BANK_COLOURS: Record<string, string> = {
  'GTBank': 'hsl(15 85% 55%)',       // orange
  'First Bank': 'hsl(210 80% 50%)',  // navy blue
  'Zenith': 'hsl(0 70% 50%)',        // red
  'Access': 'hsl(28 90% 50%)',       // amber
  'UBA': 'hsl(0 60% 35%)',           // dark red
  'Fidelity': 'hsl(265 60% 55%)',    // purple
  'Stanbic IBTC': 'hsl(195 75% 45%)',// teal
  'Wema': 'hsl(140 55% 40%)',        // green
};

const colourFor = (bank: string) => BANK_COLOURS[bank] ?? 'hsl(var(--muted-foreground))';

const formatNGN = (n: number) =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(n);

interface Props {
  context: PhantomPayrollContext;
}

export function PhantomPayrollNetwork({ context }: Props) {
  const { recipients } = context;

  // Pre-compute spoke geometry (centre at 200,200; ring at radius 160).
  const spokes = useMemo(() => {
    const cx = 200, cy = 200, r = 160;
    return recipients.map((rec, i) => {
      const angle = (i / recipients.length) * Math.PI * 2 - Math.PI / 2;
      return {
        ...rec,
        x: cx + Math.cos(angle) * r,
        y: cy + Math.sin(angle) * r,
        cx, cy,
      };
    });
  }, [recipients]);

  // Group bank counts for the legend.
  const bankCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    recipients.forEach(r => { counts[r.bank] = (counts[r.bank] ?? 0) + 1; });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [recipients]);

  return (
    <Card className="border-l-4 border-l-destructive bg-destructive/[0.02]">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <Network className="h-4 w-4 text-destructive" />
              <CardTitle className="text-sm font-semibold">Phantom Payroll Network</CardTitle>
              <Badge className="bg-destructive text-destructive-foreground border-0 text-[10px] font-bold uppercase tracking-wide gap-1">
                <ShieldAlert className="h-3 w-3" />
                B2P Burst Pattern
              </Badge>
            </div>
            <p className="text-[11px] text-muted-foreground max-w-xl">
              Hub-and-spoke view of all outbound remittances from the foreign-business sender.
              Spokes are colour-coded by recipient bank — uniform amounts and Tier 1-only recipients
              make the laundering pattern visually unmistakable in CBN examinations.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 shrink-0">
            <Stat label="Recipients" value={String(context.totalRemittances)} highlight />
            <Stat label="Window" value={`${context.windowHours}h`} />
            <Stat label="Banks" value={String(context.uniqueBanks)} />
            <Stat label="Tier 1 KYC" value={`${context.pctTier1Recipients}%`} highlight />
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Sender summary */}
        <div className="rounded-lg border bg-card p-3 grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="flex items-start gap-2">
            <Building2 className="h-3.5 w-3.5 text-destructive mt-0.5 shrink-0" />
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Sender Entity</p>
              <p className="text-xs font-semibold text-foreground">{context.senderEntityName}</p>
            </div>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Country / CRN</p>
            <p className="text-xs font-mono text-foreground">{context.senderCountry} · {context.senderCRN}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Uniform Amount</p>
            <p className="text-xs font-semibold text-foreground tabular-nums">
              {formatNGN(context.uniformAmountNGN)} <span className="text-muted-foreground">±{context.amountVariancePct}%</span>
            </p>
          </div>
          <div className="flex items-start gap-2">
            <Users className="h-3.5 w-3.5 text-destructive mt-0.5 shrink-0" />
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">No prior history</p>
              <p className="text-xs font-semibold text-destructive tabular-nums">{context.pctNoPriorHistory}% of recipients</p>
            </div>
          </div>
        </div>

        {/* Hub and spoke SVG */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <svg
              viewBox="0 0 400 400"
              className="w-full h-auto rounded-lg border bg-muted/20"
              role="img"
              aria-label={`Hub-and-spoke diagram of ${recipients.length} phantom-payroll recipients colour-coded by bank.`}
            >
              {/* Spokes */}
              {spokes.map(s => (
                <line
                  key={`l-${s.id}`}
                  x1={s.cx}
                  y1={s.cy}
                  x2={s.x}
                  y2={s.y}
                  stroke={colourFor(s.bank)}
                  strokeWidth="0.6"
                  opacity="0.45"
                />
              ))}
              {/* Recipient dots */}
              {spokes.map(s => (
                <g key={`d-${s.id}`}>
                  <circle
                    cx={s.x}
                    cy={s.y}
                    r="4.5"
                    fill={colourFor(s.bank)}
                    stroke="hsl(var(--background))"
                    strokeWidth="0.8"
                  />
                  <title>{s.name} · {s.bank} · {formatNGN(s.amountNGN)} · KYC {s.kycTier}{s.hasPriorHistory ? ' · prior history' : ' · NEW'}</title>
                </g>
              ))}
              {/* Centre hub */}
              <circle cx="200" cy="200" r="22" fill="hsl(var(--destructive))" opacity="0.15" />
              <circle cx="200" cy="200" r="14" fill="hsl(var(--destructive))" />
              <text
                x="200"
                y="203"
                fontSize="9"
                fontWeight="700"
                textAnchor="middle"
                fill="hsl(var(--destructive-foreground))"
              >
                ATLAS
              </text>
              {/* Hub label */}
              <text
                x="200"
                y="240"
                fontSize="8"
                textAnchor="middle"
                fill="hsl(var(--muted-foreground))"
              >
                Foreign Business Sender
              </text>
            </svg>
            <p className="text-[10px] text-muted-foreground text-center mt-2">
              Each dot is one Tier 1 recipient. Hover for name, bank, and amount. Spoke colour = recipient bank.
            </p>
          </div>

          {/* Legend + uniformity panel */}
          <div className="space-y-3">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Bank Distribution</p>
              <ul className="space-y-1.5">
                {bankCounts.map(([bank, count]) => (
                  <li key={bank} className="flex items-center justify-between gap-2 text-xs">
                    <span className="flex items-center gap-2 min-w-0">
                      <span
                        className="h-2.5 w-2.5 rounded-full shrink-0 ring-1 ring-border"
                        style={{ backgroundColor: colourFor(bank) }}
                      />
                      <span className="text-foreground truncate">{bank}</span>
                    </span>
                    <span className="font-mono text-muted-foreground tabular-nums">{count}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-md border border-destructive/30 bg-destructive/[0.04] p-2.5 space-y-1">
              <p className="text-[10px] uppercase tracking-wider text-destructive font-semibold">Pattern Signature</p>
              <ul className="text-[11px] text-foreground/90 space-y-0.5 leading-snug">
                <li>· {context.totalRemittances} payouts in {context.windowHours}h</li>
                <li>· Uniform amount ±{context.amountVariancePct}%</li>
                <li>· {context.pctTier1Recipients}% Tier 1 recipients</li>
                <li>· {context.pctNoPriorHistory}% no prior history</li>
                <li>· {context.uniqueBanks} different banks</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="rounded-md border bg-card px-2 py-1.5 min-w-[64px]">
      <p className="text-[9px] uppercase tracking-wider text-muted-foreground leading-tight">{label}</p>
      <p className={`text-sm font-bold tabular-nums leading-tight ${highlight ? 'text-destructive' : 'text-foreground'}`}>
        {value}
      </p>
    </div>
  );
}

// Re-export type for convenience in case someone imports from this module.
export type { PhantomPayrollRecipient };
