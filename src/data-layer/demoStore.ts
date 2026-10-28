/**
 * Demo persistence: an in-memory cache mirrored to localStorage under the
 * visitor's demo session, so sample work (filed CTRs, freezes, audit entries)
 * survives a reload in their own browser and never leaves it.
 */
const ROOT = 'apexaml-demo:v2:';
const SESSION_KEY = `${ROOT}session`;
const memory = new Map<string, unknown>();
const listeners = new Map<string, Set<() => void>>();
let session: string | null = null;

function storage(): Storage | null {
  try {
    return typeof window !== 'undefined' ? window.localStorage : null;
  } catch {
    return null;
  }
}

/** The current demo session id; created on first use. */
export function demoSessionId(): string {
  if (session) return session;
  const s = storage();
  session = s?.getItem(SESSION_KEY) ?? null;
  if (!session) {
    session = `ds-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    try { s?.setItem(SESSION_KEY, session); } catch { /* storage blocked */ }
  }
  return session;
}

const keyFor = (key: string) => `${ROOT}${demoSessionId()}:${key}`;

export function readCollection<T>(key: string, seed: () => T): T {
  if (memory.has(key)) return memory.get(key) as T;
  let value: T | undefined;
  const raw = storage()?.getItem(keyFor(key));
  if (raw) {
    try { value = JSON.parse(raw) as T; } catch { value = undefined; }
  }
  if (value === undefined) value = seed();
  memory.set(key, value);
  return value;
}

export function writeCollection<T>(key: string, value: T) {
  memory.set(key, value);
  try {
    storage()?.setItem(keyFor(key), JSON.stringify(value));
  } catch {
    // Storage full or blocked: keep the in-memory copy for this session.
  }
  listeners.get(key)?.forEach((fn) => fn());
}

export function onCollectionChange(key: string, fn: () => void): () => void {
  const set = listeners.get(key) ?? new Set();
  set.add(fn);
  listeners.set(key, set);
  return () => { set.delete(fn); };
}

/** Discards every demo collection and starts a fresh demo session. */
export function resetDemoStore() {
  const s = storage();
  if (s) {
    for (let i = s.length - 1; i >= 0; i--) {
      const k = s.key(i);
      if (k?.startsWith('apexaml-demo:')) s.removeItem(k);
    }
  }
  session = null;
  memory.clear();
  listeners.forEach((set) => set.forEach((fn) => fn()));
}

export const demoId = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

export const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Adopts the server-issued demo session id (from the demo entry form) for local demo state. */
export function setDemoSessionId(id: string) {
  session = id;
  memory.clear();
  try { storage()?.setItem(SESSION_KEY, id); } catch { /* storage blocked */ }
  listeners.forEach((set) => set.forEach((fn) => fn()));
}

// Kept outside the demo prefix so "Reset demo" does not send visitors back to the entry form.
const ENTRY_KEY = 'apexaml-demo-entry';
export function hasDemoEntry(): boolean {
  try { return Boolean(storage()?.getItem(ENTRY_KEY)); } catch { return false; }
}
export function markDemoEntry(id: string) {
  try { storage()?.setItem(ENTRY_KEY, id); } catch { /* storage blocked */ }
}
