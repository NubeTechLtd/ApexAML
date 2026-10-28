import { Link, Navigate, Outlet, useLocation, useNavigate, useParams } from 'react-router-dom';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { toZonePath } from '@/lib/zones';
import { useState } from 'react';
import { CalendarCheck, Compass, Rocket, RotateCcw } from 'lucide-react';
import { DemoNotificationDelivery } from '@/components/DemoNotificationDelivery';
import { ProductTourModal } from '@/components/ProductTourModal';
import { BookDemoSheet } from '@/components/landing/BookDemoSheet';
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
  const [tourOpen, setTourOpen] = useState(false);
  const [bookOpen, setBookOpen] = useState(false);
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const reset = () => {
    resetDemoStore();
    setGeneration((g) => g + 1);
    toast.success('Demo reset', { description: 'All sample data is back to its starting state.' });
  };
  // Overview modal first, then the step-by-step guide on the real screens.
  const closeTour = () => {
    setTourOpen(false);
    navigate(`${pathname === '/demo' ? '/demo/dashboard' : pathname}?tour=1`);
  };
  return (
    <div className="demo-zone">
      {pathname !== '/demo' && <DemoNotificationDelivery />}
      <div role="status" className="sticky top-0 z-50 flex min-h-10 flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b border-border bg-muted px-4 py-1 text-xs text-muted-foreground">
        <span className="font-medium">Demo environment: sample data only, no live connections.</span>
        <div className="flex flex-wrap items-center gap-1">
          <Button asChild variant="ghost" size="sm" className="h-7 text-xs"><Link to="/demo/inbox">Inbox</Link></Button>
          <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-xs" onClick={() => setTourOpen(true)}>
            <Compass className="h-3.5 w-3.5" /> Guided tour
          </Button>
          <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-xs" onClick={() => setBookOpen(true)}>
            <CalendarCheck className="h-3.5 w-3.5" /> Book a walkthrough
          </Button>
          <Button asChild size="sm" className="h-7 gap-1.5 text-xs">
            <Link to="/contact?topic=pilot"><Rocket className="h-3.5 w-3.5" /> Start a pilot</Link>
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-xs">
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
      </div>
      <ProductTourModal open={tourOpen} onClose={closeTour} onBookDemo={() => { setTourOpen(false); setBookOpen(true); }} />
      <BookDemoSheet open={bookOpen} onOpenChange={setBookOpen} />
      <Outlet key={generation} />
    </div>
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
