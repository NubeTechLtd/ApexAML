/**
 * Demo persistence: an in-memory cache mirrored to localStorage so sample
 * work (filed CTRs, uploaded documents, audit entries) survives a reload in
 * the visitor's own browser and never leaves it.
 */
const PREFIX = 'apexaml-demo:v1:';
const memory = new Map<string, unknown>();
const listeners = new Map<string, Set<() => void>>();

function storage(): Storage | null {
  try {
    return typeof window !== 'undefined' ? window.localStorage : null;
  } catch {
    return null;
  }
}

export function readCollection<T>(key: string, seed: () => T): T {
  if (memory.has(key)) return memory.get(key) as T;
  let value: T | undefined;
  const raw = storage()?.getItem(PREFIX + key);
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
    storage()?.setItem(PREFIX + key, JSON.stringify(value));
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

/** Clears every demo collection (used by tests and "reset sample data"). */
export function resetDemoStore() {
  const s = storage();
  for (const key of Array.from(memory.keys())) s?.removeItem(PREFIX + key);
  if (s) {
    for (let i = s.length - 1; i >= 0; i--) {
      const k = s.key(i);
      if (k?.startsWith(PREFIX)) s.removeItem(k);
    }
  }
  memory.clear();
}

export const demoId = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

export const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
