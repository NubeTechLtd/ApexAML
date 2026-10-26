import { z } from 'npm:zod@3.25.76'

export const ORGANISATION_TYPES = ['PSP', 'MFB', 'IMTO', 'Bank', 'Other'] as const

export const ContactSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(255),
  organisation: z.string().trim().min(2).max(150),
  organisationType: z.enum(ORGANISATION_TYPES),
  role: z.string().trim().min(2).max(100),
  message: z.string().trim().min(10).max(2000),
  phone: z.string().trim().max(20).regex(/^\+?[0-9 ()-]{7,20}$/).optional().or(z.literal('')),
  website: z.string().max(200).optional(),
})

export type ContactInput = z.infer<typeof ContactSchema>

/** Limits: per sender (network fingerprint) 3 / 10 min, per email 3 / hour. */
export const RATE_LIMITS = { perFingerprint10Min: 3, perEmailHour: 3 }

export function isHoneypotTripped(input: { website?: string }) {
  return Boolean(input.website && input.website.trim().length > 0)
}

export function isRateLimited(counts: { fingerprint10Min: number; emailHour: number }) {
  return counts.fingerprint10Min >= RATE_LIMITS.perFingerprint10Min || counts.emailHour >= RATE_LIMITS.perEmailHour
}
