# Architecture

ApexAML is a single React 18 + Vite + TypeScript single-page app (Tailwind, shadcn/ui, React Router) backed by Lovable Cloud (a managed Supabase project: Postgres, Auth, Storage, Edge Functions on Deno). There is no other server.

This document covers how the app is split into zones, how routing works, and how each page decides whether it talks to sample data or to the real database.

## 1. Zones

Every URL belongs to exactly one zone. The zone is computed from the pathname by `getZone()` in `src/lib/zones.ts`, and read in components with `useZone()` (`src/hooks/useZone.ts`).

| Zone | Paths | Who can open it | Data source |
|---|---|---|---|
| `marketing` | `/`, `/pricing`, `/security`, `/roadmap`, `/privacy`, `/unsubscribe`, `/contact` (and anything not matched below) | Everyone | Demo provider for any operational widget; public forms go through `public-submit` |
| `internal` | `/login`, `/settings`, `/admin/*` | `/login` public; `/settings` any signed-in user; `/admin/*` platform_admin with MFA | Live provider + a few direct backend calls (allowlisted) |
| `demo` | `/demo`, `/demo/*` | Everyone | Demo provider only (in-memory + localStorage) |
| `app` | `/app`, `/app/*` | Signed-in user **with** a `user_institutions` membership | Live provider only |

Rules that hold across zones:

- Demo and marketing never read or write institution data. The demo provider has no import of the backend client, which `src/data-layer/demoIsolation.test.ts` enforces.
- The live zone never renders seed data. Seed-backed UI (sample analysts, sample notifications) only appears under `/demo`.
- Platform roles never grant tenant access. A platform_admin without a membership is treated like any other non-member in `/app`.
- Marketing pages are always dark, scoped by `MarketingZone`; app theme preferences are independent.

## 2. Routing

All routes are declared in `src/App.tsx`. Layout components live in `src/components/layouts/ZoneLayouts.tsx`.

```text
App
 ├─ MarketingLayout        /, /pricing, /security, /roadmap, /privacy, /unsubscribe, /contact
 │    redirects: /contact-us, /contact.html, /book  -> /contact
 ├─ (internal)             /login
 │                         /settings          ProtectedRoute requireAdmin={false}
 │                         /admin/roadmaps    ProtectedRoute (platform_admin + MFA)
 │                         /admin/analytics   ProtectedRoute (platform_admin + MFA)
 ├─ DemoLayout  /demo      index = DemoEntry (registration)
 │                         dashboard, inbox, alerts, workspace, rules, reports/cbn, reports/nfiu,
 │                         identity, kyb/corporate, customers, customers/:id, audit, sanctions,
 │                         accounts, partner-bank, case/:caseId
 │                         *  -> /demo/dashboard
 ├─ AppLayout   /app       ProtectedRoute + InstitutionGate
 │                         index -> /app/workspace
 │                         workspace  (AlertWorkspace, live provider)
 │                         settings   (InstitutionProfileSettings: profile + AI drafting switch)
 │                         *  -> /app/workspace
 ├─ Legacy redirects       /dashboard, /alerts, /workspace, ... (OPERATIONAL_BASES)  -> /demo/<same path>
 └─ *                      NotFound
```

### Operational pages and zone-aware links

`src/lib/zones.ts` defines:

- `OPERATIONAL_BASES`: zone-free page bases (`/dashboard`, `/alerts`, `/workspace`, `/rules`, `/reports/cbn`, `/reports/nfiu`, `/identity`, `/kyb/corporate`, `/customers`, `/audit`, `/sanctions`, `/accounts`, `/partner-bank`, `/case`).
- `LIVE_BASES`: the subset that exists in `/app`. Today this is only `/workspace`.
- `toZonePath(to, zone)`: rewrites `/alerts` to `/demo/alerts` in the demo zone, to `/app/workspace` only if the base is live, and returns `null` when the page does not exist in `/app`.
- A small alias table for stale links (`/kyc` -> `/identity`, `/regulatory-reports` -> `/reports/cbn`, `/system-audit` -> `/audit`).

Components never hard-code `/demo/...` or `/app/...`. They call `useZoneNavigate()` (drop-in for `useNavigate`, falls back to `APP_HOME` when a page is not live) or `useZoneHref()` (returns `null` so the caller can hide the link). This keeps a visitor inside the zone they started in.

`LegacyRedirect` sends old top-level operational URLs to their `/demo` equivalent, keeping params, query and hash.

### Access gates

- `ProtectedRoute` (`src/components/ProtectedRoute.tsx`): requires a session. With `requireAdmin` (the default) it also requires a `user_roles` row with `platform_admin` and an MFA (aal2) session, prompting for TOTP setup or challenge.
- `InstitutionGate` (`src/components/InstitutionGate.tsx`): requires a `user_institutions` membership via `getInstitutionMembership()` (`src/lib/institution.ts`). Non-members see "Your institution is not provisioned yet" and a pilot request form that posts to `submit-pilot-request`, which uses the session's verified email.
- Server-side, RLS and edge-function checks enforce the same boundaries independently of these UI gates. See `DATA_MODEL.md`.

## 3. Data layer and provider selection

All operational reads and writes go through `src/data-layer/`.

```text
page / component
   │  useAlerts(), useCustomers(), useDataProvider() ...   (src/data-layer/hooks.ts)
   ▼
providerForZone(useZone())                                  (src/data-layer/index.ts)
   ├─ 'demo' | 'marketing'  -> demoProvider   (providers/demo.ts)
   └─ 'app'  | 'internal'   -> liveProvider   (lazy Proxy over providers/live.ts)
```

- `DataProvider` (`src/data-layer/types.ts`) is the single typed contract: alerts, customers, transactions, str, ctr, transactionQueue, sanctions, adverseMedia, kycDocuments, riskScores, kyb, rules, settlementAccounts, notifications, audit, institutionProfile, institutionSettings, platform.
- The live provider is loaded with a dynamic `import()` the first time a live method is called, so demo code paths never load the backend module. `subscribe*` methods return an unsubscribe function synchronously.
- The live provider scopes queries to the current institution (`getCurrentInstitutionId()`), and RLS enforces it again on the server.
- Live namespaces not yet built return empty arrays: `kyb`, `rules`, `settlementAccounts`, `notifications`.

### Demo provider

- Seed: one coherent fictional Nigerian dataset in `src/data-layer/seed/` (customers, about 600 transactions, 25 alerts, KYB cases, pending CTRs, sanctions and adverse media, rules, accounts). BVN/NIN values are deliberately impossible.
- Persistence: `src/data-layer/demoStore.ts` keeps an in-memory cache mirrored to `localStorage` under `apexaml-demo:v2:<session>:<collection>`. "Reset demo" clears it.
- The demo session id is replaced by the server id returned from the `/demo` entry form (`public-submit` form `demo_entry`).
- Demo features that call the backend do so only through narrow, session-token-scoped endpoints, never through the shared client:
  - `demo-str-narrative`: live AI on synthetic cases, with the case loaded server-side from a fixed allowlist (`src/data-layer/demoAi.ts`).
  - `send-demo-notification`: demo event emails (`src/components/DemoNotificationDelivery.tsx`).
  - `confirm-demo-email`: six-digit address confirmation (`src/data-layer/demoEmailConfirmation.ts`).

### Direct backend access outside the data layer

Only these files may import `@/integrations/supabase/client` (allowlist in `demoIsolation.test.ts`):

- Lead capture and booking: `src/components/landing/*`, `LandingPage`, `Contact`, `DemoEntry`, `RoadmapGenerator`
- Auth and staff: `Login`, `Settings`, `Admin*` pages, `ProtectedRoute`, `SupportAccessPanel`, `PlatformRoleChanges`
- Library helpers used by those: `src/lib/publicSubmit.ts`, `src/lib/pilotRequest.ts`, `src/lib/institution.ts`, `src/lib/generateCTRXml.ts`, `src/hooks/useAuth.ts`, `src/hooks/useAdminAuth.tsx`, `src/hooks/useRoadmapCount.ts`

## 4. Public submissions

Every public form and public tracker posts through one edge function, `public-submit`, using `src/lib/publicSubmit.ts`. The browser sends a form id and fields; the server decides the table, columns, `source` value and alert recipient. Forms need a Turnstile token; click and page-event trackers do not. Public tables have no anonymous INSERT policies. See `EDGE_FUNCTIONS.md`.

## 5. Exports and AI drafting (live)

- STR/CTR XML: built in `src/lib/generateGoAMLXml.ts` and `src/lib/generateCTRXml.ts`. Reporting-entity fields come from `resolveExportEntity` (`src/data-layer/exportEntity.ts`): live reads the versioned institution profile and blocks on missing fields; demo uses fixed values labelled DEMO. Live exports carry the "Draft XML for review. Validate against the current NFIU schema before filing" label from a single constant, and write their audit entry before the file downloads.
- AI drafting: `generate-str-narrative` and `refine-str-narrative` run only when `institution_settings.ai_drafting_enabled` is on, pseudonymise personal data in-request, and are the only writers of `generated_by = 'ai'` drafts. Browsers save only `analyst_edit` drafts.

## 6. Backend layout

```text
supabase/functions/<name>/index.ts    Edge functions (Deno). Shared code in supabase/functions/_shared/
supabase/config.toml                  Per-function verify_jwt overrides (project settings are managed)
drizzle/migrations/0000..00NN_*.sql   Current migration series (drizzle-kit, see drizzle.config.ts)
supabase/migrations/2026*.sql         Earlier timestamped migrations, already applied
src/integrations/supabase/            Generated client and types (do not edit)
```
