# Edge functions

All functions live in `supabase/functions/<name>/index.ts` (Deno) and deploy automatically from this repo. Shared code is in `supabase/functions/_shared/`. `supabase/config.toml` sets `verify_jwt = false` for the public endpoints marked **public** below. Every other function runs with the platform's default JWT check, which the browser's publishable (anon) key satisfies, so each function also does its own authorisation.

`SUPABASE_URL`, `SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` are injected by the platform into every function and are not listed per row. See `ENV.md` for every secret.

## Summary

### Public forms, tracking and marketing

| Function | Trigger / caller | Schedule | Auth | Secrets |
|---|---|---|---|---|
| `public-submit` **public** | Every public form and tracker via `src/lib/publicSubmit.ts` (lead forms, contact, demo entry, roadmap lead, walkthrough booking, post-roadmap demo request, landing clicks, page events) | on request | Per-form allowlist (`forms.ts`), "website" honeypot, 10 KB cap, 10 requests per hashed IP per hour (`consume_rate_limit`), Turnstile for forms only | `TURNSTILE_SECRET_KEY`, `IP_HASH_SECRET`, `LOVABLE_API_KEY` (internal alerts, booking/demo emails) |
| `generate-roadmap` | `RoadmapGenerator.tsx` after the roadmap lead is saved | on request | Lead must be fresh, match the email, and not already have a roadmap | `LOVABLE_API_KEY` (AI Gateway, `google/gemini-3.8-flash`, same model as STR drafting) |
| `send-roadmap-email` | `RoadmapGenerator.tsx` (fire-and-forget) | on request | Sends only to the email on a fresh matching lead; idempotent per lead | `LOVABLE_API_KEY` |
| `submit-pilot-request` **public** | `InstitutionGate` "Request pilot access" form (`src/lib/pilotRequest.ts`) | on request | Verifies the session itself; uses the session's verified email; honeypot and rate limit | `LOVABLE_API_KEY` |
| `email-track` **public** | Links inside emails | on request | HMAC-signed links only; fails closed | `EMAIL_TRACKING_SECRET` |
| `email-unsubscribe` **public** | Unsubscribe links / `List-Unsubscribe-Post` | on request | Single-use token | none extra |
| `submit-contact` **public** | Superseded by `public-submit` (`contact`); not called by the app | n/a | Honeypot, rate limit | `LOVABLE_API_KEY` |
| `start-demo-session` **public** | Superseded by `public-submit` (`demo_entry`); not called by the app | n/a | Honeypot, rate limit | `LOVABLE_API_KEY` |
| `send-demo-confirmation` | Superseded by `public-submit` (`demo_booking`); not called by the app | n/a | Validation only | `LOVABLE_API_KEY` |

### Demo zone

| Function | Trigger / caller | Schedule | Auth | Secrets |
|---|---|---|---|---|
| `demo-str-narrative` | `/demo` workspace, side panel and refinement chat (`src/data-layer/demoAi.ts`) | on request | `x-demo-token` checked against the session's hashed token; case loaded server-side from a fixed allowlist; `reserve_demo_ai_call` limits | `LOVABLE_API_KEY` (`openai/chat-latest`) |
| `send-demo-notification` | `DemoNotificationDelivery` after a demo audit event | on request | `x-demo-token`; server picks template and recipient; refuses unconfirmed sessions | `LOVABLE_API_KEY` (via shared sender) |
| `confirm-demo-email` **public** | Demo confirmation card (`src/data-layer/demoEmailConfirmation.ts`) | on request | `x-demo-token`; status, verify code, or resend (limits in database) | `LOVABLE_API_KEY` |

### Live zone (institution data)

| Function | Trigger / caller | Schedule | Auth | Secrets |
|---|---|---|---|---|
| `generate-str-narrative` | Live provider `str.generate` (`/app/workspace`) | on request | Signed-in user with analyst, compliance_officer or institution_admin role on the alert's institution; `ai_drafting_enabled` must be on; data pseudonymised in-request | `LOVABLE_API_KEY` (`google/gemini-3.8-flash`) |
| `refine-str-narrative` | Live provider `str.refine` | on request | Same as above | `LOVABLE_API_KEY` (`openai/gpt-6-astra`) |
| `screen-adverse-media` | Live provider `adverseMedia.screen`; `rescreen-adverse-media` | on request | Tenant role via `_shared/tenant-access.ts`, or exact service credential for system calls | `LOVABLE_API_KEY` (`openai/gpt-5.6-sol`). Sends the real customer name (search needs it) |
| `recalculate-risk-score` | Live provider `riskScores.recalculate`; `ctr_queue` trigger via `request_risk_recalculation` | on request | compliance_officer or institution_admin, or exact service credential | none extra |
| `ingest-transaction` | Institution core banking system | on request | Per-institution signed webhook (details below) | `WEBHOOK_SECRETS_KEY` |
| `generate-ctr-batch` | Database cron job `generate-ctr-batch-daily` | `50 22 * * *` UTC (23:50 WAT) | `x-cron-secret` must equal `CRON_SECRET` | `CRON_SECRET` |
| `refresh-sanctions-database` | Database cron job `refresh-sanctions-daily` | `0 1 * * *` UTC | `x-cron-secret` | `CRON_SECRET` |
| `rescreen-adverse-media` | Managed schedule `adverse-media-rescreen-weekly` | `0 2 * * 1` UTC | Managed scheduler bearer (`_shared/cron-auth.ts`) or `x-cron-secret` = `CRON_SECRET`; anything else 401 | `LOVABLE_CRON_SECRET` (managed), `CRON_SECRET` |
| `risk-score-sweep` | Managed schedule `risk-score-sweep-nightly` | `0 3 * * *` UTC | Same as above | same |

### Platform staff

| Function | Trigger / caller | Schedule | Auth | Secrets |
|---|---|---|---|---|
| `grant-platform-role` | `PlatformRoleChanges` on `/admin/analytics` | on request | Caller's session; `change_platform_role` rechecks platform_admin, MFA, justification and rate limit | none extra |

### Email platform

| Function | Trigger / caller | Schedule | Auth | Secrets |
|---|---|---|---|---|
| `handle-email-events` | Lovable Emails delivery webhook (bounces, complaints, unsubscribes) | on event | Verified by the `@lovable.dev/email-js` webhook handler | `LOVABLE_API_KEY` |
| `preview-transactional-email` **public** | Lovable platform template previews | on request | Bearer must equal `LOVABLE_API_KEY` | `LOVABLE_API_KEY` |

### Retained but inactive

| Function | State |
|---|---|
| `email-sequence-dispatch` | Paused by the owner; returns 410. Archived follow-ups are in `docs/archived-followups.md` |
| `whatsapp-followup` | Disabled; rejects every request. `whatsapp_sequences` is kept but unused |

## Scheduled jobs (pg_cron)

| Job | Schedule (UTC) | Calls | Headers |
|---|---|---|---|
| `generate-ctr-batch-daily` | `50 22 * * *` | `generate-ctr-batch` | `x-cron-secret` from vault `cron_secret`; bearer from vault `email_queue_service_role_key` |
| `refresh-sanctions-daily` | `0 1 * * *` | `refresh-sanctions-database` | same |

| `adverse-media-rescreen-weekly` (managed HTTP schedule) | `0 2 * * 1` | `rescreen-adverse-media` | Managed bearer secret |
| `risk-score-sweep-nightly` (managed HTTP schedule) | `0 3 * * *` | `risk-score-sweep` | Managed bearer secret |

The managed scheduler cannot send custom headers, so the two newer jobs accept its bearer secret; manual runs use `x-cron-secret`. Both jobs (`_shared/scheduled-jobs.ts`) process only live institutions: `institutions.is_sample_data = false`, not `platform_control`, with a `user_institutions` membership, and the job's `institution_settings` switch on (`adverse_media_rescreen_enabled` / `risk_sweep_enabled`, default off). With none, they exit before any external call. Every query filters by `institution_id`. The re-screen makes at most 200 screenings per run (one screening = one `screen-adverse-media` call) and logs when the cap is reached; both stop starting new work after 130 s. Each run writes one `SCHEDULED_JOB_RUN` audit entry per live institution with job, start/end, records processed, external calls and outcome (`success`, `partial`, `failed`, `skipped_setting_off`).

## Shared modules (`_shared/`)

| Module | Used for |
|---|---|
| `transactional-email-templates/` | Template registry, `sendTemplateEmail()` (Lovable Emails, server-only), `LegalFooter` |
| `client-ip.ts` | `trustedClientIp()` reads Cloudflare's `cf-connecting-ip`; `x-forwarded-for` is never used |
| `tenant-access.ts` | `authorizeCustomer()`: exact service credential for system calls, otherwise a tenant role on the customer's institution |
| `ai-drafting.ts`, `pseudonymise.ts`, `str-provenance.ts`, `str-prompts.ts` | Live AI consent check, in-request token replacement, provenance, prompts |
| `demo-seed-cases.data.ts`, `demo-seed-cases.ts`, `demo-seed-time.ts` | Server copy of synthetic demo cases (generated by `scripts/generate-demo-seed-cases.ts`, checked by `demoAiCases.test.ts`) |
| `demo-email-confirmation.ts`, `demo-notification-content.ts` | Demo confirmation codes and fixed fictional notification content |
| `email-tracking.ts` | HMAC signing and verification of tracking links |

## Email templates

Registered in `_shared/transactional-email-templates/registry.ts`: `demo-booking-confirmation`, `demo-booking-internal-alert`, `roadmap-delivery`, `roadmap-lead-internal-alert`, `contact-lead-internal-alert`, `pilot-request-internal-alert`, `demo-entry-internal-alert`, `demo-ai-capacity-alert`, `demo-email-confirmation`, and the demo notification templates in `demo-notifications.tsx`. Internal alerts go to a fixed recipient defined in the templates and in `public-submit/booking.ts`. Sender: `notify.apexaml.com`, shown as `apexaml.com`.

---

## Details
## grant-platform-role

`grant-platform-role` accepts POST `{ email, action: "grant" | "revoke", justification }`. It verifies the session; the atomic database operation rechecks platform_admin and MFA, requires 20–2000 justification characters, and permits five calls per caller per fifteen minutes (including valid-session rejected requests handled by the database). Malformed JSON and unsupported fields are rejected before the operation. Only platform_admin can be changed; institution memberships are never written. Self-revocation and last-admin revocation are prohibited.

Role mutation, hash-chained audit_log entry, platform history and notifications commit together. Audit entries use a dedicated non-tenant platform-control institution without creating any memberships. Platform administrators read the platform history, not tenant audit data. Other platform admins receive individual in-app notices; no email is sent.

TODO: Add administrator email notices once a second admin exists and an approved sending route is in place; do not use Resend for this feature.
## ingest-transaction

Headers: `x-institution-key` (key_id), `x-webhook-timestamp` (Unix seconds), `x-webhook-signature` (hex HMAC-SHA256 of `timestamp + "." + rawBody`, optional `sha256=` prefix).
- Rejects timestamps more than 5 minutes old (or ahead).
- Body must include a unique `event_id`; duplicates per institution return `{status:"duplicate"}` without re-queuing (processed_webhook_events unique constraint, atomic RPC `record_webhook_transaction`).
- Secrets live per institution in `institution_webhook_secrets` as AES-256-GCM ciphertext under `WEBHOOK_SECRETS_KEY`; institution_id always comes from the key, never the payload.
- Every rejection is written to `webhook_rejections` (reason, key, ip, user agent).
- TODO: admin screen to issue/rotate keys (use `encryptSecret` from `verify.ts`).

## demo-str-narrative

Drafts and refines STR narratives for fictional demo cases only (`/demo`).

- **Demo model:** `openai/chat-latest` for both drafting and refinement, called through the AI Gateway Responses API with `max_output_tokens` of **500** (drafts) and **400** (refinements).
- **Live models (unchanged):** `generate-str-narrative` uses `google/gemini-3.8-flash`; `refine-str-narrative` uses `openai/gpt-6-astra`.
- **Why they differ:** both live models always run a hidden reasoning step (about 350-480 tokens per call) that counts toward the output limit and cannot be turned off. Under the 500/400 caps that left no room for the narrative, so every demo call was cut off. `openai/chat-latest` does not reason, so the whole budget goes to the visible text.
- **Output check:** drafts must be a single paragraph of 150-220 words that mentions the subject; refinements must have a 60-400 word narrative and a short confirmation. A truncated, empty, malformed or out-of-range response is discarded and the demo shows the labelled sample text.
- **Limits:** enforced in `reserve_demo_ai_call` — kill switch and 150-call global UTC-day cap (`demo_ai_settings`), then 3 calls per session and 20 per client IP per UTC day. An email alert is sent once per UTC day when 80% of the cap is used.
- **Client IP:** `cf-connecting-ip`, which the hosting edge sets and refuses from visitors; `x-forwarded-for` is not used.
