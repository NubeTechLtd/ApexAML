# Platform role management

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
