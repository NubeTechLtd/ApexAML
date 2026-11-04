import { supabase } from '@/integrations/supabase/client';

let cached: { userId: string; institutionId: string } | null = null;

/** Returns the signed-in user's institution (first membership). Storage paths and scoped rows start with it. */
export async function getCurrentInstitutionId(): Promise<string> {
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) throw new Error('Sign in to continue.');
  if (cached?.userId === userId) return cached.institutionId;
  const { data, error } = await supabase
    .from('user_institutions')
    .select('institution_id')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error('Your account is not a member of any institution.');
  cached = { userId, institutionId: data.institution_id };
  return data.institution_id;
}

export interface InstitutionMembership { institutionId: string; role: string }

/**
 * The signed-in user's first institution membership, or null when none exists.
 * Platform roles never count: only a user_institutions row opens the live zone.
 */
export async function getInstitutionMembership(userId: string): Promise<InstitutionMembership | null> {
  const { data, error } = await supabase
    .from('user_institutions')
    .select('institution_id, role')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data ? { institutionId: data.institution_id, role: data.role } : null;
}
