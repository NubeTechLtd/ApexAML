import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Newspaper, ChevronDown, ChevronRight, ExternalLink, RefreshCw, Loader2 } from 'lucide-react';

interface NewsItem {
  source: string;
  sourceInitials: string;
  headline: string;
  date: string;
  sentiment: 'Negative' | 'Neutral';
  excerpt: string;
  url: string;
}

const adverseMediaByMatch: Record<string, NewsItem[]> = {
  'SCR-001': [
    {
      source: 'Premium Times',
      sourceInitials: 'PT',
      headline: 'EFCC probes Kano-based financier linked to cross-border terror network',
      date: '2025-02-14',
      sentiment: 'Negative',
      excerpt: 'Economic and Financial Crimes Commission investigators have traced multiple suspicious wire transfers totalling ₦890M through accounts linked to an individual matching the profile of a UN-sanctioned operative.',
      url: '#',
    },
    {
      source: 'Vanguard',
      sourceInitials: 'VG',
      headline: 'UN adds 12 Nigerian nationals to consolidated sanctions list',
      date: '2024-11-05',
      sentiment: 'Negative',
      excerpt: 'The United Nations Security Council expanded its consolidated sanctions list to include twelve individuals with ties to northeast Nigeria, citing evidence of terrorism financing activities across the Lake Chad Basin.',
      url: '#',
    },
    {
      source: 'Reuters',
      sourceInitials: 'RE',
      headline: 'West Africa faces renewed terror financing risks, report warns',
      date: '2024-10-22',
      sentiment: 'Neutral',
      excerpt: 'A joint FATF-GIABA assessment identifies persistent vulnerabilities in cross-border payment corridors between Nigeria, Chad, and Niger that continue to be exploited for illicit financial flows.',
      url: '#',
    },
  ],
  'SCR-002': [
    {
      source: 'Punch',
      sourceInitials: 'PN',
      headline: 'OFAC designates Lagos businessman in West African laundering ring',
      date: '2025-01-20',
      sentiment: 'Negative',
      excerpt: 'The U.S. Treasury Department\'s Office of Foreign Assets Control named a Lagos-based individual as part of a broader West African money laundering network processing over $45M through shell companies.',
      url: '#',
    },
    {
      source: 'ThisDay',
      sourceInitials: 'TD',
      headline: 'CBN freezes accounts linked to OFAC-listed entities',
      date: '2025-01-22',
      sentiment: 'Negative',
      excerpt: 'Central Bank of Nigeria issued directives to commercial banks to immediately restrict accounts associated with newly designated individuals on the OFAC Specially Designated Nationals list.',
      url: '#',
    },
    {
      source: 'TechCabal',
      sourceInitials: 'TC',
      headline: 'Fintech compliance teams scramble after new OFAC sanctions wave',
      date: '2025-01-25',
      sentiment: 'Neutral',
      excerpt: 'Nigerian fintech firms are racing to update their screening databases following a new round of OFAC designations that include individuals with ties to domestic digital payment platforms.',
      url: '#',
    },
  ],
  'SCR-003': [],
};

const sentimentColor: Record<string, string> = {
  Negative: 'bg-destructive/10 text-destructive border-destructive/20',
  Neutral: 'bg-muted text-muted-foreground border-border',
};

const sourceColors = ['bg-primary/10 text-primary', 'bg-destructive/10 text-destructive', 'bg-[hsl(var(--risk-medium))]/10 text-[hsl(var(--risk-medium))]', 'bg-emerald-500/10 text-emerald-700', 'bg-violet-500/10 text-violet-700'];

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function AdverseMediaSection({ matchId, matchScore }: { matchId: string; matchScore: number }) {
  const items = adverseMediaByMatch[matchId] || [];
  const defaultOpen = matchScore > 75;
  const [open, setOpen] = useState(defaultOpen);
  const [refreshing, setRefreshing] = useState(false);
  const [lastChecked] = useState(() => new Date().toLocaleString('en-NG', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false,
  }));

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card className="border-border">
        <CollapsibleTrigger asChild>
          <button className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-muted/30 transition-colors rounded-t-lg">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
                <Newspaper className="h-3.5 w-3.5 text-primary" />
              </div>
              <span className="text-sm font-semibold text-foreground">Adverse Media</span>
              {items.length > 0 && (
                <Badge variant="outline" className="text-[10px] bg-destructive/10 text-destructive border-destructive/20">
                  {items.length} hit{items.length > 1 ? 's' : ''}
                </Badge>
              )}
            </div>
            {open ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0 px-5 pb-4 space-y-3">
            {items.length > 0 ? (
              <>
                <p className="text-xs text-muted-foreground">
                  {items.length} adverse media hit{items.length > 1 ? 's' : ''} across Nigerian and international sources.
                </p>
                <div className="space-y-2.5">
                  {items.map((item, i) => (
                    <div key={i} className="flex gap-3 rounded-lg border border-border bg-card p-3">
                      <div className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold shrink-0 ${sourceColors[i % sourceColors.length]}`}>
                        {item.sourceInitials}
                      </div>
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-medium text-foreground leading-snug">{item.headline}</p>
                          <Badge variant="outline" className={`text-[9px] px-1.5 py-0 shrink-0 ${sentimentColor[item.sentiment]}`}>
                            {item.sentiment}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                          <span className="font-medium">{item.source}</span>
                          <span>·</span>
                          <span>{formatDate(item.date)}</span>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{item.excerpt}</p>
                        <a href={item.url} className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline font-medium mt-0.5">
                          View Article <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-between rounded-lg border border-border bg-muted/20 p-4">
                <p className="text-xs text-muted-foreground">
                  No adverse media found — last checked {lastChecked}
                </p>
                <Button variant="outline" size="sm" className="text-xs h-7 gap-1.5" onClick={handleRefresh} disabled={refreshing}>
                  {refreshing ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                  Refresh Media Scan
                </Button>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
