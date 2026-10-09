# Roadmap

## Data residency / hosting claims
- [x] FAQSection answer replaced with the Supabase eu-west-1 (Ireland) wording + "Data residency options for regulated institutions are available on request."
- [x] Landing page JSON-LD FAQ copy aligned to the same wording.
- [ ] Hero chip still reads "AWS Cape Town data residency" (LandingPage.tsx) — awaiting user go-ahead.
- [ ] Competitor comparison row still claims "Data residency (NDPA 2023): AWS af-south-1".
- [ ] Privacy Policy section 4 still claims AWS Cape Town storage and "PII never crosses borders".
- [ ] public/llms.txt still claims "Hosted on AWS af-south-1 (Cape Town) with NDPA 2023 data-residency commitments".

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
