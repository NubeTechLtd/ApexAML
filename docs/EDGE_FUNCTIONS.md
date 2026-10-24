# Platform role management

`grant-platform-role` accepts POST `{ email, action: "grant" | "revoke", justification }`. It verifies the session; the atomic database operation rechecks platform_admin and MFA, requires 20–2000 justification characters, and permits five calls per caller per fifteen minutes (including valid-session rejected requests handled by the database). Malformed JSON and unsupported fields are rejected before the operation. Only platform_admin can be changed; institution memberships are never written. Self-revocation and last-admin revocation are prohibited.

Role mutation, hash-chained audit_log entry, platform history and notifications commit together. Audit entries use a dedicated non-tenant platform-control institution without creating any memberships. Platform administrators read the platform history, not tenant audit data. Other platform admins receive individual in-app notices; no email is sent.

TODO: Add administrator email notices once a second admin exists and an approved sending route is in place; do not use Resend for this feature.