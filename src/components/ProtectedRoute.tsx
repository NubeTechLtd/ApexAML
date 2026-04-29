import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export function ProtectedRoute({ children, requireAdmin = true }: ProtectedRouteProps) {
  const { session, loading } = useAuth();
  const [adminState, setAdminState] = useState<'checking' | 'allowed' | 'denied'>(
    requireAdmin ? 'checking' : 'allowed',
  );

  useEffect(() => {
    if (!requireAdmin) {
      setAdminState('allowed');
      return;
    }
    if (loading) return;
    if (!session?.user) {
      // Will be redirected below; reset state for clean re-entry.
      setAdminState('checking');
      return;
    }

    let cancelled = false;
    setAdminState('checking');
    supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', session.user.id)
      .eq('role', 'admin')
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error || !data) {
          setAdminState('denied');
        } else {
          setAdminState('allowed');
        }
      });

    return () => {
      cancelled = true;
    };
  }, [session, loading, requireAdmin]);

  if (loading || (requireAdmin && session && adminState === 'checking')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && adminState === 'denied') {
    // Sign the non-admin out so they don't get stuck in a redirect loop.
    supabase.auth.signOut();
    return <Navigate to="/login?error=unauthorized" replace />;
  }

  return <>{children}</>;
}
