import { describe, expect, it } from 'vitest';
import { isMarketingPath } from './marketingRoutes';

describe('marketing theme boundary', () => {
  for (const path of ['/', '/pricing', '/security', '/roadmap', '/privacy', '/login', '/contact']) {
    it(`isolates ${path}`, () => expect(isMarketingPath(path)).toBe(true));
  }
  it('retains app theme control', () => {
    expect(isMarketingPath('/dashboard')).toBe(false);
    expect(isMarketingPath('/settings')).toBe(false);
    expect(isMarketingPath('/admin/roadmaps')).toBe(false);
  });
});