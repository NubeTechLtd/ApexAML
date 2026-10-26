import json
import unittest
from pathlib import Path
from generate_tenant_isolation import generate

class TenantIsolationTest(unittest.TestCase):
    def test_live_cross_tenant_and_anonymous_attempts_all_denied(self):
        rows = json.loads(Path(__file__).with_name('tenant_isolation_results.json').read_text())
        denied = [r for r in rows if r[1].startswith(('cross_', 'anon_to_'))]
        self.assertEqual(len(denied), 18 * 2 * 2 * 4)
        self.assertTrue(all(r[3] == 'PASS' and r[4] == 0 for r in denied))
        for table in {r[0] for r in denied}:
            for target in ('A', 'B'):
                for actor in ('cross_', 'anon_to_'):
                    self.assertEqual({r[2] for r in denied if r[0] == table and r[1] == actor + target}, {'SELECT', 'INSERT', 'UPDATE', 'DELETE'})

    def test_live_audit_mutations_denied_for_all_eight_roles(self):
        rows = json.loads(Path(__file__).with_name('tenant_isolation_results.json').read_text())
        for role in ('anon', 'authenticated_no_membership', 'analyst', 'compliance_officer', 'institution_admin', 'platform_admin', 'service_role', 'postgres'):
            for op in ('UPDATE', 'DELETE'):
                matches = [r for r in rows if r[1] == 'role_' + role and r[2] == op]
                self.assertEqual(len(matches), 1)
                self.assertEqual(matches[0][3:5], ['PASS', 0])

    def test_generator_uses_roles_claims_and_forced_rollback(self):
        sql = generate('11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222222222')
        self.assertIn("RAISE EXCEPTION USING MESSAGE='ISOLATION_RESULTS:'", sql)
        self.assertIn("SET LOCAL ROLE service_role", sql)
        self.assertIn('request.jwt.claims', sql)
        self.assertNotIn('DISABLE TRIGGER', sql)
        self.assertNotIn('ALTER TABLE', sql)

if __name__ == '__main__':
    unittest.main()