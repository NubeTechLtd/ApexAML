// Cloudflare Turnstile server-side verification. Fails closed on any error.
const SITEVERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'

export interface SiteverifyResult { success?: boolean; action?: string; 'error-codes'?: string[] }

/** A token passes only when Cloudflare says success and, if an action was set, it matches the form. */
export function isAcceptedVerification(result: SiteverifyResult, expectedAction: string) {
  if (result.success !== true) return false
  return !result.action || result.action === expectedAction
}

export async function verifyTurnstile(token: string, secret: string, ip: string, expectedAction: string): Promise<boolean> {
  const body = new FormData()
  body.append('secret', secret)
  body.append('response', token)
  if (ip !== 'unknown') body.append('remoteip', ip)
  try {
    const res = await fetch(SITEVERIFY_URL, { method: 'POST', body, signal: AbortSignal.timeout(8000) })
    if (!res.ok) { console.error('Turnstile siteverify HTTP error', res.status); return false }
    const result = (await res.json()) as SiteverifyResult
    if (!isAcceptedVerification(result, expectedAction)) {
      console.warn('Turnstile rejected', result['error-codes'] ?? [], result.action ?? '')
      return false
    }
    return true
  } catch (e) {
    console.error('Turnstile siteverify failed', e instanceof Error ? e.message : 'Unknown error')
    return false
  }
}
