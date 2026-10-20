const MARKETING_PATHS = new Set(['/', '/pricing', '/security', '/roadmap', '/privacy', '/login']);

export function isMarketingPath(pathname: string): boolean {
  return MARKETING_PATHS.has(pathname.replace(/\/+$/, '') || '/');
}