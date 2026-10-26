const MARKETING_PATHS = new Set(['/', '/pricing', '/security', '/roadmap', '/privacy', '/login', '/contact', '/contact-us', '/contact.html', '/book']);

export function isMarketingPath(pathname: string): boolean {
  return MARKETING_PATHS.has(pathname.replace(/\/+$/, '') || '/');
}