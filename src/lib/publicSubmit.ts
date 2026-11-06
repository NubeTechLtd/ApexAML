// Every public form and public tracker posts through the public-submit
// function. The server owns tables, columns, sources, limits and recipients;
// the browser only names the form and sends its fields.
import type { RefObject } from 'react';
import type { TurnstileInstance } from '@marsidev/react-turnstile';
import { FunctionsHttpError } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export type PublicFormId =
  | 'lead_navbar' | 'lead_exit_intent' | 'lead_final_cta' | 'lead_roadmap_magnet'
  | 'contact' | 'demo_entry' | 'roadmap_lead' | 'demo_request_post_roadmap' | 'demo_booking';
export type PublicTrackerId = 'landing_click' | 'page_event';

export interface PublicSubmitResult {
  ok: boolean;
  reason?: string;
  status?: number;
  body: Record<string, unknown>;
}

async function invoke(form: PublicFormId | PublicTrackerId, data: Record<string, unknown>, extra: Record<string, unknown>): Promise<PublicSubmitResult> {
  const { data: res, error } = await supabase.functions.invoke('public-submit', { body: { form, data, ...extra } });
  if (!error) {
    const body = (res ?? {}) as Record<string, unknown>;
    return { ok: body.ok === true, reason: body.reason as string | undefined, status: 200, body };
  }
  if (error instanceof FunctionsHttpError) {
    const response = error.context as Response;
    const body = ((await response.json().catch(() => ({}))) ?? {}) as Record<string, unknown>;
    return { ok: false, reason: (body.reason as string) ?? 'server_error', status: response.status, body };
  }
  return { ok: false, reason: 'network_error', body: {} };
}

/**
 * Submits a visitor form. Waits for the Turnstile token, sends the honeypot
 * value as "website", then resets the widget because tokens are single-use.
 */
export async function submitPublicForm(
  form: PublicFormId,
  data: Record<string, unknown>,
  opts: { turnstile: RefObject<TurnstileInstance | undefined>; website?: string },
): Promise<PublicSubmitResult> {
  let token: string | undefined;
  try {
    // Allows time for a click challenge, but fails a broken widget within 20 seconds.
    token = await opts.turnstile.current?.getResponsePromise(20_000);
  } catch {
    token = undefined;
  }
  if (!token) return { ok: false, reason: 'verification_unavailable', body: {} };
  try {
    return await invoke(form, data, { turnstileToken: token, website: opts.website || undefined });
  } finally {
    opts.turnstile.current?.reset();
  }
}

/** Click and page tracking: same endpoint, no Turnstile. Never throws. */
export async function sendPublicEvent(form: PublicTrackerId, data: Record<string, unknown>): Promise<PublicSubmitResult> {
  try {
    return await invoke(form, data, {});
  } catch {
    return { ok: false, reason: 'network_error', body: {} };
  }
}

/** Plain-language message for a failed submission. */
export function publicSubmitErrorMessage(result: Pick<PublicSubmitResult, 'reason'>): string {
  switch (result.reason) {
    case 'rate_limited':
      return 'Too many submissions from your network in the last hour. Please try again later.';
    case 'verification_failed':
    case 'verification_unavailable':
      return "We couldn't complete the security check. Please refresh the page and try again.";
    default:
      return 'Please try again.';
  }
}
