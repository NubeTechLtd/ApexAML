// Form registry for public-submit: which table each public form writes to, the
// exact columns a visitor may supply, the server-fixed columns, and whether a
// Turnstile check is required. Anything not listed here is rejected.
import { z } from 'npm:zod@3.25.76'

export const MAX_BODY_BYTES = 10 * 1024
/** Visitor forms (all share one bucket): 10 submissions per hashed IP per hour. */
export const RATE_LIMIT = { limit: 10, windowSeconds: 60 * 60 }
/** Click and page tracking: a separate, higher cap per tracker, so shared office or mobile networks are still counted. */
export const TRACKER_RATE_LIMIT = { limit: 300, windowSeconds: 60 * 60 }

export type PublicTable = 'leads' | 'roadmap_leads' | 'demo_requests' | 'landing_page_clicks' | 'page_events'

/** Every column public-submit may ever write, per table. Rows are checked against this list. */
export const TABLE_COLUMNS: Record<PublicTable, readonly string[]> = {
  leads: ['id', 'email', 'full_name', 'institution_name', 'institution_type', 'phone', 'compliance_timeline',
    'current_setup', 'ndpr_consent', 'role', 'message', 'source', 'client_fingerprint'],
  roadmap_leads: ['id', 'institution_name', 'institution_type', 'aml_setup', 'volume', 'contact_name', 'title',
    'email', 'phone', 'source'],
  demo_requests: ['id', 'contact_name', 'institution_name', 'institution_type', 'role', 'email', 'whatsapp',
    'focus_areas', 'slot_datetime', 'preferred_date', 'message', 'source'],
  landing_page_clicks: ['id', 'source', 'event', 'page_path', 'referrer'],
  page_events: ['id', 'event_name', 'session_id', 'path', 'source', 'metadata', 'user_agent'],
}

const ORGANISATION_TYPES = ['PSP', 'MFB', 'IMTO', 'Bank', 'Other'] as const

const email = z.string().trim().max(255).email().toLowerCase()
const text = (min: number, max: number) => z.string().trim().min(min).max(max)
/** Optional text: empty or missing becomes null. */
const optText = (max: number) => z.string().trim().max(max).optional().nullable().transform((v) => (v ? v : null))
const phone = z.string().trim().regex(/^\+?[0-9 ()-]{7,20}$/)
const optPhone = z.union([phone, z.literal('')]).optional().nullable().transform((v) => (v ? v : null))
const consent = z.literal(true)
const slug = z.string().trim().regex(/^[a-z0-9_:-]{1,64}$/)
const path = z.string().trim().max(300).regex(/^\//)
const optPath = path.optional().nullable().transform((v) => v ?? null)
const metadataValue = z.union([z.string().max(200), z.number().finite(), z.boolean(), z.null()])
const metadata = z.record(z.string().max(64), metadataValue)
  .refine((m) => Object.keys(m).length <= 20, 'too many metadata keys')
  .optional().nullable().transform((v) => v ?? null)

export interface FormSpec {
  table: PublicTable
  /** Turnstile is required for visitor forms, not for click/page tracking. */
  turnstile: boolean
  /** Rate-limit bucket: all visitor forms share one per IP; each tracker has its own. */
  bucket: string
  /** Per-IP limit applied to this spec's bucket. */
  rateLimit: { limit: number; windowSeconds: number }
  /** Strict schema: its keys are the only columns a visitor may supply. */
  schema: z.ZodTypeAny
  /** Columns the server always sets, never the visitor. */
  fixed: Record<string, string>
}

const FORMS_BUCKET = 'forms'

const leadForm = (shape: z.ZodRawShape, source: string): FormSpec => ({
  table: 'leads', turnstile: true, bucket: FORMS_BUCKET, rateLimit: RATE_LIMIT, schema: z.object(shape).strict(), fixed: { source },
})

export const FORMS = {
  lead_navbar: leadForm({ email }, 'navbar'),
  lead_exit_intent: leadForm({ email, ndpr_consent: consent }, 'exit_intent'),
  lead_final_cta: leadForm({
    email, full_name: text(2, 120), institution_name: text(2, 200), institution_type: text(1, 50),
    compliance_timeline: text(1, 50), current_setup: text(1, 80), phone: optPhone, ndpr_consent: consent,
  }, 'final_cta_2step'),
  lead_roadmap_magnet: leadForm({
    email, full_name: text(2, 120), institution_name: text(2, 200), phone: optPhone, ndpr_consent: consent,
  }, 'roadmap_magnet'),
  contact: leadForm({
    email, full_name: text(2, 100), institution_name: text(2, 150), institution_type: z.enum(ORGANISATION_TYPES),
    role: text(2, 100), message: text(10, 2000), phone: optPhone,
  }, 'contact_page'),
  demo_entry: leadForm({
    email, full_name: text(2, 100), institution_type: z.enum(ORGANISATION_TYPES), role: text(2, 100),
  }, 'demo_entry'),
  roadmap_lead: {
    table: 'roadmap_leads', turnstile: true, bucket: FORMS_BUCKET, rateLimit: RATE_LIMIT, fixed: { source: 'roadmap_generator' },
    schema: z.object({
      institution_name: text(2, 200), institution_type: text(1, 50), aml_setup: text(1, 100), volume: text(1, 100),
      contact_name: text(2, 120), title: text(1, 120), email, phone: optPhone,
    }).strict(),
  },
  demo_request_post_roadmap: {
    table: 'demo_requests', turnstile: true, bucket: FORMS_BUCKET, rateLimit: RATE_LIMIT, fixed: { source: 'post_roadmap' },
    schema: z.object({
      contact_name: text(1, 120), institution_name: text(1, 200),
      email: z.union([email, z.literal('')]).optional().nullable().transform((v) => (v ? v : null)),
      preferred_date: optText(40), message: optText(2000),
    }).strict(),
  },
  demo_booking: {
    table: 'demo_requests', turnstile: true, bucket: FORMS_BUCKET, rateLimit: RATE_LIMIT, fixed: { source: 'book_demo_sheet_v2' },
    schema: z.object({
      contact_name: text(2, 120), institution_name: text(2, 200), institution_type: text(1, 50), role: text(1, 80),
      email, whatsapp: optText(40), focus_areas: optText(800), slot_datetime: z.string().datetime({ offset: true }),
    }).strict(),
  },
  landing_click: {
    table: 'landing_page_clicks', turnstile: false, bucket: 'landing_click', rateLimit: TRACKER_RATE_LIMIT, fixed: {},
    schema: z.object({
      source: slug, event: slug, page_path: optPath,
      referrer: z.string().trim().max(500).url().optional().nullable().transform((v) => v ?? null),
    }).strict(),
  },
  page_event: {
    table: 'page_events', turnstile: false, bucket: 'page_event', rateLimit: TRACKER_RATE_LIMIT, fixed: {},
    schema: z.object({
      event_name: slug, session_id: optText(64), path: optPath,
      source: slug.optional().nullable().transform((v) => v ?? null), metadata,
    }).strict(),
  },
} satisfies Record<string, FormSpec>

export type FormId = keyof typeof FORMS

export function getForm(id: string): FormSpec | null {
  return Object.prototype.hasOwnProperty.call(FORMS, id) ? (FORMS as Record<string, FormSpec>)[id] : null
}

/** Columns a visitor may supply for a form (the strict schema's keys). */
export function visitorColumns(spec: FormSpec): string[] {
  return Object.keys((spec.schema as z.AnyZodObject).shape)
}

export const Envelope = z.object({
  form: z.string().max(64),
  data: z.record(z.unknown()),
  turnstileToken: z.string().max(2048).optional(),
  website: z.string().max(500).optional(),
}).strict()

export function isHoneypotTripped(website: string | undefined) {
  return Boolean(website && website.trim().length > 0)
}

export type BodyRead = { ok: true; text: string } | { ok: false; status: 413 | 400; reason: string }

/** Rejects bodies over the size limit, using both the declared length and the bytes actually read. */
export async function readLimitedBody(req: Request, max = MAX_BODY_BYTES): Promise<BodyRead> {
  const declared = Number(req.headers.get('content-length') ?? '0')
  if (Number.isFinite(declared) && declared > max) return { ok: false, status: 413, reason: 'payload_too_large' }
  if (!req.body) return { ok: false, status: 400, reason: 'invalid_payload' }
  const reader = req.body.getReader()
  const chunks: Uint8Array[] = []
  let size = 0
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    size += value.byteLength
    if (size > max) {
      await reader.cancel().catch(() => {})
      return { ok: false, status: 413, reason: 'payload_too_large' }
    }
    chunks.push(value)
  }
  const all = new Uint8Array(size)
  let offset = 0
  for (const c of chunks) { all.set(c, offset); offset += c.byteLength }
  return { ok: true, text: new TextDecoder().decode(all) }
}

/** Builds the insert row: visitor columns + server-fixed columns, checked against the table allowlist. */
export function buildRow(spec: FormSpec, data: Record<string, unknown>, server: Record<string, unknown>) {
  const row: Record<string, unknown> = { ...data, ...server, ...spec.fixed }
  const allowed = TABLE_COLUMNS[spec.table]
  for (const key of Object.keys(row)) {
    if (!allowed.includes(key)) throw new Error(`column not allowed: ${spec.table}.${key}`)
  }
  return row
}
