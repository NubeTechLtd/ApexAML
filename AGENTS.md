# Project rules

- Keep subscription amounts and implementation fees in `src/lib/pricing.ts`, and derive calculators and price displays from them so pricing changes stay consistent across the site.
- Register requested email templates in the shared transactional registry and invoke the shared queued sender from validated server paths; this keeps delivery, suppression and unsubscribe handling consistent.
- Use the shared LegalFooter in email templates; this keeps company and data-protection notices consistent.
- Explicitly pass the server credential when invoking the queued sender and compare it against the configured credential; this supports current server keys without trusting decoded JWT role claims.