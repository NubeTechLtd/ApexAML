import { supabase } from '@/integrations/supabase/client';

export const PILOT_INSTITUTION_TYPES = ['PSP', 'MFB', 'IMTO', 'Bank', 'Other'] as const;

export interface PilotRequestForm {
  name: string;
  institutionName: string;
  institutionType: typeof PILOT_INSTITUTION_TYPES[number] | '';
  role: string;
  phone: string;
  message: string;
  website: string; // honeypot
}

export type PilotRequestResult = { ok: true } | { ok: false; reason: 'rate_limited' | 'unauthorized' | 'failed' };

/** Sends a pilot request through its validated server function; the server uses the signed-in account's email. */
export async function submitPilotRequest(form: PilotRequestForm): Promise<PilotRequestResult> {
  const { data, error } = await supabase.functions.invoke('submit-pilot-request', { body: form });
  if (!error && data?.ok) return { ok: true };
  const status = (error as { context?: Response } | null)?.context?.status;
  return { ok: false, reason: status === 429 ? 'rate_limited' : status === 401 ? 'unauthorized' : 'failed' };
}
