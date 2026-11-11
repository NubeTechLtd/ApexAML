import { describe, expect, it } from 'vitest';
import { describeStrAttribution } from './strAttribution';
import type { StrDraft } from '@/data-layer/types';

const base = { alertId: 'a1', narrative: 'x' };
const ai = (id: string, version: number, model: string, createdAt: string): StrDraft => ({
  ...base, id, version, generatedBy: 'ai', provider: model.split('/')[0], model, createdAt, authorName: 'Ada Obi',
});
const edit = (id: string, version: number, authorName: string | null): StrDraft => ({
  ...base, id, version, generatedBy: 'analyst_edit', createdAt: '2026-11-11T12:00:00Z', authorName,
});

describe('describeStrAttribution', () => {
  it('names the AI model, date and editing analyst', () => {
    const drafts = [ai('d1', 1, 'google/gemini-3.8-flash', '2026-11-11T09:00:00Z'), edit('d2', 2, 'Ada Obi')];
    expect(describeStrAttribution(drafts, 'd2')?.text).toBe('Drafted by AI (google/gemini-3.8-flash, 11 Nov 2026), edited by Ada Obi');
  });

  it('omits the editor when the AI text is unedited', () => {
    const drafts = [ai('d1', 1, 'google/gemini-3.8-flash', '2026-11-11T09:00:00Z')];
    expect(describeStrAttribution(drafts, 'd1')?.text).toBe('Drafted by AI (google/gemini-3.8-flash, 11 Nov 2026)');
  });

  it('uses the latest AI version and lists every analyst who edited after the first AI draft', () => {
    const drafts = [
      ai('d1', 1, 'google/gemini-3.8-flash', '2026-11-10T09:00:00Z'),
      edit('d2', 2, 'Ada Obi'),
      ai('d3', 3, 'openai/gpt-6-astra', '2026-11-11T09:00:00Z'),
      edit('d4', 4, 'Musa Bello'),
    ];
    const r = describeStrAttribution(drafts, 'd4');
    expect(r?.text).toBe('Drafted by AI (openai/gpt-6-astra, 11 Nov 2026), edited by Ada Obi and Musa Bello');
    expect(r?.model).toBe('openai/gpt-6-astra');
  });

  it('ignores versions after the current one', () => {
    const drafts = [ai('d1', 1, 'google/gemini-3.8-flash', '2026-11-11T09:00:00Z'), edit('d2', 2, 'Ada Obi')];
    expect(describeStrAttribution(drafts, 'd1')?.text).toBe('Drafted by AI (google/gemini-3.8-flash, 11 Nov 2026)');
  });

  it('credits the analyst when no AI was used', () => {
    expect(describeStrAttribution([edit('d1', 1, 'Ada Obi')], 'd1')?.text).toBe('Written by Ada Obi');
  });

  it('says so when a legacy AI row has no model', () => {
    const drafts: StrDraft[] = [{ ...base, id: 'd1', version: 1, generatedBy: 'ai', model: null, createdAt: '2026-11-11T09:00:00Z' }];
    expect(describeStrAttribution(drafts, 'd1')?.text).toBe('Drafted by AI (model not recorded, 11 Nov 2026)');
  });
});

describe('STR export footer', () => {
  it('appends the attribution after the report as an XML comment', async () => {
    const { exportFooterXml } = await import('./generateGoAMLXml');
    expect(exportFooterXml('Drafted by AI (google/gemini-3.8-flash, 11 Nov 2026), edited by Ada Obi'))
      .toBe('\n<!-- Drafted by AI (google/gemini-3.8-flash, 11 Nov 2026), edited by Ada Obi -->');
  });
});
