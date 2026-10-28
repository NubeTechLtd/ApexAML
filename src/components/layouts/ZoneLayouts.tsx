import { Navigate, Outlet, useLocation, useParams } from 'react-router-dom';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { toZonePath } from '@/lib/zones';
import { useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { resetDemoStore } from '@/data-layer/demoStore';

/** Public marketing pages. Dark scoping is applied by MarketingZone. */
export function MarketingLayout() {
  return <Outlet />;
}

/** Sample-data walkthrough of every operational page. Open to everyone. */
export function DemoLayout() {
  // Bumped on reset so every page remounts from the fresh sample data.
  const [generation, setGeneration] = useState(0);
  const reset = () => {
    resetDemoStore();
    setGeneration((g) => g + 1);
    toast.success('Demo reset', { description: 'All sample data is back to its starting state.' });
  };
  return (
    <>
      <div className="fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full border border-border bg-muted py-0.5 pl-3 pr-1 text-xs text-muted-foreground shadow-sm">
        <span>Sample data · changes stay in this browser</span>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 gap-1.5 rounded-full text-xs">
              <RotateCcw className="h-3.5 w-3.5" /> Reset demo
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Reset the demo?</AlertDialogTitle>
              <AlertDialogDescription>
                This clears every change in this demo session (case decisions, frozen accounts, report edits, rule changes, filed CTRs and audit entries) and restores the starting sample data.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={reset}>Reset demo</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
      <Outlet key={generation} />
    </>
  );
}

/** Live institution workspace. Requires a signed-in user. */
export function AppLayout() {
  return (
    <ProtectedRoute requireAdmin={false}>
      <Outlet />
    </ProtectedRoute>
  );
}

/** Sends an old top-level URL to its /demo equivalent, keeping params, query and hash. */
export function LegacyRedirect({ to }: { to?: string }) {
  const { pathname, search, hash } = useLocation();
  const params = useParams();
  let target = to ?? pathname;
  for (const [k, v] of Object.entries(params)) if (v && k !== '*') target = target.replace(`:${k}`, v);
  return <Navigate to={`${toZonePath(target, 'demo') ?? '/demo/dashboard'}${search}${hash}`} replace />;
}
