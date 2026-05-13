import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Store, AlertTriangle, Send, ShieldCheck, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const PAYOUTS = [
  { agent: 'POS Agent · Lekki Phase 1', amount: 190 },
  { agent: 'POS Agent · Yaba Tech Hub', amount: 190 },
  { agent: 'POS Agent · Surulere Mkt', amount: 190 },
  { agent: 'POS Agent · Ikeja GRA', amount: 190 },
  { agent: 'POS Agent · Victoria Island', amount: 190 },
];

export function InboundSmurfingVisualizer() {
  const [filing, setFiling] = useState(false);
  const [filed, setFiled] = useState(false);

  const handleFile = async () => {
    if (filed || filing) return;
    setFiling(true);
    // Simulate goAML XML build + transmission
    await new Promise((r) => setTimeout(r, 1100));
    setFiling(false);
    setFiled(true);
    toast.success('Cross-border syndicate filed. CBN license protected.', {
      description: 'goAML XML transmitted · NFIU ack STR-2026-0419 · 5 sub-transactions linked',
    });
  };

  return (
    <Card className="border-destructive/30">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              Inbound Smurfing Detection
            </CardTitle>
            <p className="text-[11px] text-muted-foreground mt-1 leading-snug max-w-md">
              1 UK sender → 5 sub-$200 payouts to 5 different Lagos POS agents.
              Engineered to evade the $200 cash-payout disclosure rule.
            </p>
          </div>
          <Badge
            variant="outline"
            className="text-[10px] border-destructive/40 text-destructive bg-destructive/5 shrink-0"
          >
            Typology T-NG-IMTO-204
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Visual graph */}
        <div className="rounded-lg border bg-muted/30 p-4">
          <div className="grid grid-cols-[160px_1fr_220px] items-center gap-3">
            {/* Source node */}
            <div className="flex flex-col items-center text-center gap-1.5">
              <div className="relative">
                <div className="h-14 w-14 rounded-full bg-destructive/15 border-2 border-destructive/60 flex items-center justify-center">
                  <User className="h-6 w-6 text-destructive" />
                </div>
                <span className="absolute -top-1 -right-1 text-base" aria-hidden>🇬🇧</span>
              </div>
              <p className="text-[11px] font-semibold leading-tight">UK Sender</p>
              <p className="text-[9px] font-mono text-muted-foreground">
                A. Okafor · Manchester
              </p>
              <p className="text-[10px] font-bold text-destructive tabular-nums">
                $950 total
              </p>
            </div>

            {/* Edges (SVG) */}
            <div className="relative h-[200px]">
              <svg
                viewBox="0 0 200 200"
                className="absolute inset-0 w-full h-full"
                preserveAspectRatio="none"
              >
                <defs>
                  <linearGradient id="smurf-edge" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="hsl(var(--destructive))" stopOpacity="0.9" />
                    <stop offset="100%" stopColor="hsl(var(--destructive))" stopOpacity="0.35" />
                  </linearGradient>
                </defs>
                {PAYOUTS.map((_, i) => {
                  const targetY = 20 + (i * 160) / (PAYOUTS.length - 1);
                  return (
                    <g key={i}>
                      <path
                        d={`M 0 100 C 80 100, 120 ${targetY}, 200 ${targetY}`}
                        fill="none"
                        stroke="url(#smurf-edge)"
                        strokeWidth="1.5"
                        strokeDasharray="4 4"
                      >
                        <animate
                          attributeName="stroke-dashoffset"
                          from="0"
                          to="-16"
                          dur="1.6s"
                          repeatCount="indefinite"
                        />
                      </path>
                      <motion.circle
                        r="3"
                        fill="hsl(var(--destructive))"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0, 1, 0] }}
                        transition={{
                          duration: 2.4,
                          delay: i * 0.25,
                          repeat: Infinity,
                          repeatType: 'loop',
                        }}
                      >
                        <animateMotion
                          dur="2.4s"
                          repeatCount="indefinite"
                          begin={`${i * 0.25}s`}
                          path={`M 0 100 C 80 100, 120 ${targetY}, 200 ${targetY}`}
                        />
                      </motion.circle>
                    </g>
                  );
                })}
              </svg>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-2 py-1 rounded-md bg-background border text-[9px] font-semibold uppercase tracking-wider text-destructive">
                5 × $190
              </div>
            </div>

            {/* Target nodes */}
            <div className="space-y-1.5">
              {PAYOUTS.map((p, i) => (
                <motion.div
                  key={p.agent}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08, duration: 0.4 }}
                  className="flex items-center gap-2 rounded-md border bg-card px-2 py-1.5"
                >
                  <div className="h-6 w-6 rounded-md bg-destructive/10 border border-destructive/30 flex items-center justify-center shrink-0">
                    <Store className="h-3 w-3 text-destructive" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-medium truncate leading-tight">
                      {p.agent}
                    </p>
                  </div>
                  <p className="text-[10px] font-mono font-bold tabular-nums text-destructive">
                    ${p.amount}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Detection note */}
          <div className="mt-3 pt-3 border-t flex items-start gap-2">
            <ShieldCheck className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
            <p className="text-[11px] text-muted-foreground leading-snug">
              <span className="font-semibold text-foreground">ApexAML linked</span> the 5
              transactions via shared device fingerprint, common BVN payee chain, and
              90-second burst window — a pattern a human reviewer would have missed.
            </p>
          </div>
        </div>

        {/* Action */}
        <Button
          onClick={handleFile}
          disabled={filing || filed}
          className={cn(
            'w-full gap-2 font-semibold',
            filed && 'bg-emerald-600 hover:bg-emerald-600 text-white',
          )}
        >
          {filing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Building goAML XML…
            </>
          ) : filed ? (
            <>
              <ShieldCheck className="h-4 w-4" />
              Filed · STR-2026-0419
            </>
          ) : (
            <>
              <Send className="h-4 w-4" />
              Auto-file network to NFIU goAML
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
