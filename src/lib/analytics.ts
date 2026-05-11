import { supabase } from '@/integrations/supabase/client';

const SESSION_KEY = 'apexaml_session_id';

function getSessionId(): string {
  try {
    let id = sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id = crypto.randomUUID();
      sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return 'anon';
  }
}

export async function trackEvent(
  eventName: string,
  opts: { source?: string; metadata?: Record<string, unknown> } = {}
) {
  try {
    await supabase.from('page_events').insert([
      {
        event_name: eventName,
        session_id: getSessionId(),
        path: typeof window !== 'undefined' ? window.location.pathname : null,
        source: opts.source ?? null,
        metadata: (opts.metadata ?? null) as never,
        user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
      },
    ]);
  } catch {
    // Best-effort tracking — never throw to UI.
  }
}
