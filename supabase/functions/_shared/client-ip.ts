/**
 * Client IP for rate limiting. The hosting edge (Cloudflare) sets
 * cf-connecting-ip itself and rejects requests that try to supply it, so a
 * visitor cannot spoof it. x-forwarded-for is deliberately ignored. When the
 * header is absent every such request shares one 'unknown' bucket.
 */
export function trustedClientIp(headers: Headers): string {
  const ip = headers.get('cf-connecting-ip')?.trim();
  return ip && ip.length <= 64 ? ip : 'unknown';
}
