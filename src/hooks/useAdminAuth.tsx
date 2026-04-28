import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

type AuthState = 'loading' | 'unauthenticated' | 'forbidden' | 'admin';

export function useAdminAuth() {
  const [state, setState] = useState<AuthState>('loading');
  const [email, setEmail] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;

    const evaluate = async (userId: string | null, userEmail: string | null) => {
      if (!userId) {
        if (mounted) {
          setState('unauthenticated');
          navigate('/login', { replace: true });
        }
        return;
      }
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .eq('role', 'admin')
        .maybeSingle();
      if (!mounted) return;
      setEmail(userEmail);
      if (error || !data) setState('forbidden');
      else setState('admin');
    };

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      evaluate(session?.user?.id ?? null, session?.user?.email ?? null);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      evaluate(session?.user?.id ?? null, session?.user?.email ?? null);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [navigate]);

  return { state, email };
}
