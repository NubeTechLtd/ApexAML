# Data model

Source of truth: the live database (Lovable Cloud Postgres, `public` schema) as read on 13 November 2026, plus the migrations in `drizzle/migrations/` (current series, 0000 to 0026) and `supabase/migrations/` (earlier, already applied). Generated TypeScript types are in `src/integrations/supabase/types.ts`.

Every `public` table has row level security (RLS) enabled. A table with RLS and no policy is closed to browsers (anon and authenticated) and is written and read only by edge functions using the service role, or by security-definer functions.

> Table grants: several tables still carry the platform's default broad grants to `anon`/`authenticated`. RLS is what blocks access on those tables. Removing the unused grants is a tidy-up item (see "Known gaps" in `CLAUDE.md`).

## Access helpers (schema `private`)

All are `SECURITY DEFINER`, `search_path = ''`, and evaluated against `auth.uid()`.

| Helper | True when |
|---|---|
| `is_institution_member(inst)` | The caller has any `user_institutions` row for `inst` |
| `has_institution_role(inst, role)` | The caller's membership in `inst` has exactly `role` |
| `tenant_role(inst, roles[])` | The caller's membership in `inst` has a role in `roles` |
| `tenant_read(inst)` | `tenant_role(inst, {analyst, compliance_officer, institution_admin})`, **or** the caller is platform_admin with an MFA (aal2) session and an active, unexpired, unrevoked `support_access_grants` row for `inst` (read-only support) |
| `has_any_institution()` | The caller has at least one membership |
| `is_platform_admin()` / `has_role(uid, 'platform_admin')` | The caller has a `user_roles` row with `platform_admin` |
| `path_institution(path)` | Returns the first path segment as a UUID (storage scoping) |

Institution roles (`user_institutions.role`): `analyst`, `compliance_officer`, `institution_admin`. Platform role (`user_roles.role`, enum `app_role`): `platform_admin`. Platform roles never satisfy tenant checks except through an explicit support grant, and support grants are read-only.

## Policy shorthand used below

- **member**: SELECT/INSERT/UPDATE allowed when `is_institution_member(institution_id)`; no DELETE.
- **tenant**: SELECT when `tenant_read(institution_id)`; INSERT/UPDATE when `tenant_role(institution_id, {analyst, compliance_officer, institution_admin})`; no DELETE.
- **service only**: RLS on, no policies.
- **platform admin read**: SELECT only for platform_admin; no browser writes.

## 1. Institutions and membership

| Table | Columns | RLS | Purpose |
|---|---|---|---|
| `institutions` | id, name, institution_type, cbn_licence_number, created_at | SELECT `tenant_read(id)`; no browser writes | Tenant root. One row per customer institution, plus a dedicated non-tenant platform-control row used only as the audit scope for platform events |
| `user_institutions` | user_id, institution_id, role, created_at | SELECT own rows, or all rows of an institution where caller is institution_admin; no browser writes | Membership and institution role. Gates `/app`. Provisioned by staff (no self-service UI) |
| `institution_profiles` | institution_id, legal_name, cbn_licence_number, goaml_entity_id, address, mlro_name, contact_email, contact_phone, version, updated_by, updated_at | SELECT member; writes only via `save_institution_profile` RPC (institution_admin) | Reporting-entity details for live STR/CTR XML |
| `institution_profile_versions` | id, institution_id, version, snapshot (jsonb), changed_by, created_at | SELECT member; written by the RPC | Immutable history; each export audit entry records the version it used |
| `institution_settings` | institution_id, ai_drafting_enabled, adverse_media_rescreen_enabled, risk_sweep_enabled (all default false), updated_by, updated_at | SELECT `tenant_read`; writes only via `set_ai_drafting_enabled` / `set_scheduled_job_enabled` RPCs (institution_admin, 20+ character reason, audited) | Per-institution consent switch for live AI drafting |

## 2. Live case data (tenant)

| Table | Columns | RLS | Purpose |
|---|---|---|---|
| `customers` | id, institution_id, full_name, bvn, nin, nuban, kyc_tier, risk_level, risk_score, account_status, bvn_verified, entity_type, created_at | tenant | Institution customers |
| `transactions` | id, institution_id, customer_id, tx_type, channel, amount_ngn, balance_after, counterparty, agent_location, occurred_at, created_at | tenant | Customer transactions used as case evidence and AI drafting input |
| `alerts` | id, institution_id, case_id, customer_id, rule_triggered, alert_type, risk_level, status, description, behavioral_red_flags (text[]), assigned_analyst_id, opened_at, closed_at, dismissal_reason | tenant | Cases shown in `/app/workspace`. No server job creates live alerts yet |
| `str_drafts` | id, alert_id, version, narrative, generated_by (`ai` or `analyst_edit`), created_by, author_name, provider, model, prompt_version, input_hash, created_at | SELECT via the alert's `tenant_read`; INSERT only `generated_by = 'analyst_edit'` with a tenant role on the alert's institution; UPDATE with tenant role. Trigger `str_drafts_guard` stamps the author and freezes provenance | Versioned STR narratives. Only the AI edge functions (service role) insert `ai` drafts with provider/model/prompt provenance |
| `str_exports` | id, alert_id, str_draft_id, filename, goaml_xml, exported_by, exported_at | SELECT via the alert's `tenant_read`; INSERT with tenant role | Every exported STR XML file (draft for institution review and upload) |

## 3. Compliance records (tenant, member policies)

All six have NOT NULL `institution_id`, **member** policies and a `fill_institution_id` trigger as a safety net (writers set it explicitly).

| Table | Columns | Purpose |
|---|---|---|
| `transaction_queue` | id, institution_id, transaction_id, account_number, amount, currency, channel, counterparty_account, counterparty_bank_code, transaction_datetime, narration, direction, status, raw_payload, created_at, updated_at | Transactions received from core banking via `ingest-transaction`. Queued only; no rules run on them yet |
| `ctr_queue` | id, institution_id, customer_id, customer_name, report_date, total_cash_ngn, transaction_count, transaction_ids (jsonb), status, reviewed_by, reviewed_at, ctr_reference, filed_at, goaml_xml, created_at, updated_at | Daily cash-threshold candidates from `generate-ctr-batch`. Trigger `ctr_queue_risk_recalc` requests a risk recalculation when status becomes `filed` (the institution's own record that it filed) |
| `customer_risk_scores` | id, institution_id, customer_id, risk_score, risk_level, kyc_tier, last_calculated_at, created_at, updated_at | Current risk score per customer |
| `risk_score_history` | id, institution_id, customer_id, previous_score, new_score, score_change, trigger_type, trigger_reference, calculated_by, factors (jsonb), created_at | Score movements written by `recalculate-risk-score` |
| `kyc_documents` | id, institution_id, customer_id, document_type, document_name, storage_path, file_size_bytes, uploaded_by, uploaded_at, kyc_tier_at_upload, is_current, expiry_date, verified, verified_by, verified_at, created_at, updated_at | Metadata for files in the `kyc-documents` bucket |
| `adverse_media_results` | id, institution_id, customer_id, customer_name, bvn, institution_name, search_date, results (jsonb), overall_risk_level, screened_by, next_review_date, created_at, updated_at | Output of `screen-adverse-media` |

## 4. Audit

| Table | Columns | RLS | Purpose |
|---|---|---|---|
| `audit_log` | id, institution_id, occurred_at, user_id, user_name, actor_id, actor_name, action, resource, case_id, justification, status, metadata (jsonb), ip_address, prev_hash, row_hash, chain_index, created_at | INSERT when `user_id = auth.uid()` and member; SELECT for compliance_officer or institution_admin. Triggers: `scope_audit_entry`, `zz_chain_audit_entry` (serialized per-institution SHA-256 chain), `reject_audit_update_delete` and `reject_audit_truncate` (block every role, including service role) | Append-only, hash-chained audit trail. `verify_audit_chain(institution_id)` checks content and links server-side. This is not external cryptographic sealing. Writers never request a returned row |

## 5. Core banking webhooks

| Table | Columns | RLS | Purpose |
|---|---|---|---|
| `institution_webhook_secrets` | id, institution_id, key_id, encrypted_secret (AES-256-GCM under `WEBHOOK_SECRETS_KEY`), active, created_at, deactivated_at | service only | Per-institution signing keys. The key alone determines the institution |
| `processed_webhook_events` | id, institution_id, key_id, event_id (unique per institution), transaction_queue_id, received_at | SELECT member | Idempotency record, written atomically with the queued transaction by `record_webhook_transaction` |
| `webhook_rejections` | id, received_at, endpoint, key_id, institution_id, event_id, reason, ip_address, user_agent | SELECT for institution_admin or compliance_officer of a known institution | Every rejected webhook call |

## 6. Platform staff and support access

| Table | Columns | RLS | Purpose |
|---|---|---|---|
| `user_roles` | id, user_id, role (`app_role`), created_at | SELECT own row, or all for platform_admin; writes only via `change_platform_role` | Platform roles (platform_admin only) |
| `support_access_grants` | id, user_id, institution_id, justification, created_at, expires_at, revoked_at | SELECT own rows; writes only via `start_support_access` / `end_support_access` (MFA, justification, audited) | Explicit, expiring, read-only staff access to one institution |
| `platform_role_changes` | id, audit_id, actor_id, actor_email, target_id, target_email, role, action, justification, created_at | SELECT platform_admin | History of platform role grants and revocations |
| `platform_role_notifications` | id, recipient_id, change_id, created_at, read_at | SELECT own rows if platform_admin; mark read via `mark_platform_notification_read` | In-app notices to other admins |
| `platform_role_call_limits` | user_id, window_start, calls | service only | Five calls per 15 minutes for `change_platform_role` |

## 7. Shared reference data

| Table | Columns | RLS | Purpose |
|---|---|---|---|
| `sanctions_entities` | id, source, entity_name, aliases, date_of_birth, nationality, entity_type, reason, list_date, last_updated, is_active, raw_data, source_ref, created_at, updated_at | SELECT if any membership or platform_admin | OFAC/UN/EU lists and NFIU uploads, refreshed daily. Fuzzy search via `screen_entity()` (pg_trgm) |
| `sanctions_meta` | id, list_name, last_refreshed_at, record_count, status, error_message, created_at, updated_at | same | Refresh status per list |
| `regulatory_jurisdictions` | id, jurisdiction_code, jurisdiction_name, regulator_name, fiu_name, base_currency, is_active, created_at, updated_at | SELECT any member; ALL for platform_admin | Jurisdiction reference |
| `regulatory_report_formats` | id, jurisdiction_code, report_type, format_standard, schema_version, submission_endpoint, test_endpoint, requires_digital_signature, max_file_size_mb, created_at, updated_at | same | Report format reference (not used to submit anything) |
| `regulatory_thresholds` | id, jurisdiction_code, threshold_type, amount_local_currency, amount_usd_equivalent, reporting_window_hours, review_date, cbn_circular_reference, notes, created_at, updated_at | same | Threshold reference |
| `kyc_verification_vectors` | id, jurisdiction_code, vector_name, vector_type, provider_name, api_endpoint, is_mandatory_tier_1, is_mandatory_tier_2, tier_2_upgrade_required, cost_per_check_usd, created_at, updated_at | ALL for platform_admin only | KYC provider configuration |

## 8. Public marketing and leads

No anonymous INSERT policies. All writes come from edge functions with the service role.

| Table | Columns | RLS | Purpose |
|---|---|---|---|
| `leads` | id, email, full_name, institution_name, institution_type, role, phone, message, compliance_timeline, current_setup, ndpr_consent, source, client_fingerprint, created_at | platform admin read | All lead forms (navbar, exit intent, final CTA, roadmap magnet, contact, demo entry, pilot request). `source` is set by the server |
| `roadmap_leads` | id, institution_name, institution_type, aml_setup, volume, contact_name, title, email, phone, source, roadmap_text, created_at | platform admin read | Roadmap generator submissions. Trigger bumps `roadmap_lead_counter` |
| `roadmap_lead_counter` | id, count, updated_at | service only | Public counter, read via `get_roadmap_lead_count()` |
| `demo_requests` | id, contact_name, institution_name, institution_type, role, email, whatsapp, focus_areas, preferred_date, slot_datetime, message, source, created_at | platform admin read | Walkthrough bookings |
| `demo_slots` | id, slot_datetime, status, booked_by_request_id, created_at, updated_at | service only | Booked slots. Public reads only taken times via `get_taken_demo_slots(start, end)` (31-day max range) |
| `landing_page_clicks` | id, source, event, page_path, referrer, created_at | platform admin read | Click tracking |
| `page_events` | id, event_name, session_id, path, source, metadata, user_agent, created_at | platform admin read | Page and funnel events |
| `rate_limits` | id, bucket, ip_hash, created_at | service only | Hashed-IP counters for `consume_rate_limit()` |

## 9. Demo zone (server side)

The demo zone's case data lives in the browser. These tables only hold sessions, quotas and limits.

| Table | Columns | RLS | Purpose |
|---|---|---|---|
| `demo_sessions` | id, email, created_at, emails_sent, notification_token_hash, email_confirmed_at, confirmation_code_hash, confirmation_expires_at, confirmation_attempts | service only | One row per `/demo` registration; session token and confirmation code stored only as hashes |
| `demo_confirmation_sends` | id, session_id, email, ip_hash, status, created_at | service only | Confirmation email reservations (1 per address per hour, 3 per IP per hour) |
| `demo_notification_events` | id, session_id, notification_type, status, created_at | service only | Demo email quotas and idempotency (10 per session, 30 per address per day) |
| `demo_ai_calls` | id, session_id, ip_hash, mode, created_at | service only | Demo AI calls (3 per session, 20 per IP per UTC day). No prompts or replies stored |
| `demo_ai_settings` | id (single row), live_ai_enabled (kill switch), daily_cap (150), alert_threshold_pct (80), last_alert_day, updated_at | service only | Global demo AI controls |

## 10. Email

| Table | Columns | RLS | Purpose |
|---|---|---|---|
| `email_send_log` | id, message_id, template_name, recipient_email, status, error_message, metadata, created_at | service role only | Append-only record of transactional sends |
| `email_send_state` | id, retry_after_until, batch_size, send_delay_ms, auth_email_ttl_minutes, transactional_email_ttl_minutes, updated_at | service role only | Settings from the retired queue; retained |
| `suppressed_emails` | id, email, reason, metadata, created_at | service role only | Bounces/complaints recorded by `handle-email-events` (the email provider enforces suppression at send time) |
| `email_unsubscribe_tokens` | id, token, email, created_at, used_at | service role only | One-click unsubscribe tokens |
| `email_events` | id, sequence_id, email, email_step, event_type, url, user_agent, ip, metadata, created_at | platform admin read; written only by `email-track` / `email-unsubscribe` | Opens, clicks, unsubscribes. Opens/clicks require HMAC-signed links |
| `email_sequences` | id, lead_id, contact_name, institution_name, institution_type, email, ref_number, deadline, tracking_token, email_1..5_sent_at, demo_booked, unsubscribed_at, bounced_at, last_error, created_at, updated_at | platform admin read | Paused sales follow-ups. Retained, no new enrolments |
| `whatsapp_sequences` | id, lead_id, contact_name, institution_name, institution_type, phone, email, ref_number, deadline, message_1..3_sent_at, demo_booked, last_error, created_at, updated_at | platform admin read | Removed SMS/WhatsApp follow-ups. Retained, unused |

## 11. Storage

| Bucket | Public | Policies | Purpose |
|---|---|---|---|
| `kyc-documents` | no | Authenticated SELECT/INSERT/UPDATE when the first path segment is an institution the caller belongs to; no DELETE | KYC files, path `<institution_id>/...` |
| `nfiu-list-uploads` | no | same | NFIU sanctions list uploads processed by `refresh-sanctions-database` |

## 12. Database functions (RPCs)

| Function | Caller | Purpose |
|---|---|---|
| `save_institution_profile(...)` | institution_admin | Upserts profile, writes a version snapshot and audit entry |
| `set_ai_drafting_enabled(inst, enabled, justification)` | institution_admin | Toggles AI drafting consent with a 20+ character reason, audited |
| `verify_audit_chain(institution_id)` | compliance_officer / institution_admin | Server-side chain verification |
| `start_support_access(inst, justification, confirmed)` / `end_support_access()` / `support_institutions()` | platform_admin with MFA | Audited, expiring read-only support grants |
| `change_platform_role(email, action, justification)` | platform_admin with MFA, via `grant-platform-role` | Atomic grant/revoke, audit, history and notices, rate limited |
| `mark_platform_notification_read(id)` | platform_admin | Marks own notice read |
| `record_webhook_transaction(inst, key_id, event_id, tx)` | `ingest-transaction` (service) | Atomic idempotent queue insert |
| `request_risk_recalculation(customer_id, trigger_type, trigger_reference)` | `ctr_queue` trigger | Calls `recalculate-risk-score` over HTTP with the stored server credential |
| `screen_entity(search_name, threshold)` | members | Fuzzy sanctions search |
| `consume_rate_limit(bucket, ip_hash, limit, window_seconds)` | public edge functions (service) | Hashed-IP rate limiting |
| `reserve_demo_ai_call(session, ip_hash, mode)` | `demo-str-narrative` (service) | Kill switch, global daily cap, per-session and per-IP limits |
| `reserve_demo_confirmation(session, ip_hash, code_hash)` / `confirm_demo_email(session, code_hash)` | demo functions (service) | Confirmation send limits and code check |
| `reserve_demo_notification(session, event_id, type)` | `send-demo-notification` (service) | Refuses unconfirmed sessions; per-session/address quotas |
| `get_taken_demo_slots(start, end)` / `get_roadmap_lead_count()` | anonymous | The only public reads |
| Trigger functions: `fill_institution_id`, `set_updated_at`, `scope_audit_entry`, `chain_audit_entry`, `reject_audit_mutation`, `str_drafts_guard`, `trg_ctr_risk_recalc`, `bump_roadmap_lead_counter` | database | See tables above |
