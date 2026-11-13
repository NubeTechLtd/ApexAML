# Migrating the live product to its own repository

This guide covers how to move the live product (the `/app` zone, the live data provider and the institution backend) into a separate repository. **This repository keeps the marketing site, the internal staff pages and the `/demo` zone.**

Nothing here has been done yet. It describes the current boundaries and the order of work.

## 1. What moves and what stays

| Area | Moves to the new live repo | Stays here |
|---|---|---|
| Routes | `/app/*` (`AppLayout`, `/app/workspace`, `/app/settings`) | Marketing (`/`, `/pricing`, `/security`, `/roadmap`, `/privacy`, `/contact`, `/unsubscribe`), internal (`/login`, `/settings`, `/admin/*`), demo (`/demo/*`), legacy redirects |
| Gates | `ProtectedRoute`, `InstitutionGate`, `src/lib/institution.ts`, `src/lib/pilotRequest.ts` | `ProtectedRoute` is also needed here for `/admin/*` (copy it; do not share) |
| Data layer | `src/data-layer/types.ts`, `providers/live.ts`, `exportEntity.ts` (live branch), `hooks.ts` | `providers/demo.ts`, `demoStore.ts`, `seed/`, `demoAi.ts`, `demoNotifications.ts`, `demoEmailConfirmation.ts`, `demoDataset.ts`; a copy of `types.ts` |
| Pages and components | `AlertWorkspace`, `InstitutionProfileSettings`, `AiDraftingSettingCard`, `LiveWorkspaceEmptyState`, and every component they render | The same `AlertWorkspace` and operational pages are used by `/demo`. Keep them here and copy them into the new repo (see section 3) |
| Libraries | `generateGoAMLXml.ts`, `generateCTRXml.ts`, `reportingEntity.ts`, `strAttribution.ts`, `strDraftNarrative.ts`, `aiDrafting.ts`, `riskScore.ts`, `kycDocuments.ts` | Copies of the XML generators and helpers the demo uses; `pricing.ts`, `strEstimate.ts`, `publicSubmit.ts`, `turnstile.ts`, `whatsapp.ts`, `marketingRoutes.ts`, `zones.ts` |
| Edge functions | `generate-str-narrative`, `refine-str-narrative`, `screen-adverse-media`, `rescreen-adverse-media`, `recalculate-risk-score`, `ingest-transaction`, `generate-ctr-batch`, `refresh-sanctions-database`, `grant-platform-role` if platform staff move too; shared `ai-drafting.ts`, `pseudonymise.ts`, `str-provenance.ts`, `str-prompts.ts` (live part), `tenant-access.ts` | `public-submit`, `generate-roadmap`, `send-roadmap-email`, `submit-pilot-request`, `demo-str-narrative`, `send-demo-notification`, `confirm-demo-email`, `email-track`, `email-unsubscribe`, `handle-email-events`, `preview-transactional-email`, the superseded and inactive functions |
| Database | Tenant tables, audit, webhooks, institution profiles/settings, platform staff and support tables, reference data, storage buckets (sections 1 to 7 and 11 of `DATA_MODEL.md`) | Public lead, demo and email tables (sections 8 to 10) |
| Tests | `accessControl`, `auditChain`, `platformRoles` integration tests, `reportingEntity`, `strAttribution`, `strDraftNarrative`, `pseudonymise`, `webhookVerify`, `pilotRequest`, `tests/security/` | `demoIsolation`, `demoAi`, `demoNotifications`, `demoEmailConfirmation`, `seed/*`, `zones`, `marketingRoutes`, `pricing`, `strEstimate`, `roadmapDelivery` |

## 2. Decide the backend split first

Today one Lovable Cloud project serves every zone. Choose one option before moving code.

1. **Shared backend (simplest).** Both repos point at the same project. Move only frontend code. Edge functions and migrations then need a single owner repo, because two repos must not both deploy migrations to the same database. Recommended owner: the live repo, with the public tables' migrations kept there too.
2. **Separate backends (cleanest isolation).** Create a new backend for live data and copy the live schema (tables, private helpers, RLS policies, triggers, RPCs, storage buckets, cron jobs) into it. This repo keeps a smaller backend for leads, demo sessions and email. Institutions, users and memberships must then be recreated in the new project, because auth users do not transfer automatically.

Either way, the rules in `AGENTS.md` and `DATA_MODEL.md` must survive the move unchanged: tenant RLS through `private.*` helpers, platform roles separate from institution roles, append-only hash-chained audit log, per-institution webhook keys, and AI drafting off by default.

## 3. Shared components used by both zones

`AlertWorkspace` and many operational components render in both `/demo` (demo provider) and `/app` (live provider). They branch on `useZone()` and `provider.kind` for labels and features such as demo sample labels, "AI drafting on synthetic data" and the live consent message.

- In the new repo, copy these components and remove the demo branches. The zone is always `app`, and `providerForZone` always returns the live provider.
- In this repo, remove the live branches over time. `/app` routes should become a redirect or link to the new product's URL.
- Do not try to share them through a package at first. The demo wording and live wording intentionally differ, and both are subject to the wording rules in `CLAUDE.md`.

## 4. Email sending must be rebuilt

All email currently goes through **Lovable Emails**, which belongs to this Lovable project:

- Sender: `_shared/transactional-email-templates/send-email.ts` uses `sendLovableEmail` from `@lovable.dev/email-js`, authenticated with `LOVABLE_API_KEY`, sending from the delegated subdomain `notify.apexaml.com`.
- Suppression, retries, rate limits and the mandatory unsubscribe footer are enforced by Lovable. Bounces and complaints arrive at `handle-email-events`.

None of this works outside this Lovable project. If the live product needs email (for example administrator notices for platform role changes, or future alert-assignment emails), the new repo must:

1. Choose a new email provider and verify a sending domain or subdomain. Do not reuse `notify.apexaml.com` while this project still sends from it.
2. Re-implement `sendTemplateEmail()` against that provider, keeping the same template registry and the shared `LegalFooter`.
3. Rebuild suppression: a suppression table, a bounce/complaint webhook, and a check before every send.
4. Rebuild unsubscribe handling for anything that is not purely transactional.
5. Port only the templates the live product needs. The current templates are marketing, booking and demo emails, so they stay here.

The live product currently sends **no** email itself; platform role changes notify other admins in-app only. So email can be deferred until a live feature needs it.

## 5. Other platform dependencies to replace

| Dependency | Used by | Replacement needed |
|---|---|---|
| Lovable AI Gateway (`LOVABLE_API_KEY`) | Live STR drafting and refinement, adverse media screening | A gateway key or direct model provider in the new environment. Keep pseudonymisation, consent checks and provenance recording |
| Generated client `src/integrations/supabase/client.ts` and `types.ts` | Live provider, gates | Regenerate against the chosen backend |
| `supabase/config.toml` `verify_jwt` overrides | Public functions | Recreate for any public function that moves (none of the live functions are public) |
| pg_cron jobs and vault secrets (`cron_secret`, `email_queue_service_role_key`) | `generate-ctr-batch`, `refresh-sanctions-database`, `request_risk_recalculation` | Recreate jobs and vault entries in the backend that owns them, with the new function URLs |
| Cloudflare `cf-connecting-ip` | Rate limits in public functions | Only if public functions move; confirm the new host sets an unspoofable client IP header |

## 6. Suggested order

1. Freeze schema changes, then pick option 1 or 2 in section 2.
2. Create the new repo with the same stack (React 18, Vite 5, Tailwind 3, TypeScript 5).
3. Copy the live files from section 1, with `providerForZone` hard-wired to live, and the live tests.
4. Point it at the chosen backend and regenerate types. With option 2, apply the live schema and verify with the tenant isolation suite (`tests/security/`) before loading any data.
5. Move edge functions and cron jobs, and re-issue webhook keys if the backend changed.
6. Deploy the new app on its own domain, for example `app.apexaml.com`.
7. In this repo, replace `/app/*` with a redirect to the new domain, remove the live provider and its allowlist entries, and keep `demoIsolation.test.ts` passing.
8. Rebuild email in the new repo only when a live feature needs it (section 4).
