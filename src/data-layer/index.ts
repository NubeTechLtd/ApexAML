import type { Zone } from '@/lib/zones';
import type { DataProvider } from './types';
import { demoProvider } from './providers/demo';

export * from './types';
export { demoProvider } from './providers/demo';

let liveModule: Promise<DataProvider> | null = null;
const loadLive = () => (liveModule ??= import('./providers/live').then((m) => m.liveProvider));

/**
 * The live provider is loaded on first use, so code running in the demo
 * zone never reaches the backend module. Every method forwards to it;
 * `subscribe*` methods return an unsubscribe function synchronously.
 */
const liveProvider = new Proxy({} as DataProvider, {
  get(_target, ns: string) {
    if (ns === 'kind') return 'live';
    return new Proxy({}, {
      get(_inner, fn: string) {
        if (fn.startsWith('subscribe')) {
          return (...args: unknown[]) => {
            let off: (() => void) | null = null;
            let closed = false;
            void loadLive().then((p) => {
              if (closed) return;
              const area = (p as unknown as Record<string, Record<string, (...a: unknown[]) => () => void>>)[ns];
              off = area[fn](...args);
            });
            return () => { closed = true; off?.(); };
          };
        }
        return async (...args: unknown[]) => {
          const p = await loadLive();
          const area = (p as unknown as Record<string, Record<string, (...a: unknown[]) => unknown>>)[ns];
          return area[fn](...args);
        };
      },
    });
  },
});

/** Demo and marketing pages use sample data; the live workspace and internal pages use the backend. */
export function providerForZone(zone: Zone): DataProvider {
  return zone === 'app' || zone === 'internal' ? liveProvider : demoProvider;
}
