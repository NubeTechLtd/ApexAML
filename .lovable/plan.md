# CTR Automation System

Build automated Currency Transaction Report generation with backend cron job, review workflow, and CBN-compliant filing UI.

## Part 1 — Backend

### Database migration
Create `public.ctr_queue`:
- `id` uuid PK
- `customer_id` text (account number)
- `customer_name` text
- `report_date` date
- `total_cash_ngn` numeric
- `transaction_count` int
- `transaction_ids` jsonb (array)
- `status` text: `pending_review` | `approved` | `filed` | `rejected` (default `pending_review`)
- `reviewed_by` uuid nullable
- `reviewed_at` timestamptz nullable
- `ctr_reference` text nullable (unique, `CTR-YYYY-NNNNN`)
- `filed_at` timestamptz nullable
- `goaml_xml` text nullable
- `created_at`, `updated_at` timestamptz

GRANTs: `SELECT, UPDATE` to `authenticated`; `ALL` to `service_role`. RLS enabled. Policies: authenticated users can select all; only `admin` role can update (via `has_role`). Service role bypasses.

Add sequence `ctr_reference_seq` for reference numbering.

### Edge function `generate-ctr-batch`
- `verify_jwt = true`, but validates `X-Cron-Secret` header against `CRON_SECRET`.
- Queries `transaction_queue` where `transaction_datetime` is within current WAT day (UTC+1) and `channel IN ('CASH','CASH_DEPOSIT','CASH_WITHDRAWAL')` and `status != 'excluded'`.
- Groups by `account_number`, sums `amount`, keeps `transaction_id` list.
- If total > 5,000,000 NGN, upsert into `ctr_queue` (unique on `customer_id + report_date`).
- Returns summary JSON.

### pg_cron schedule
Insert-tool SQL scheduling `generate-ctr-batch` at `50 22 * * *` UTC (23:50 WAT) via `net.http_post` with `X-Cron-Secret`.

## Part 2 — UI

### `RegulatoryReports.tsx` CTR tab
Replace `<CTRTable />` with new `<CTRManagement />` component featuring:
- 4 KPI cards (pending today, filed this month, total value this month, 72h compliance rate)
- Amber banner when any pending row exceeds 48h since `created_at`
- Sub-tabs: `Pending Review` / `Filed CTRs`
- Live data via `supabase.from('ctr_queue')`

### New files
- `src/components/CTRManagement.tsx` — main container, KPIs, banner, sub-tabs
- `src/components/CTRPendingTable.tsx` — pending rows + Review sheet + Approve action
- `src/components/CTRFiledTable.tsx` — filed rows + download XML
- `src/components/CTRReviewSheet.tsx` — right-hand sheet with per-transaction breakdown
- `src/lib/generateCTRXml.ts` — CBN/NFIU-format CTR XML builder + reference number generator

### Approve & Generate flow
Client-side: fetch transactions, build XML via `generateCTRXml`, generate reference `CTR-YYYY-NNNNN` (based on max existing this year + 1), update row: `status='filed'`, `ctr_reference`, `filed_at=now()`, `goaml_xml`, `reviewed_by=auth.uid()`, `reviewed_at=now()`. Toast + refetch.

### Download XML
Reuses `downloadXmlFile` from `src/lib/generateGoAMLXml.ts`.

## Notes
- Customer name resolved from `transaction_queue.raw_payload` when available; fallback "Account {account_number}".
- Notification mock: existing `useNotifications` context is generated statically. Skip runtime notification wiring — cron function logs summary instead; UI banner + KPI drive officer attention. (Adding real notifications would require reworking the notifications provider, out of scope.)
- Existing `mockCTRs` static demo table is removed; replaced by live Supabase data.
