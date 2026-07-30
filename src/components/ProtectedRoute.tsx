import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

type GateState = 'checking' | 'allowed' | 'denied' | 'mfa-required' | 'mfa-setup-required';

export function ProtectedRoute({ children, requireAdmin = true }: ProtectedRouteProps) {
  const { session, loading } = useAuth();
  const [gate, setGate] = useState<GateState>(requireAdmin ? 'checking' : 'allowed');

  useEffect(() => {
    if (!requireAdmin) {
      setGate('allowed');
      return;
    }
    if (loading) return;
    if (!session?.user) {
      setGate('checking');
      return;
    }

    let cancelled = false;
    setGate('checking');

    (async () => {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id)
        .eq('role', 'admin')
        .maybeSingle();

      if (cancelled) return;
      if (error || !data) {
        setGate('denied');
        return;
      }

      // Admin confirmed — enforce AAL2 (MFA) for admin sessions.
      const [{ data: aal }, { data: factors }] = await Promise.all([
        supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
        supabase.auth.mfa.listFactors(),
      ]);
      if (cancelled) return;

      const hasVerifiedTotp = (factors?.totp ?? []).some((f) => f.status === 'verified');

      if (hasVerifiedTotp && aal?.currentLevel !== 'aal2') {
        setGate('mfa-required');
        return;
      }
      if (!hasVerifiedTotp) {
        setGate('mfa-setup-required');
        return;
      }
      setGate('allowed');
    })();

    return () => {
      cancelled = true;
    };
  }, [session, loading, requireAdmin]);

  if (loading || (requireAdmin && session && gate === 'checking')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && gate === 'denied') {
    // Sign the non-admin out so they don't get stuck in a redirect loop.
    supabase.auth.signOut();
    return <Navigate to="/login?error=unauthorized" replace />;
  }

  if (requireAdmin && gate === 'mfa-required') {
    return <Navigate to="/login?mfa=required" replace />;
  }

  if (requireAdmin && gate === 'mfa-setup-required') {
    return <Navigate to="/settings?setup=mfa" replace />;
  }

  return <>{children}</>;
}
