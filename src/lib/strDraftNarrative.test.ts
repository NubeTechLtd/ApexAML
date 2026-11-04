import { describe, expect, it } from 'vitest';
import { extractNarrative, replaceNarrative } from './strDraftNarrative';

const doc = `1. CUSTOMER PROFILE
   Full Name:        Test Subject

2. SUSPICIOUS ACTIVITY DESCRIPTION
   
   Narrative:
   The subject received many credits.
   Funds left within minutes.

   The above activity deviates from the customer's established transaction
   profile.

3. TRIGGERING EVENTS
   1. 01/01/2026 — Credit`;

describe('side-panel STR narrative splicing', () => {
  it('sends only the narrative section, without headings or the event list', () => {
    expect(extractNarrative(doc)).toBe('The subject received many credits.\nFunds left within minutes.');
  });
  it('replaces only the narrative and keeps the rest of the document unchanged', () => {
    const out = replaceNarrative(doc, 'The subject structured deposits.')!;
    expect(extractNarrative(out)).toBe('The subject structured deposits.');
    expect(out.replace('The subject structured deposits.', 'The subject received many credits.\n   Funds left within minutes.')).toBe(doc);
  });
  it('returns null when the narrative markers were edited away', () => {
    expect(extractNarrative('free text only')).toBeNull();
    expect(replaceNarrative('free text only', 'x')).toBeNull();
  });
});
