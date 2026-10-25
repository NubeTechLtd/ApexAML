import { describe, expect, it } from 'vitest';
import { decryptSecret, encryptSecret, signWebhook, signatureValid, timestampFresh } from '../../supabase/functions/ingest-transaction/verify';

const now = 1_800_000_000_000;
const ts = String(now / 1000);

describe('ingest-transaction verification', () => {
  it('rejects timestamps older than 5 minutes', () => {
    expect(timestampFresh(String(now / 1000 - 301), now)).toBe(false);
    expect(timestampFresh(String(now / 1000 - 299), now)).toBe(true);
  });

  it('accepts a signature over timestamp.body', async () => {
    const sig = await signWebhook('s'.repeat(32), ts, '{"a":1}');
    expect(await signatureValid('s'.repeat(32), ts, '{"a":1}', `sha256=${sig}`)).toBe(true);
  });

  it('rejects a body-only signature or a different timestamp', async () => {
    const sig = await signWebhook('s'.repeat(32), ts, '{"a":1}');
    expect(await signatureValid('s'.repeat(32), String(now / 1000 + 1), '{"a":1}', sig)).toBe(false);
  });

  it('round-trips encrypted per-institution secrets', async () => {
    const master = btoa(String.fromCharCode(...new Uint8Array(32).fill(7)));
    expect(await decryptSecret(await encryptSecret('inst-secret', master), master)).toBe('inst-secret');
  });
});
