# Live tenant authorization suite

`tenant_isolation_results.json` is the actual 26 October 2026 live database run, not mocked test output. Run saved-evidence regression assertions with:

```sh
python3 -m unittest discover -s tests/security -p 'test_*.py' -v
```

To repeat the live run, provision two temporary Auth accounts through the authenticated admin API (not direct edits to auth tables), then generate SQL:

```sh
python3 tests/security/generate_tenant_isolation.py USER_A_UUID USER_B_UUID /tmp/tenant-isolation.sql
```

Execute the generated SQL through the managed database write tool. The final `ISOLATION_RESULTS` exception is deliberate: it carries the results while rolling back every fixture and audit row. Each individual operation also rolls back independently. Do not remove the final exception or split setup into separately committed calls. Delete both Auth accounts afterwards through the admin API. No security policies or audit triggers should be disabled.

Coverage: 18 tables including institution roots, memberships, alert-linked drafts/exports, compliance records, audit records, webhook tables and support grants. Attempts cover both cross-tenant directions, anonymous access and same-tenant positive/negative controls. Audit UPDATE/DELETE/TRUNCATE covers anon, authenticated without membership, analyst, compliance_officer, institution_admin, platform_admin, service_role and postgres. Service role and postgres use actual database role privileges, without retrieving any service credential.

The initial live run's two plain TRUNCATE attempts were blocked by referencing foreign keys rather than the audit trigger. Both were repeated with the dependent tables listed, and the unconditional audit trigger then rejected TRUNCATE. All 458 attempts denied or allowed access as expected. Errors from constraints unrelated to authorization are not treated as authorization passes in the generator.

This suite does not test storage object access, browser sessions or deployed edge-function authorization. Expired support fixtures prevent accidental active support access. CTR fixtures never use filed status, avoiding external recalculation side effects.