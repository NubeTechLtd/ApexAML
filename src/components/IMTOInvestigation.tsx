import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Ban, Globe2, MapPin, Banknote, Clock, ShieldAlert, Phone, Fingerprint } from 'lucide-react';
import { useCBNRate } from '@/hooks/useCBNRate';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import type { Alert, Transaction } from '@/data/mockAlerts';

/**
 * Approximate relative coordinates (x%, y%) of key Nigerian cities on a
 * simple rectangular outline of Nigeria. These power the pickup map dots.
 */
const CITY_COORDS: Record<string, { x: number; y: number }> = {
  'Lagos': { x: 18, y: 78 },
  'Ikeja': { x: 19, y: 76 },
  'Surulere': { x: 17, y: 79 },
  'Ibadan': { x: 25, y: 68 },
  'Abuja': { x: 50, y: 48 },
  'Wuse': { x: 50, y: 48 },
  'Kano': { x: 58, y: 18 },
  'Kaduna': { x: 52, y: 32 },
  'Sokoto': { x: 30, y: 12 },
  'Maiduguri': { x: 88, y: 20 },
  'Port Harcourt': { x: 48, y: 88 },
  'GRA': { x: 48, y: 88 },
  'Enugu': { x: 55, y: 68 },
  'Calabar': { x: 65, y: 90 },
  'Benin': { x: 32, y: 72 },
};

function resolveCoord(location: string) {
  // Try matching any token of the location to the known map
  const parts = location.split(/[—,\-/]|\s+/).map(s => s.trim()).filter(Boolean);
  for (const p of parts) {
    if (CITY_COORDS[p]) return CITY_COORDS[p];
  }
  return null;
}

function PickupMap({ locations }: { locations: string[] }) {
  // Count pickups per location for dot-sizing
  const counts = locations.reduce<Record<string, number>>((acc, loc) => {
    acc[loc] = (acc[loc] || 0) + 1;
    return acc;
  }, {});
  const uniqueLocations = Object.entries(counts);

  return (
    <div className="relative w-full max-w-md mx-auto">
      <svg
        viewBox="0 0 100 100"
        className="w-full h-auto rounded-md border bg-muted/30"
        aria-label="Nigeria cash pickup map"
      >
        {/* Simplified outline of Nigeria */}
        <path
          d="M8,22 L22,10 L38,8 L55,12 L72,14 L88,18 L95,30 L92,48 L88,62 L82,78 L70,90 L55,94 L40,92 L28,86 L18,74 L10,58 L6,40 Z"
          fill="hsl(var(--muted))"
          stroke="hsl(var(--border))"
          strokeWidth="0.4"
        />
        {/* Capital marker */}
        <circle cx="50" cy="48" r="0.6" fill="hsl(var(--muted-foreground))" opacity="0.4" />
        <text x="52" y="47" fontSize="2.2" fill="hsl(var(--muted-foreground))" opacity="0.6">
          Abuja
        </text>

        {/* Pickup dots */}
        {uniqueLocations.map(([loc, count]) => {
          const coord = resolveCoord(loc);
          if (!coord) return null;
          const radius = 1.4 + count * 0.7;
          return (
            <g key={loc}>
              {/* Pulse halo */}
              <circle
                cx={coord.x}
                cy={coord.y}
                r={radius + 1.6}
                fill="hsl(var(--destructive))"
                opacity="0.15"
              />
              <circle
                cx={coord.x}
                cy={coord.y}
                r={radius}
                fill="hsl(var(--destructive))"
                stroke="hsl(var(--background))"
                strokeWidth="0.3"
              />
              <text
                x={coord.x + radius + 0.8}
                y={coord.y + 0.8}
                fontSize="2.4"
                fontWeight="600"
                fill="hsl(var(--foreground))"
              >
                {loc.split(/[—-]/)[0].trim()} ({count})
              </text>
            </g>
          );
        })}
      </svg>
      <p className="text-[10px] text-muted-foreground text-center mt-2">
        Red dots mark IMTO cash pickup locations. Dot size scales with pickup count.
      </p>
    </div>
  );
}

interface IMTOInvestigationProps {
  alert: Alert;
  isResolved: boolean;
}

export function IMTOInvestigation({ alert, isResolved }: IMTOInvestigationProps) {
  const { toast } = useToast();
  const { rate, formatUSD } = useCBNRate();
  const [blockOpen, setBlockOpen] = useState(false);
  const [blocked, setBlocked] = useState(false);

  const imto = alert.imto;
  if (!imto) return null;

  const formatNGN = (n: number) =>
    new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(n);

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleString('en-NG', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

  const thresholdBreachPct = Math.round(((imto.usdEquivalent - 200) / 200) * 100);

  const confirmBlock = () => {
    setBlocked(true);
    setBlockOpen(false);
    toast({
      title: 'Pickups blocked',
      description: `${imto.beneficiaryName} cannot collect further IMTO cash at any Zuia-connected agent for 24 hours.`,
    });
  };

  return (
    <>
      {/* ── IMTO Header Card ──────────────────────────── */}
      <Card className="border-l-4 border-l-destructive bg-destructive/[0.02]">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <Globe2 className="h-4 w-4 text-destructive" />
                <CardTitle className="text-sm font-semibold">IMTO Cash Payout Investigation</CardTitle>
                <Badge className="bg-destructive text-destructive-foreground border-0 text-[10px] font-bold uppercase tracking-wide gap-1">
                  <ShieldAlert className="h-3 w-3" />
                  $200 CBN Cash Limit
                </Badge>
                {blocked && (
                  <Badge variant="outline" className="bg-muted text-muted-foreground text-[10px] gap-1">
                    <Ban className="h-3 w-3" /> Pickups Blocked · 24h
                  </Badge>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground">
                Cumulative cash collected against a single beneficiary identity across all Zuia-connected IMTO agents (rolling 24h window).
              </p>
            </div>
            <Button
              size="sm"
              variant="destructive"
              className="gap-1.5 shrink-0"
              onClick={() => setBlockOpen(true)}
              disabled={isResolved || blocked}
            >
              <Ban className="h-3.5 w-3.5" />
              {blocked ? 'Pickups Blocked' : 'Block Subsequent Pickups'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Stat grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="rounded-lg border bg-card p-3">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Pickup Count (24h)</p>
              <p className="text-xl font-bold text-destructive tabular-nums mt-0.5">{imto.cashPickupCount}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">across {imto.agentLocations.length} agent{imto.agentLocations.length !== 1 ? 's' : ''}</p>
            </div>
            <div className="rounded-lg border bg-card p-3">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Cumulative NGN</p>
              <p className="text-xl font-bold text-foreground tabular-nums mt-0.5">{formatNGN(imto.totalCashNGN)}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">rolling 24h</p>
            </div>
            <div className="rounded-lg border bg-card p-3">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">USD Equivalent</p>
              <p className="text-xl font-bold text-destructive tabular-nums mt-0.5">${imto.usdEquivalent.toLocaleString()}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">@ CBN ₦{rate.toLocaleString()}/$1</p>
            </div>
            <div className="rounded-lg border bg-card p-3">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Threshold Breach</p>
              <p className="text-xl font-bold text-destructive tabular-nums mt-0.5">+{thresholdBreachPct}%</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">over {imto.triggerThreshold}</p>
            </div>
          </div>

          {/* Beneficiary identity */}
          <div className="rounded-lg border bg-card p-3 grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Sender Country</p>
              <p className="text-sm font-semibold text-foreground mt-0.5">🌍 {imto.senderCountry}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Beneficiary</p>
              <p className="text-sm font-semibold text-foreground mt-0.5">{imto.beneficiaryName}</p>
            </div>
            <div className="flex items-start gap-1.5">
              <Phone className="h-3.5 w-3.5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Phone</p>
                <p className="text-xs font-mono text-foreground mt-0.5">{imto.beneficiaryPhone}</p>
              </div>
            </div>
            {imto.beneficiaryNIN && (
              <div className="flex items-start gap-1.5">
                <Fingerprint className="h-3.5 w-3.5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">NIN</p>
                  <p className="text-xs font-mono text-foreground mt-0.5">{imto.beneficiaryNIN}</p>
                </div>
              </div>
            )}
          </div>

          {/* Pickup map + collection timeline */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="h-3.5 w-3.5 text-destructive" />
                <p className="text-xs font-semibold text-foreground">Cumulative Pickup Map</p>
              </div>
              <PickupMap locations={imto.agentLocations} />
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-3.5 w-3.5 text-destructive" />
                <p className="text-xs font-semibold text-foreground">Cash Collection Timeline</p>
              </div>
              <ol className="relative border-l border-border ml-2 space-y-3 pt-1">
                {alert.transactions.map((tx) => (
                  <IMTOTimelineEntry key={tx.id} tx={tx} rate={rate} formatNGN={formatNGN} formatTime={formatTime} />
                ))}
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Block confirmation dialog ─────────────────── */}
      <AlertDialog open={blockOpen} onOpenChange={setBlockOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Ban className="h-5 w-5 text-destructive" />
              Block Subsequent IMTO Pickups?
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 pt-1">
                <p className="text-sm">
                  This will prevent this beneficiary from receiving further cash at any
                  Zuia-connected IMTO agent for 24 hours.
                </p>
                <div className="rounded-md border bg-muted/40 p-3 text-xs space-y-1">
                  <div className="flex justify-between"><span className="text-muted-foreground">Beneficiary</span><span className="font-medium text-foreground">{imto.beneficiaryName}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Phone</span><span className="font-mono text-foreground">{imto.beneficiaryPhone}</span></div>
                  {imto.beneficiaryNIN && <div className="flex justify-between"><span className="text-muted-foreground">NIN</span><span className="font-mono text-foreground">{imto.beneficiaryNIN}</span></div>}
                  <div className="flex justify-between"><span className="text-muted-foreground">Block duration</span><span className="font-medium text-foreground">24 hours</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Scope</span><span className="font-medium text-foreground">All Zuia IMTO agents</span></div>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Action will be recorded to the immutable audit log and notified to assigned compliance officer.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmBlock}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Confirm Block
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function IMTOTimelineEntry({
  tx, rate, formatNGN, formatTime,
}: {
  tx: Transaction;
  rate: number;
  formatNGN: (n: number) => string;
  formatTime: (iso: string) => string;
}) {
  const usd = tx.amountNGN / rate;
  const nearThreshold = usd >= 150 && usd < 200;

  return (
    <li className="ml-4 relative">
      <span className="absolute -left-[21px] top-1 h-3 w-3 rounded-full bg-destructive ring-2 ring-background" />
      <div className="rounded-md border bg-card p-2.5 space-y-1">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-foreground truncate">
              {tx.imtoOperator ?? tx.counterparty.split('/')[0]}
            </p>
            <p className="text-[10px] text-muted-foreground flex items-center gap-1">
              <MapPin className="h-2.5 w-2.5" />
              {tx.agentLocation ?? '—'}
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-xs font-semibold text-foreground tabular-nums">{formatNGN(tx.amountNGN)}</p>
            <p className={cn('text-[10px] tabular-nums', nearThreshold ? 'text-destructive font-semibold' : 'text-muted-foreground')}>
              ≈ ${usd.toFixed(0)} USD
            </p>
          </div>
        </div>
        <div className="flex items-center justify-between pt-1 border-t border-border/60">
          <p className="text-[10px] text-muted-foreground flex items-center gap-1">
            <Clock className="h-2.5 w-2.5" />
            {formatTime(tx.date)}
          </p>
          {nearThreshold && (
            <Badge variant="outline" className="text-[9px] h-4 px-1.5 bg-destructive/10 text-destructive border-destructive/30">
              Near $200 cap
            </Badge>
          )}
        </div>
      </div>
    </li>
  );
}
