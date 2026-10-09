# Roadmap

## Data residency / hosting claims
- [x] FAQSection answer replaced with the Supabase eu-west-1 (Ireland) wording + "Data residency options for regulated institutions are available on request."
- [x] Landing page JSON-LD FAQ copy aligned to the same wording (it is the machine-readable duplicate of the same answer).
- [ ] Hero chip still reads "AWS Cape Town data residency" (LandingPage.tsx).
- [ ] Competitor comparison row still claims "Data residency (NDPA 2023): AWS af-south-1".
- [ ] Privacy Policy section 4 still claims AWS Cape Town storage and "PII never crosses borders".
- [ ] public/llms.txt still claims "Hosted on AWS af-south-1 (Cape Town) with NDPA 2023 data-residency commitments".

## AI & audit-trail copy audit
- [ ] Rewrite every "Generative AI", "fine-tuned on Nigerian typologies" and "examiner-ready" claim to describe only what is built: "AI-assisted STR drafting grounded in the case's transaction and customer data, with analyst review and full edit history."
- [ ] Remove "fine-tuned" / "ApexAML-trained" — no fine-tuned model exists (drafts come from a general AI model via the AI gateway).
- [ ] Drop verified-unbuilt claims in the same sentences: "SHA-256 hashed", "cryptographically sealed/hashed", fake hash strings in SystemAudit and ProductTourModal, "one-click examiner pack as a sealed PDF bundle", "examiner-ready exports in two clicks".
- [ ] Flagged, not yet changed: InnovationStory "14 Nigerian typologies out of the box" with "CBN model validation documentation" (14 rules do exist in the product, the validation-documentation claim is unverified).

## CTA wording + pilot FAQ (new request)
- [ ] Primary CTA → "Book a 30-minute walkthrough" in hero, StickyComplianceBar, ExitIntentModal, BookDemoSheet.
- [ ] Secondary line → "Then run a 30-45 day pilot on your own data" alongside each primary CTA.
- [ ] New FAQ entry: what the pilot includes, who is involved, how conversion to a paid plan works.
- [ ] Note: StickyComplianceBar and ExitIntentModal currently have no callers, so changes there are not visible on the live page until they are re-mounted — report this to the user.
