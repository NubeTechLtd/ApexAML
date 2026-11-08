# Roadmap

## Honest early-stage marketing
- [x] Listed all five attributed public testimonials before removing them; no named identity/sanctions vendor verified live. Existing first-party sanctions screening distinguished from designed vendor integrations.
- [x] Removed all five testimonials, initials/ratings and unverified press strip; replaced social proof with factual CBN/UK/integration content and /contact pilot CTA. Removed unsupported speed claims in landing, pricing, comparisons, roadmap, product tour and case hint.
- [x] Shared editable illustrative STR assumptions across both calculators and InnovationStory (60 manual minutes, 45 assisted minutes including review, 20 STRs/month); removed assumed fine avoidance and payroll-savings promises. Thirteen tests passed; browser verified shared edits, calculation readback, tour wording and pilot link with no runtime errors; build OK. AIMockUI untouched.

## Live tenant isolation suite
- [x] Created two temporary Auth users and rollback-only institutions A/B; 458 live attempts passed across all 18 directly/indirectly tenant-scoped tables, both cross-tenant directions, anon, own-tenant controls, and audit mutation roles including service_role and postgres. Three local regression checks passed. Fixtures rolled back, both accounts deleted, temporary provisioning endpoint removed; per-attempt CSV and Markdown delivered. Storage and HTTP/session flows are outside this database-only suite.

## Platform role changes
- [x] Rename the endpoint, require platform staff MFA and justification, atomically audit grants/revokes, and enforce five calls per fifteen minutes plus self/last-admin lockout protections. Retired live endpoint removed.
- [x] Notify other platform admins in-app and show platform role changes on admin analytics; email TODO recorded in docs/EDGE_FUNCTIONS.md. Non-tenant audit scope excluded from tenant fallback and support access.
- [x] Twenty-two authorization/structure tests passed; signed-in browser and deployed endpoint both reject missing MFA; build OK.
- [ ] Verify successful grants, revocations, history readback and notification delivery end-to-end — blocked by missing MFA setup and a second administrator account. No live roles changed during verification.
- [ ] Administrator email notices — intentionally pending until a second admin exists and an approved sending route is available; no Resend use.

## Audit-log hardening
- [x] Restrict audit writes and reads by institution membership and role, revoke mutations, and enforce unconditional UPDATE/DELETE/TRUNCATE blockers.
- [x] Serialize per-institution SHA-256 chains and expose officer-only verification with real verified/broken/unavailable states on the audit page. No pre-existing records required backfill.
- [x] Thirteen read-only authorization/structure tests passed; rollback-only database tests confirmed generated links and service-role UPDATE/DELETE rejection. Signed-in /audit insertion, readback, verification and cross-institution denial passed; one clearly labelled permanent verification-test entry remains.

## Platform and institution access separation
- [x] Restrict platform roles to platform_admin; enforce institution roles and remove staff tenant bypasses, including storage and tenant service-function paths.
- [x] Add explicit institution-scoped, audit-logged, thirty-minute read-only support access and update both admin pages.
- [x] Seed the requesting user's platform and institution roles; live workspace and five authorization regression tests passed. Support access without MFA is rejected by the server.
- [ ] Verify successful support activation and revocation through the UI — waiting for the user's two-factor setup; existing MFA gate preserved.

## Green controls, links and roadmap contrast
- [x] Applied requested hero/WhatsApp colours, opaque dark chat status, permanent FAQ/Privacy paragraph underlines, dark risk badge foregrounds and theme-specific roadmap label/warning tokens.
- [x] Browser checked in both stored themes; public roadmap retains dark colours, isolated light/dark token probes match requested values. Hero 5.42:1, WhatsApp/status 9.00:1, filled dark risk token pairs 4.57–4.61:1; FAQ underlines persist on hover/focus. Seven boundary tests pass; AIMockUI untouched; no forms submitted or emails sent.

## Field and muted-text contrast
- [x] Updated light/dark input borders and muted foregrounds, plus marketing form borders, placeholders and fixed-dark focus rings; verified booking, landing leads, roadmap fields and Login focus, plus exact theme tokens in both stored themes. Sample borders 3.06–3.08:1, placeholders 4.89:1, focus 5.35:1, muted text 4.56–5.04:1; seven theme-boundary tests passed. AIMockUI untouched; no forms submitted or emails sent.

## Dark primary contrast
- [x] Separate dark primary text from button colours; 547 rendered primary samples passed 4.5:1 in both stored themes, including hover, focus, selected booking slots and contact step. Ratio report delivered; unrelated WhatsApp contrast failures and unrendered confirmation/result states explicitly qualified.

## Marketing dark isolation
- [x] Isolate marketing dark tokens, including booking and other portals, from stored/system app themes.
- [x] Replace low-opacity marketing white text and placeholders with the requested opaque muted and hover tokens; preserve white/50 and above. AIMockUI source remains untouched, with its legacy text colour overridden within the marketing scope.
- [x] Verify all named marketing path scopes, booking qualification and scheduling screen, dropdowns, placeholders and footer hover colours in both stored themes; app theme preferences remain unchanged. Seven boundary tests pass. /pricing and /security still have no dedicated pages (existing not-found behaviour preserved).

## Transactional-only email
- [x] Archive and disable sales follow-ups; remove roadmap enrollment and follow-up promises; verified drip job absent and dispatcher returns 410.
- [x] Move requested roadmap delivery to Lovable Emails and add shared legal footers to email templates; mandatory unsubscribe handling retained.
- [x] Deploy and verify requested roadmap queued and sent, unrelated recipients rejected, trusted-only sender rejected public calls, and no enrollment (0 sequences); six regression tests pass. Browser reached roadmap display, but its requests did not reach the live database, so live delivery was verified separately through the deployed sender.
- [ ] Replace [ENTER address] in legal email footer — awaiting the registered postal address from the user.

## October copy corrections
- [x] Apply exact Ireland hosting and no Nigerian residency wording wherever hosting is described; align AI metadata and email labels.
- [x] Add verified active sub-processors to the existing privacy page. Termii excluded: no configured API key; dispatcher logs only. Delivery behavior unchanged.
- [x] Relabel follow-up and phone fields as SMS; preserve wa.me chat as "Chat on WhatsApp".
- [x] Align AI descriptions to case-data drafting with analyst review; browser checks, pricing tests and build passed; no styles changed.

## Pricing alignment
- [x] Align plan prices, both ROI calculators, FAQ, comparisons, roadmap offer and machine-readable pricing; tests and live-page pricing checks passed.

## Data residency / hosting claims
- [x] FAQ and landing page JSON-LD use exact Ireland hosting wording and explicitly state Nigerian residency is not offered.
- [x] Hero chip and competitor comparison corrected.
- [x] Privacy policy and public/llms.txt corrected.
- [x] Roadmap and social-proof Nigerian hosting badges corrected.

## AI & audit-trail copy audit
- [x] "Generative AI" / "fine-tuned" / "ApexAML-trained" / "examiner-ready" / "examiner-defensible" rewritten to describe only what is built.
- [x] Unbuilt audit claims removed: SHA-256 / cryptographic sealing wording, fabricated hash strings in SystemAudit and the product tour, "one-click sealed PDF examiner pack", "examiner-ready exports in two clicks", "cryptographic proof of compliance" in the engine timeline.
- [ ] Flagged, not changed: InnovationStory "14 Nigerian typologies out of the box ... with CBN model validation documentation" (14 rules do ship; the validation-documentation claim is unverified).
- [x] Removed hero speed claims "45-minute investigations, now in 3 minutes", "5 days — time to go live", "45% cheaper in year one" during the honest early-stage marketing correction.

## CTA wording + pilot FAQ
- [x] Hero, StickyComplianceBar, ExitIntentModal and BookDemoSheet use "Book a 30-minute walkthrough" with "Then run a 30-45 day pilot on your own data".
- [x] Pilot FAQ entry added (contents, who's involved, conversion to a paid plan) — pilot terms drafted by the agent, awaiting user confirmation.
- [ ] StickyComplianceBar and ExitIntentModal have no callers, so their new wording is not visible on the live page until they are mounted — awaiting user go-ahead.
- [ ] Header nav buttons still read "Book Demo" (desktop + mobile) — awaiting user go-ahead.

## Zone-selected data layer
- [x] Typed records and demo/live providers in src/data-layer; alerts, STR drafts/exports, CTRs, transaction queue, sanctions, adverse media, KYC documents, risk history, audit and platform roles routed by zone; guided tour now driven by the demo zone. Six isolation tests pass; demo pages browser-checked with zero backend requests.

## Unified demo seed dataset
- [x] One fictional bank (Harmattan Ridge MFB): 40 customers, 600+ transactions, 25 alerts, 6 KYB cases, 4 pending CTRs, sanctions/adverse-media hits, rules, settlement accounts — all ids linked; old mock files removed.
- [x] Session-persistent actions (freeze, escalate, dismiss, STR edit/export, rule toggle/delete, CTR file, sanctions decisions) add audit entries shown in /demo/audit; case files built from the same audit trail.
- [x] "Reset demo" control in the demo layout.
- [ ] ProductTourModal (marketing tour) still shows its own illustrative sample names — not part of the demo dataset.

## Demo event notifications
- [x] Seven sample-only templates, token-bound session delivery, atomic 10/session and 30/normalized-address/UTC-day reservations, NotificationBell and persistent demo inbox. Briefing runs once per UTC day while the demo is open, not as an unsolicited scheduled campaign.
- [x] Twenty automated checks pass; browser escalation and persisted inbox verified; rollback-only live quota/deduplication checks passed. One email dispatch and matching template HTML verified; test session removed. Managed suppression handling retained, but no address was unsubscribed during testing. Inbox mirrors submitted template HTML; the provider-added unsubscribe footer is not part of that HTML.

## Zone-specific STR wording
- [x] Matched case hints and tour wording to demo samples, marketing AI-assisted drafting, and unchanged live wording; browser verified all three. Demo uses pre-written seed narratives and deterministic local refinements, not model calls. Ten routing/isolation checks passed; delivered the remaining-reference inventory.

## Single public submission endpoint
- [x] Add public-submit (security check, "website" spam trap, 10/IP/hour hashed-IP limit, 10 KB cap, per-form table/column allowlist, service-role insert) and switch every public form plus click/page tracking to it; anon INSERT policies kept. Live checks: honeypot, unknown form/column, forged token, 413 and 429 verified; test rows removed.
- [ ] Real end-to-end form submission with a passing security check — needs the owner's Cloudflare widget hostnames to include the preview/published domains (sandbox localhost is refused with 110200).
- [ ] Remove anon INSERT policies and retire submit-contact, start-demo-session and send-demo-confirmation — waits on publishing and the owner's go-ahead.

## Signed email tracking
- [x] HMAC-sign open/click links with EMAIL_TRACKING_SECRET, reject missing/invalid signatures in email-track, and make email_events writable only by edge functions.
