# Roadmap

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
- [ ] Flagged, not changed: hero speed claims "45-minute investigations, now in 3 minutes", "5 days — time to go live", "45% cheaper in year one".

## CTA wording + pilot FAQ
- [x] Hero, StickyComplianceBar, ExitIntentModal and BookDemoSheet use "Book a 30-minute walkthrough" with "Then run a 30-45 day pilot on your own data".
- [x] Pilot FAQ entry added (contents, who's involved, conversion to a paid plan) — pilot terms drafted by the agent, awaiting user confirmation.
- [ ] StickyComplianceBar and ExitIntentModal have no callers, so their new wording is not visible on the live page until they are mounted — awaiting user go-ahead.
- [ ] Header nav buttons still read "Book Demo" (desktop + mobile) — awaiting user go-ahead.
