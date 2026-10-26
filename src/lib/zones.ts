export type Zone = 'marketing' | 'internal' | 'demo' | 'app';

/** Operational page bases that live under /demo/* (and partly under /app/*). */
export const OPERATIONAL_BASES = [
  '/dashboard', '/alerts', '/workspace', '/rules', '/reports/cbn', '/reports/nfiu',
  '/identity', '/kyb/corporate', '/customers', '/audit', '/sanctions', '/accounts',
  '/partner-bank', '/case',
] as const;

/** Operational pages available in the live, protected /app zone. */
export const LIVE_BASES = ['/workspace'] as const;

export const DEMO_HOME = '/demo/dashboard';
export const APP_HOME = '/app/workspace';

// Stale links found in older components, mapped to their real page.
const ALIASES: Record<string, string> = {
  '/kyc': '/identity',
  '/regulatory-reports': '/reports/cbn',
  '/system-audit': '/audit',
};

const INTERNAL = ['/login', '/settings', '/admin'];

const matches = (path: string, base: string) => path === base || path.startsWith(`${base}/`);

export function getZone(pathname: string): Zone {
  if (matches(pathname, '/demo')) return 'demo';
  if (matches(pathname, '/app')) return 'app';
  if (INTERNAL.some((b) => matches(pathname, b))) return 'internal';
  return 'marketing';
}

function split(to: string): [string, string] {
  const i = to.search(/[?#]/);
  return i === -1 ? [to, ''] : [to.slice(0, i), to.slice(i)];
}

/** Zone-free operational path ("/alerts") for any input, or null if not operational. */
export function operationalBase(path: string): string | null {
  let p = path;
  for (const prefix of ['/demo', '/app']) if (matches(p, prefix)) p = p.slice(prefix.length) || '/';
  for (const [from, to] of Object.entries(ALIASES)) if (matches(p, from)) p = to + p.slice(from.length);
  return OPERATIONAL_BASES.some((b) => matches(p, b)) ? p : null;
}

/**
 * Rewrites an operational link so it stays inside `zone`.
 * Returns null when the page does not exist in that zone (e.g. most pages in /app).
 * Non-operational links (/roadmap, /settings, /admin/*) are returned unchanged.
 */
export function toZonePath(to: string, zone: Zone): string | null {
  const [path, rest] = split(to);
  const base = operationalBase(path);
  if (!base) return to;
  if (zone === 'app') return LIVE_BASES.some((b) => matches(base, b)) ? `/app${base}${rest}` : null;
  return `/demo${base}${rest}`;
}
