import { describe, expect, it } from 'vitest';
import { Pseudonymiser } from '../../supabase/functions/_shared/pseudonymise';

describe('Pseudonymiser (live STR drafting)', () => {
  it('replaces known customer fields with tokens before anything else', () => {
    const p = new Pseudonymiser();
    expect(p.register('CUST', 'Adebayo Okafor')).toBe('CUST_1');
    expect(p.register('BVN', '22123456789')).toBe('BVN_1');
    expect(p.register('NIN', '12345678901')).toBe('NIN_1');
    expect(p.register('NUBAN', '0123456789')).toBe('NUBAN_1');
    const out = p.protect('Name: Adebayo Okafor | BVN: 22123456789 | NIN: 12345678901 | NUBAN: 0123456789. Okafor sent funds.');
    expect(out).toBe('Name: CUST_1 | BVN: BVN_1 | NIN: NIN_1 | NUBAN: NUBAN_1. CUST_1_N2 sent funds.');
  });

  it('matches known names regardless of case', () => {
    const p = new Pseudonymiser();
    p.register('CUST', 'Adebayo Okafor');
    expect(p.protect('ADEBAYO OKAFOR opened the account')).toBe('CUST_1 opened the account');
  });

  it('sweeps free text for phones, emails, BVNs, NINs, NUBANs and titled names', () => {
    const p = new Pseudonymiser();
    const out = p.protect('Call +234 803 123 4567 or 08031234568, mail ada@example.com; BVN 22999999999, NIN 98765432109, acct 9876543210; met Mrs Ngozi Eze.');
    expect(out).toBe('Call PHONE_1 or PHONE_2, mail EMAIL_1; BVN BVN_1, NIN NIN_1, acct NUBAN_1; met Mrs NAME_1.');
  });

  it('leaves formatted amounts and dates alone', () => {
    const p = new Pseudonymiser();
    const text = '2026-11-11T09:00:00.000Z | Transfer ₦1,250,000 | balance after: ₦3,400,000';
    expect(p.protect(text)).toBe(text);
  });

  it('gives the same value the same token and restores every token', () => {
    const p = new Pseudonymiser();
    p.register('CUST', 'Adebayo Okafor');
    p.register('BVN', '22123456789');
    const sent = p.protect('Adebayo Okafor (BVN 22123456789) paid ada@example.com twice; ada@example.com replied.');
    expect(sent).toBe('CUST_1 (BVN BVN_1) paid EMAIL_1 twice; EMAIL_1 replied.');
    const reply = 'The subject, CUST_1, BVN BVN_1, paid EMAIL_1. CUST_1_N2 is under review.';
    expect(p.restore(reply)).toBe('The subject, Adebayo Okafor, BVN 22123456789, paid ada@example.com. Okafor is under review.');
  });

  it('keeps tokens it did not issue unchanged', () => {
    expect(new Pseudonymiser().restore('CUST_9 is unknown')).toBe('CUST_9 is unknown');
  });
});
