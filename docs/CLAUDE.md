# Working on ApexAML (guide for AI coding agents and new engineers)

ApexAML is an AML compliance product for Nigerian financial institutions (CBN and NFIU context). The vendor is NubeTech Ltd, incorporated in England and Wales (company number 11844857), trading as ApexAML.

Read these first: `AGENTS.md` (binding project rules), `docs/ARCHITECTURE.md`, `docs/DATA_MODEL.md`, `docs/EDGE_FUNCTIONS.md`, `docs/ENV.md`.

## How to run

```bash
bun install
bun run dev        # Vite dev server on http://localhost:8080
bun run test       # Vitest (src/**/*.test.ts); live-database integration tests are skipped
bun run lint
bun run build
```

- Live integration tests: `RUN_ACCESS_INTEGRATION=1 bunx vitest run src/lib/accessControl.integration.test.ts` (also `auditChain`, `platformRoles`). They hit the real database. Use temporary accounts and rollback-only fixtures only.
- Edge function tests (Deno): `deno test supabase/functions/public-submit/forms_test.ts`, `supabase/functions/email-track/handler_test.ts`, `supabase/functions/demo-str-narrative/output-check_test.ts`.
- Tenant isolation evidence: `python3 -m unittest discover -s tests/security -p 'test_*.py' -v`. See `tests/security/README.md` to repeat the live run.
- After changing demo seed cases, regenerate the server copy with `bun scripts/generate-demo-seed-cases.ts`. `demoAiCases.test.ts` fails if they diverge.
- Edge functions deploy from `supabase/functions/`. Database changes are new migrations in `drizzle/migrations/` (next number after the highest existing one). Never edit an applied migration.

## Do not edit

- `src/integrations/supabase/client.ts`, `src/integrations/supabase/types.ts`, `previewAuthStorage.ts`, `.env`: generated.
- `supabase/config.toml` project settings. Only per-function `verify_jwt` blocks are ours.
- The `AIMockUI` function in `src/pages/LandingPage.tsx`: the owner asked that it never be modified or deleted.
- Managed schemas (`auth`, `storage`, `realtime`, `vault`, `supabase_functions`).

## Conventions

**Zones and data**
- Every route belongs to one zone (`src/lib/zones.ts`). Use `useZoneNavigate()` / `useZoneHref()` for operational links, never literal `/demo/...` or `/app/...`.
- Pages and components get data only through `src/data-layer` hooks. Do not import the backend client in a page or component unless it is on the allowlist in `demoIsolation.test.ts`. The demo provider must never touch the backend.
- New live features: add the method to `DataProvider` (`types.ts`), implement it in both providers, scope live queries by `institution_id`.
- Seed-backed UI renders only in `/demo`. `/app` shows institution data or an empty state.

**Database and security**
- Every tenant table: NOT NULL `institution_id`, RLS through `private.*` helpers, no DELETE policy, writers set `institution_id` explicitly.
- Every new table: enable RLS, add policies and explicit grants in the same migration.
- Platform roles (`user_roles`) never grant tenant access. Staff read tenant data only through audited, expiring, read-only support grants.
- High-stakes actions need a 20+ character justification, risk checkboxes and an `audit_log` entry. Never weaken audit triggers. Inserts into `audit_log` must not request a returned row.
- Public forms and trackers go through `public-submit` only. Never add anonymous INSERT policies.
- Rate limits key on `trustedClientIp()` (`cf-connecting-ip`), never `x-forwarded-for`.
- Secrets live in the backend secret store. Never log, return or hard-code them. See `ENV.md`.

**AI**
- Model calls go through the Lovable AI Gateway from edge functions only, never the browser.
- Live drafting requires `institution_settings.ai_drafting_enabled`, pseudonymises personal data in-request, and records provider, model, prompt version and input hash. Only edge functions insert `generated_by = 'ai'` drafts.
- Demo AI uses synthetic cases loaded server-side by case id. Its limits live in `demo_ai_settings` and `reserve_demo_ai_call`.

**Email**
- Transactional only, through `sendTemplateEmail()` and the template registry, with the shared `LegalFooter`. Sales follow-up sequences are paused; do not re-enable them without the owner.

**UI**
- Semantic design tokens only (`src/index.css`, `tailwind.config.ts`). No hard-coded colours.
- Marketing is always dark inside `MarketingZone`. App themes are independent.
- Prices come from `src/lib/pricing.ts`. Workload figures come from `src/lib/strEstimate.ts` and are labelled "Illustrative estimate based on assumptions you can change".

## Wording rules (all copy: marketing, demo, live, emails, PDFs, prompts, docs)

1. **The CBN circular is never called "draft".** Refer to CBN Circular BSD/DIR/PUB/LAB/019/002, issued 10 March 2026. Do not call it "proposed" or "2025". Do not state specific final compliance dates; say "phased implementation timelines set in the circular". The 10 June 2026 deadline has passed; do not use it for urgency.
2. **ApexAML prepares drafts and never claims to file reports.** The product prepares and exports goAML-format STR/CTR files; the institution's authorised person reviews them and uploads them through the goAML portal. Do not write "filed with NFIU", "submits to NFIU", "auto-file" or "ready for upload". Do not call exports "validated": they are not checked against the official NFIU schema yet. Live exports carry "Draft XML for review. Validate against the current NFIU schema before filing". In the demo, use "Exported for filing" or "Filed (simulated)". The display label for the escalation status is "Escalated to MLRO". The paid "NFIU Filing Support" item on pricing is a human service and stays as named.
3. **No claim of live monitoring until rules run on live transactions.** Today live transactions are only received and queued (`ingest-transaction` -> `transaction_queue`), and the daily CTR batch aggregates cash totals. No rule engine evaluates live transactions and no live alerts are generated. Do not write "real-time monitoring", "live transaction monitoring", "24/7 monitoring" or similar for the product. IMTO and other rule scenarios are "explorable in the demo; rules are configured during the pilot".

Also binding (from project memory):
- Public copy describes only what is built: no "fine-tuned", "generative AI", "examiner-ready", SHA-256 or "cryptographic sealing" claims. The audit trail is "append-only, hash-chained".
- Hosting is Lovable Cloud in AWS eu-west-1 (Ireland). Never claim Nigerian or Cape Town data residency.
- Never call the vendor Nigerian-incorporated. Every public footer carries the registration line.
- No invented testimonials, customer logos, press or performance numbers.
- Demo AI labels: live output "AI drafting on synthetic data" plus "Generated on synthetic data. Not for filing."; pre-written or fallback output "Sample output (pre-written for demo)". Marketing tour: "AI-assisted STR drafting, reviewed by your analyst".
- Primary CTA "Book a 30-minute walkthrough"; secondary "Then run a 30-45 day pilot on your own data".

## Known gaps (as of 13 November 2026)

**Live product scope**
- Only `/app/workspace` and `/app/settings` exist live. Dashboard, rules, sanctions, KYC/KYB, customers, reports, audit and accounts pages are demo-only.
- No rule engine on live data; no server process creates live alerts. See wording rule 3.
- Live provider returns empty lists for KYB, rules, settlement accounts and notifications.
- CSV import in the live empty state is a placeholder. Initial data is loaded by the pilot team.
- No UI to provision institutions or memberships, or to issue webhook keys. No webhook keys have been issued, so `ingest-transaction` has not processed a real institution's traffic.
- goAML XML is not validated against the official NFIU schema.

**Backend**
- `generate-ctr-batch-daily` returned 401 on its last run (vault `cron_secret` does not match `CRON_SECRET`).
- `submit-contact`, `start-demo-session` and `send-demo-confirmation` are superseded by `public-submit` but still deployed; removal awaits owner approval.
- `email-sequence-dispatch` (paused) and `whatsapp-followup` (disabled) are deployed but inactive, and their tables are retained.
- Several tables keep broad default grants that RLS blocks; revoking unused grants is a tidy-up.
- `RESEND_API_KEY` connector secret is unused.
- Two migration folders exist (`supabase/migrations` from earlier, `drizzle/migrations` current).

**Security and privacy**
- Pseudonymisation catches structured fields and patterns. Names that are not in the case records and appear without a title in free text can reach the model.
- Adverse media screening sends real customer names to the AI Gateway (the search needs them).
- End-to-end tests of platform role grants, support access and admin email notices need a second platform admin with MFA. Admin notices are in-app only.

**Verification and operations**
- A real human Turnstile submission has not been verified end to end; the widget's allowed hostnames must include every production domain.
- The registered postal address in the email legal footer is still missing.
- `README.md` is a placeholder; these docs are the reference.
