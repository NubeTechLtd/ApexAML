import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, FileUp, Inbox, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDataProvider } from '@/data-layer/hooks';
import { useToast } from '@/hooks/use-toast';
import {
  ALERT_CSV_COLUMNS, ALERT_CSV_MAX_BYTES, ALERT_CSV_MAX_ROWS, parseAlertsCsv, type AlertCsvRow,
} from '@/lib/alertsCsv';

interface Props {
  /** Called after a successful import so the workspace reloads its cases. */
  onImported?: () => void;
}

/** Shown in the live workspace when the institution has no alerts yet; offers CSV case import. */
export function LiveWorkspaceEmptyState({ onImported }: Props) {
  const provider = useDataProvider();
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState('');
  const [rows, setRows] = useState<AlertCsvRow[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [importing, setImporting] = useState(false);
  const canImport = typeof provider.alerts.importCsv === 'function';

  const reset = () => {
    setFileName(''); setRows([]); setErrors([]);
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleFile = async (file: File | undefined) => {
    setRows([]); setErrors([]);
    if (!file) return;
    setFileName(file.name);
    if (!/\.csv$/i.test(file.name)) { setErrors(['Choose a .csv file.']); return; }
    if (file.size > ALERT_CSV_MAX_BYTES) { setErrors(['The file is larger than 1 MB.']); return; }
    const result = parseAlertsCsv(await file.text());
    setRows(result.rows);
    setErrors(result.errors);
  };

  const handleImport = async () => {
    if (!provider.alerts.importCsv || rows.length === 0) return;
    setImporting(true);
    try {
      const result = await provider.alerts.importCsv(rows, fileName);
      toast({
        title: `${result.imported} case${result.imported === 1 ? '' : 's'} imported`,
        description: result.customersCreated > 0
          ? `${result.customersCreated} new customer record${result.customersCreated === 1 ? '' : 's'} created. The import is recorded in the audit trail.`
          : 'The import is recorded in the audit trail.',
      });
      reset();
      onImported?.();
    } catch (e) {
      setErrors([e instanceof Error ? e.message : 'The import failed. No cases were added.']);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="w-full max-w-lg rounded-lg border border-dashed border-border bg-card p-8 text-center space-y-4">
      <Inbox className="h-8 w-8 text-muted-foreground mx-auto" />
      <div className="space-y-1">
        <h2 className="text-base font-semibold text-foreground">No cases yet</h2>
        <p className="text-sm text-muted-foreground">
          Your institution's workspace is ready. Alerts appear here once transactions reach ApexAML from your core banking system or a data import.
        </p>
      </div>
      <div className="rounded-md border border-border bg-muted/40 p-4 text-left space-y-3">
        <div className="flex items-center gap-2">
          <FileUp className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">Import cases from CSV</span>
        </div>
        <p className="text-xs text-muted-foreground">
          Columns: <span className="font-mono">{ALERT_CSV_COLUMNS.join(', ')}</span>. Up to {ALERT_CSV_MAX_ROWS} cases per file.
          risk_level is Critical, High, Medium or Low; bvn, description and amount_ngn may be blank. Customers are matched by BVN.
        </p>
        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          className="sr-only"
          aria-label="Choose CSV file"
          onChange={(e) => void handleFile(e.target.files?.[0])}
          disabled={!canImport || importing}
        />
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => inputRef.current?.click()} disabled={!canImport || importing}>
            <FileUp className="h-3.5 w-3.5 mr-1" />{fileName ? 'Choose another file' : 'Choose CSV file'}
          </Button>
          {rows.length > 0 && errors.length === 0 && (
            <Button size="sm" onClick={() => void handleImport()} disabled={importing}>
              {importing && <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />}
              Import {rows.length} case{rows.length === 1 ? '' : 's'}
            </Button>
          )}
        </div>
        {fileName && <p className="text-xs text-muted-foreground truncate">File: {fileName}</p>}
        {errors.length > 0 && (
          <div role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 p-3 space-y-1">
            <p className="flex items-center gap-1.5 text-xs font-medium text-destructive">
              <AlertCircle className="h-3.5 w-3.5" />Nothing was imported. Fix the file and try again.
            </p>
            <ul className="text-xs text-foreground list-disc pl-5 max-h-40 overflow-y-auto space-y-0.5">
              {errors.slice(0, 20).map((e) => <li key={e}>{e}</li>)}
              {errors.length > 20 && <li>…and {errors.length - 20} more.</li>}
            </ul>
          </div>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        Complete your <Link to="/app/settings" className="underline">institution profile</Link> so draft goAML exports can be prepared.
      </p>
    </div>
  );
}
