import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Upload, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

type ListName = 'OFAC' | 'UN' | 'EU' | 'NFIU';

interface MetaRow {
  list_name: ListName;
  last_refreshed_at: string | null;
  record_count: number;
  status: 'success' | 'failed' | 'pending';
  error_message: string | null;
}

function formatDate(iso: string | null): string {
  if (!iso) return 'never';
  const d = new Date(iso);
  return d.toLocaleDateString('en-NG', { day: '2-digit', month: 'short', year: 'numeric' });
}

function chipTone(row: MetaRow): { bg: string; text: string; icon: JSX.Element; label: string } {
  if (row.list_name === 'NFIU') {
    const stale =
      !row.last_refreshed_at ||
      Date.now() - new Date(row.last_refreshed_at).getTime() > 7 * 24 * 60 * 60 * 1000;
    if (stale) {
      return {
        bg: 'bg-[hsl(var(--risk-medium))]/10 border-[hsl(var(--risk-medium))]/30',
        text: 'text-[hsl(var(--risk-medium))]',
        icon: <AlertTriangle className="h-3 w-3" />,
        label: 'Upload required',
      };
    }
  }
  if (row.status === 'failed') {
    return {
      bg: 'bg-destructive/10 border-destructive/30',
      text: 'text-destructive',
      icon: <XCircle className="h-3 w-3" />,
      label: 'Failed',
    };
  }
  return {
    bg: 'bg-emerald-500/10 border-emerald-500/30',
    text: 'text-emerald-500',
    icon: <CheckCircle2 className="h-3 w-3" />,
    label: 'OK',
  };
}

export function SanctionsRefreshStatus() {
  const { toast } = useToast();
  const [meta, setMeta] = useState<MetaRow[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from('sanctions_meta')
      .select('list_name,last_refreshed_at,record_count,status,error_message');
    if (!error && data) setMeta(data as MetaRow[]);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onUpload = async (file: File) => {
    setUploading(true);
    try {
      const path = `${new Date().toISOString().slice(0, 10)}-${file.name}`;
      const { error } = await supabase.storage
        .from('nfiu-list-uploads')
        .upload(path, file, { upsert: false });
      if (error) throw error;
      toast({
        title: 'NFIU list uploaded',
        description: `${file.name} queued for processing on next refresh.`,
      });
      load();
    } catch (err) {
      toast({
        title: 'Upload failed',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const order: ListName[] = ['OFAC', 'UN', 'EU', 'NFIU'];
  const byName = new Map(meta.map((m) => [m.list_name, m] as const));

  return (
    <div className="border-b bg-card px-6 py-2.5 flex items-center gap-2 flex-wrap shrink-0">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mr-1">
        Watchlists
      </span>
      {order.map((name) => {
        const row =
          byName.get(name) ??
          ({
            list_name: name,
            last_refreshed_at: null,
            record_count: 0,
            status: 'pending',
            error_message: null,
          } as MetaRow);
        const tone = chipTone(row);
        const isNfiuStale = name === 'NFIU' && tone.label === 'Upload required';
        return (
          <div
            key={name}
            className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] ${tone.bg} ${tone.text}`}
            title={row.error_message ?? undefined}
          >
            {tone.icon}
            <span className="font-semibold">{name}</span>
            <span className="text-muted-foreground">·</span>
            <span>Last updated: {formatDate(row.last_refreshed_at)}</span>
            <span className="text-muted-foreground">·</span>
            <span>
              {isNfiuStale ? 'Upload required' : `${row.record_count.toLocaleString()} records`}
            </span>
          </div>
        );
      })}

      <div className="ml-auto flex items-center gap-2">
        <input
          ref={fileRef}
          type="file"
          accept=".csv,.xml,text/csv,application/xml,text/xml"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onUpload(f);
          }}
        />
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-[11px]"
          disabled={uploading}
          onClick={() => fileRef.current?.click()}
        >
          <Upload className="h-3 w-3 mr-1.5" />
          {uploading ? 'Uploading…' : 'Upload NFIU list'}
        </Button>
      </div>
    </div>
  );
}
