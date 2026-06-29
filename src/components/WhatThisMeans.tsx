import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, ChevronDown } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Alert } from '@/data/mockAlerts';
import { useCBNRate } from '@/hooks/useCBNRate';

interface TypologyInfo {
  title: string;
  explanation: string;
  checks?: string[];
  cbnBadge: string;
  strRate: number;
}

const TYPOLOGY_MAP: Record<string, TypologyInfo> = {
  POS_ROUND_TRIP: {
    title: 'POS Round-Tripping',
    explanation:
      'POS Round-Tripping is when a customer withdraws large amounts of cash through multiple POS terminals in a short period, then deposits a similar amount back — often to a different account. This is a common money laundering method in Nigeria because POS transactions feel informal and hard to trace. CBN Circular BSD/DIR/PUB/LAB/019/002 lists this as a high-priority detection requirement.',
    checks: [
      'Do all the POS terminals belong to the same agent network?',
      'Where did the withdrawn cash go — is there a corresponding deposit elsewhere?',
      'Does the total amount match any known financial crime threshold ($10,000 USD equivalent = ₦{threshold} at current rate)?',
    ],
    cbnBadge: 'Circular §6.2 — Velocity and structuring detection',
    strRate: 82,
  },
  BDC_SMURFING: {
    title: 'Bureau de Change Smurfing',
    explanation:
      'Bureau de Change Smurfing is when a customer splits a large foreign exchange purchase into many smaller transactions across multiple BDC operators to stay below the reporting threshold. Each individual transaction looks legal — but the pattern reveals the intent.',
    cbnBadge: 'Circular §6.4 — Cross-institution aggregation',
    strRate: 76,
  },
  USSD_LAYERING: {
    title: 'USSD Layering',
    explanation:
      'USSD Layering is the rapid movement of funds through multiple mobile wallets using USSD codes — often completed in minutes. The goal is to separate the original source of funds from the final destination through so many hops that the trail becomes difficult to follow.',
    cbnBadge: 'Circular §6.3 — Channel velocity monitoring',
    strRate: 68,
  },
  IMTO_CASH_SMURFING: {
    title: 'IMTO Cash Limit Smurfing',
    explanation:
      'This customer received multiple remittance payouts that individually stayed below the $200 USD cash payout limit, but cumulatively exceeded it across multiple agents within 24 hours. CBN IMTO Guidelines §4.2 requires cross-agent aggregation to detect this pattern.',
    cbnBadge: 'IMTO Guidelines §4.2 — Cross-agent 24h aggregation',
    strRate: 91,
  },
  GENERIC: {
    title: 'Suspicious Activity Detected',
    explanation:
      'This alert has been triggered by an anomaly in the customer\'s transaction behaviour. Review the timeline below and assess whether the pattern meets the threshold for a Suspicious Transaction Report.',
    cbnBadge: 'CBN Circular BSD/DIR/PUB/LAB/019/002 — General monitoring obligation',
    strRate: 65,
  },
};

function deriveTypologyCode(alert: Alert): string {
  const rule = alert.ruleTriggered.toLowerCase();
  if (
    alert.alertType === 'IMTO_CASH_SMURFING' ||
    rule.includes('imto')
  ) {
    return 'IMTO_CASH_SMURFING';
  }
  if (alert.bdcRoundTrip || rule.includes('bdc') || rule.includes('smurf')) {
    return 'BDC_SMURFING';
  }
  if (rule.includes('layering') || rule.includes('ussd')) {
    return 'USSD_LAYERING';
  }
  if (
    rule.includes('structuring') ||
    rule.includes('round-trip') ||
    alert.transactions.some((t) => t.channel === 'POS')
  ) {
    return 'POS_ROUND_TRIP';
  }
  return 'GENERIC';
}

export function WhatThisMeans({ alert }: { alert: Alert }) {
  const { rate } = useCBNRate();
  const threshold = (10_000 * rate).toLocaleString('en-NG');

  const [isOpen, setIsOpen] = useState(() => {
    const seen = typeof window !== 'undefined' ? localStorage.getItem('apexaml_wtm_seen') : null;
    const collapsed = typeof window !== 'undefined' ? localStorage.getItem('apexaml_wtm_collapsed') : null;
    if (!seen) return true;
    return collapsed !== 'true';
  });

  useEffect(() => {
    localStorage.setItem('apexaml_wtm_seen', 'true');
  }, []);

  const toggle = () => {
    setIsOpen((prev) => {
      const next = !prev;
      localStorage.setItem('apexaml_wtm_collapsed', String(!next));
      return next;
    });
  };

  const code = deriveTypologyCode(alert);
  const info = TYPOLOGY_MAP[code];

  const formattedChecks = info.checks?.map((c) =>
    c.replace('₦{threshold}', `₦${threshold}`)
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <Card className="border-l-2 border-l-primary/50">
        <button
          onClick={toggle}
          className="w-full text-left px-5 py-3 flex items-center justify-between gap-3 hover:bg-muted/30 transition-colors rounded-t-lg"
        >
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">
              What this alert means
            </span>
          </div>
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </motion.div>
        </button>

        <AnimatePresence initial={false}>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <CardContent className="px-5 pb-4 pt-0 space-y-4">
                <div className="space-y-2">
                  <h4 className="text-sm font-bold text-foreground">
                    {info.title}
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {info.explanation}
                  </p>
                </div>

                {formattedChecks && formattedChecks.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-[11px] font-semibold text-foreground uppercase tracking-wider">
                      What you must check
                    </p>
                    <ol className="list-decimal list-inside space-y-1">
                      {formattedChecks.map((check, i) => (
                        <li
                          key={i}
                          className="text-xs text-muted-foreground leading-relaxed"
                        >
                          {check}
                        </li>
                      ))}
                    </ol>
                  </div>
                )}

                <Badge
                  variant="outline"
                  className="text-[10px] bg-primary/10 text-primary border-primary/20"
                >
                  {info.cbnBadge}
                </Badge>

                <div className="space-y-1 pt-1">
                  <p className="text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">Typical outcome:</span>{' '}
                    {info.strRate}% of similar cases result in STR filing · Average
                    investigation time with ApexAML: 11 minutes
                  </p>
                  <p className="text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">Regulatory deadline:</span>{' '}
                    STR must be filed within 24 hours of suspicion forming (NFIU Directive 2023)
                  </p>
                </div>
              </CardContent>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
}
