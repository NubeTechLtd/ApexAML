// Pure validation and limits for pilot access requests (no Deno or npm imports, so tests can load it).

export const PILOT_SOURCE = 'pilot_request'
export const INSTITUTION_TYPES = ['PSP', 'MFB', 'IMTO', 'Bank', 'Other'] as const
export type InstitutionType = typeof INSTITUTION_TYPES[number]

export interface PilotRequestInput {
  name: string
  institutionName: string
  institutionType: InstitutionType
  role: string
  phone: string
  message: string
  website: string
}

/** Limits: per signed-in account 3 / hour, per network 3 / 10 min. */
export const PILOT_RATE_LIMITS = { perAccountHour: 3, perFingerprint10Min: 3 }

const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '')

/** Returns the cleaned request, or null when any field is out of bounds. The email always comes from the session, never the body. */
export function parsePilotRequest(body: unknown): PilotRequestInput | null {
  if (!body || typeof body !== 'object') return null
  const b = body as Record<string, unknown>
  const input: PilotRequestInput = {
    name: str(b.name), institutionName: str(b.institutionName),
    institutionType: str(b.institutionType) as InstitutionType, role: str(b.role),
    phone: str(b.phone), message: str(b.message), website: typeof b.website === 'string' ? b.website : '',
  }
  if (input.name.length < 2 || input.name.length > 100) return null
  if (input.institutionName.length < 2 || input.institutionName.length > 150) return null
  if (!INSTITUTION_TYPES.includes(input.institutionType)) return null
  if (input.role.length < 2 || input.role.length > 100) return null
  if (input.phone && !/^\+?[0-9 ()-]{7,20}$/.test(input.phone)) return null
  if (input.message.length > 2000) return null
  if (input.website.length > 200) return null
  return input
}

export function isPilotHoneypotTripped(input: { website?: string }) {
  return Boolean(input.website && input.website.trim().length > 0)
}

export function isPilotRateLimited(counts: { accountHour: number; fingerprint10Min: number }) {
  return counts.accountHour >= PILOT_RATE_LIMITS.perAccountHour || counts.fingerprint10Min >= PILOT_RATE_LIMITS.perFingerprint10Min
}
