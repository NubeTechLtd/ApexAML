import { sendPublicEvent } from '@/lib/publicSubmit';

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

/** Flat metadata only: the server accepts up to 20 string/number/boolean values. */
function flatMetadata(metadata?: Record<string, unknown>) {
  if (!metadata) return null;
  const out: Record<string, string | number | boolean | null> = {};
  for (const [k, v] of Object.entries(metadata).slice(0, 20)) {
    if (v === null || typeof v === 'boolean' || (typeof v === 'number' && Number.isFinite(v))) out[k.slice(0, 64)] = v;
    else if (v !== undefined) out[k.slice(0, 64)] = String(v).slice(0, 200);
  }
  return out;
}

export async function trackEvent(
  eventName: string,
  opts: { source?: string; metadata?: Record<string, unknown> } = {}
) {
  // Best-effort tracking through public-submit — never throws to UI.
  await sendPublicEvent('page_event', {
    event_name: eventName,
    session_id: getSessionId(),
    path: typeof window !== 'undefined' ? window.location.pathname : null,
    source: opts.source ?? null,
    metadata: flatMetadata(opts.metadata),
  });
}
