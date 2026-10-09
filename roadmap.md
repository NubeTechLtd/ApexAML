# Roadmap

## Data residency / hosting claims
- [x] FAQSection answer replaced with the Supabase eu-west-1 (Ireland) wording + "Data residency options for regulated institutions are available on request."
- [x] Landing page JSON-LD FAQ copy aligned to the same wording (it is the machine-readable duplicate of the same answer).
- [ ] Hero chip still reads "AWS Cape Town data residency" (LandingPage.tsx).
- [ ] Competitor comparison row still claims "Data residency (NDPA 2023): AWS af-south-1".
- [ ] Privacy Policy section 4 still claims AWS Cape Town storage and "PII never crosses borders".
- [ ] public/llms.txt still claims "Hosted on AWS af-south-1 (Cape Town) with NDPA 2023 data-residency commitments".
- [ ] FAQSection SOC 2 answer still refers to "our AWS infrastructure compliance reports".

## AI & audit-trail copy audit (new request)
- [ ] Rewrite every "Generative AI", "fine-tuned on Nigerian typologies" and "examiner-ready" claim to describe only what is built: "AI-assisted STR drafting grounded in the case's transaction and customer data, with analyst review and full edit history."
- [ ] Remove "fine-tuned" everywhere — no fine-tuned model exists (drafts come from a general AI model via the AI gateway).
- [ ] Check adjacent claims in the sentences being rewritten (cryptographic sealing / SHA-256 hashing, "14 typologies out of the box", two-click exports) and describe only what is actually implemented.
