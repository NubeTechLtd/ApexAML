import { describe, expect, it } from 'vitest';
import {
  PILOT_SOURCE, isPilotHoneypotTripped, isPilotRateLimited, parsePilotRequest,
} from '../../supabase/functions/submit-pilot-request/validation';

const valid = { name: 'Ada Okafor', institutionName: 'Example MFB', institutionType: 'MFB', role: 'CCO', phone: '', message: '', website: '' };

describe('pilot access requests', () => {
  it('are saved to leads with source "pilot_request"', () => {
    expect(PILOT_SOURCE).toBe('pilot_request');
  });
  it('ignore any email in the body (the session email is used)', () => {
    const parsed = parsePilotRequest({ ...valid, email: 'someone-else@example.com' });
    expect(parsed).not.toBeNull();
    expect(parsed).not.toHaveProperty('email');
  });
  it('reject an unknown institution type', () => {
    expect(parsePilotRequest({ ...valid, institutionType: 'Casino' })).toBeNull();
  });
  it('reject a message over 2,000 characters', () => {
    expect(parsePilotRequest({ ...valid, message: 'x'.repeat(2001) })).toBeNull();
    expect(parsePilotRequest({ ...valid, message: 'x'.repeat(2000) })).not.toBeNull();
  });
  it('treat a filled honeypot as a bot', () => {
    expect(isPilotHoneypotTripped({ website: 'http://spam' })).toBe(true);
    expect(isPilotHoneypotTripped({ website: '' })).toBe(false);
  });
  it('limit each account to 3 requests per hour and each network to 3 per 10 minutes', () => {
    expect(isPilotRateLimited({ accountHour: 2, fingerprint10Min: 2 })).toBe(false);
    expect(isPilotRateLimited({ accountHour: 3, fingerprint10Min: 0 })).toBe(true);
    expect(isPilotRateLimited({ accountHour: 0, fingerprint10Min: 3 })).toBe(true);
  });
});
