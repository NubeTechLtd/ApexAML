import { Navigate, Outlet, useLocation, useParams } from 'react-router-dom';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { toZonePath } from '@/lib/zones';

/** Public marketing pages. Dark scoping is applied by MarketingZone. */
export function MarketingLayout() {
  return <Outlet />;
}

/** Sample-data walkthrough of every operational page. Open to everyone. */
export function DemoLayout() {
  return <Outlet />;
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
