import { describe, expect, it } from 'vitest';
import { getZone, toZonePath } from './zones';

describe('route zones', () => {
  it('classifies the four zones', () => {
    expect(getZone('/')).toBe('marketing');
    expect(getZone('/pricing')).toBe('marketing');
    expect(getZone('/settings')).toBe('internal');
    expect(getZone('/admin/roadmaps')).toBe('internal');
    expect(getZone('/demo/alerts')).toBe('demo');
    expect(getZone('/app/workspace')).toBe('app');
  });

  it('keeps operational links in the demo zone, with query', () => {
    expect(toZonePath('/alerts?status=Open', 'demo')).toBe('/demo/alerts?status=Open');
    expect(toZonePath('/customers/C-1', 'demo')).toBe('/demo/customers/C-1');
  });

  it('live zone only exposes the workspace', () => {
    expect(toZonePath('/workspace?risk=Critical', 'app')).toBe('/app/workspace?risk=Critical');
    expect(toZonePath('/dashboard', 'app')).toBeNull();
  });

  it('leaves non-operational links alone', () => {
    expect(toZonePath('/settings', 'demo')).toBe('/settings');
    expect(toZonePath('/roadmap', 'demo')).toBe('/roadmap');
  });
});
