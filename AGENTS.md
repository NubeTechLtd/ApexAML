# Project rules

- Keep platform authorization separate from tenant membership; tenant RLS uses institution roles and read-only expiring support grants, never platform role bypasses, so staff privileges cannot expose customer data.
- Activate and revoke support access only through authenticated security-definer RPCs that atomically write audit events; require MFA and a scoped justification to prevent silent support grants.

- Scope public-page dark variables to MarketingZone, and propagate its scope to portal content via React context; app theme preferences must remain independent.
- Use semantic muted-on-dark text utilities for low-opacity marketing copy; retain translucent surfaces and higher-opacity text separately.
- Keep dark primary foreground accents separate from filled primary button tokens, with shared scoped utility compatibility for existing and preserved UI; this prevents translucent foregrounds or button hover utilities from lowering contrast.
- Keep field borders and muted text in theme tokens, with scoped marketing overrides for legacy translucent field boundaries, placeholders and focus rings; this preserves glass surfaces and app-theme independence.
- Keep green-control foregrounds and roadmap-specific sidebar/warning roles in semantic tokens; scope roadmap sidebar overrides to its page so other app sidebars retain their own styling.

- Keep subscription amounts and implementation fees in `src/lib/pricing.ts`, and derive calculators and price displays from them so pricing changes stay consistent across the site.
- Register requested email templates in the shared transactional registry and invoke the shared queued sender from validated server paths; this keeps delivery, suppression and unsubscribe handling consistent.
- Use the shared LegalFooter in email templates; this keeps company and data-protection notices consistent.
- Explicitly pass the server credential when invoking the queued sender and compare it against the configured credential; this supports current server keys without trusting decoded JWT role claims.