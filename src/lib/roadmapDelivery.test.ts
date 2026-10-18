import { describe, it, expect } from 'vitest';
import { canDeliverRoadmap } from '../../supabase/functions/send-roadmap-email/validation';

const now = Date.parse('2026-10-18T22:22:00Z');
const lead = { email: 'visitor@example.com', created_at: new Date(now).toISOString(), roadmap_text: 'Requested roadmap '.repeat(20) };
describe('requested roadmap delivery safeguards', () => {
  it('allows a matching recipient only within the 30-minute lead window', () => {
    expect(canDeliverRoadmap(lead, lead.email, now + 30 * 60_000)).toBe(true);
    expect(canDeliverRoadmap(lead, lead.email, now + 30 * 60_000 + 1)).toBe(false);
  });
  it('rejects an unrelated recipient', () => {
    expect(canDeliverRoadmap(lead, 'other@example.com', now)).toBe(false);
  });
  it('requires at least 200 characters of stored roadmap content', () => {
    expect(canDeliverRoadmap({ ...lead, roadmap_text: 'x'.repeat(199) }, lead.email, now)).toBe(false);
    expect(canDeliverRoadmap({ ...lead, roadmap_text: 'x'.repeat(200) }, lead.email, now)).toBe(true);
  });
});
