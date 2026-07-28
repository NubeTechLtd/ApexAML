import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Loader2 } from 'lucide-react';

interface ScreenResult {
  id: string;
  entity_name: string;
  source: string;
  entity_type: string | null;
  reason: string | null;
  list_date: string | null;
  aliases: string[] | null;
  nationality: string | null;
  score: number;
}

export function LiveScreenPanel() {
  const [query, setQuery] = useState('');
  const [threshold, setThreshold] = useState(0.3);
  const [results, setResults] = useState<ScreenResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    const name = query.trim();
    if (!name) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.rpc('screen_entity', {
        search_name: name,
        threshold,
      });
      if (error) throw error;
      setResults((data ?? []) as ScreenResult[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Screening failed');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border-b bg-muted/20 px-6 py-3 shrink-0">
      <div className="flex items-center gap-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && run()}
          placeholder="Screen a customer name against OFAC, UN, EU & NFIU (fuzzy match)…"
          className="h-8 max-w-md text-sm"
        />
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <span>Threshold</span>
          <input
            type="range"
            min={0.1}
            max={0.9}
            step={0.05}
            value={threshold}
            onChange={(e) => setThreshold(parseFloat(e.target.value))}
            className="w-24"
          />
          <span className="tabular-nums w-8">{threshold.toFixed(2)}</span>
        </div>
        <Button size="sm" className="h-8" onClick={run} disabled={loading || !query.trim()}>
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Screen'}
        </Button>
        {results && (
          <span className="text-[11px] text-muted-foreground ml-2">
            {results.length} match{results.length === 1 ? '' : 'es'}
          </span>
        )}
      </div>

      {error && <p className="mt-2 text-xs text-destructive">{error}</p>}

      {results && results.length > 0 && (
        <div className="mt-3 grid gap-1.5 max-h-56 overflow-y-auto">
          {results.map((r) => (
            <div
              key={r.id}
              className="flex items-center gap-3 rounded-md border bg-card px-3 py-2 text-xs"
            >
              <Badge variant="outline" className="text-[10px]">
                {r.source}
              </Badge>
              <span className="font-medium text-foreground truncate flex-1">{r.entity_name}</span>
              {r.entity_type && (
                <span className="text-muted-foreground text-[10px]">{r.entity_type}</span>
              )}
              {r.nationality && (
                <span className="text-muted-foreground text-[10px]">{r.nationality}</span>
              )}
              {r.list_date && (
                <span className="text-muted-foreground text-[10px]">
                  {new Date(r.list_date).toLocaleDateString('en-NG')}
                </span>
              )}
              <span className="font-mono text-[11px] tabular-nums text-primary">
                {(r.score * 100).toFixed(0)}%
              </span>
            </div>
          ))}
        </div>
      )}

      {results && results.length === 0 && !loading && !error && (
        <p className="mt-2 text-xs text-muted-foreground">No matches above threshold.</p>
      )}
    </div>
  );
}
