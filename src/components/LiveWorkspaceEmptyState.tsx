import { Link } from 'react-router-dom';
import { FileUp, Inbox } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

/** Shown in the live workspace when the institution has no alerts yet. CSV import is a placeholder until it is built. */
export function LiveWorkspaceEmptyState() {
  return (
    <div className="w-full max-w-lg rounded-lg border border-dashed border-border bg-card p-8 text-center space-y-4">
      <Inbox className="h-8 w-8 text-muted-foreground mx-auto" />
      <div className="space-y-1">
        <h2 className="text-base font-semibold text-foreground">No cases yet</h2>
        <p className="text-sm text-muted-foreground">
          Your institution's workspace is ready. Alerts appear here once transactions reach ApexAML from your core banking system or a data import.
        </p>
      </div>
      <div className="rounded-md border border-border bg-muted/40 p-4 text-left space-y-2">
        <div className="flex items-center gap-2">
          <FileUp className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">Import customers and transactions from CSV</span>
          <Badge variant="outline" className="ml-auto text-[10px]">Coming soon</Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          CSV import isn't available yet. During your pilot, our team loads your initial data with you.
        </p>
        <Button size="sm" variant="outline" disabled aria-disabled="true">
          <FileUp className="h-3.5 w-3.5 mr-1" />Import CSV
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Complete your <Link to="/app/settings" className="underline">institution profile</Link> so draft goAML exports can be prepared.
      </p>
    </div>
  );
}
