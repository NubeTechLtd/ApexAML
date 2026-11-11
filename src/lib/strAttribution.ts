import type { StrDraft } from '@/data-layer/types';

export interface StrAttribution {
  /** e.g. "Drafted by AI (google/gemini-3.8-flash, 11 Nov 2026), edited by Ada Obi" */
  text: string;
  aiDraftId: string | null;
  provider: string | null;
  model: string | null;
  promptVersion: string | null;
  inputHash: string | null;
  aiDraftedAt: string | null;
  editors: string[];
  draftVersion: number;
}

const DATE_FMT = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Africa/Lagos' });

function joinNames(names: string[]): string {
  if (names.length <= 1) return names[0] ?? '';
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}

/**
 * Who wrote the STR text up to and including `currentDraftId` (live drafts).
 * The AI part names the model and date of the latest AI version; editors are
 * the analysts who saved edits after the first AI version.
 */
export function describeStrAttribution(drafts: StrDraft[], currentDraftId: string | null): StrAttribution | null {
  if (!currentDraftId) return null;
  const current = drafts.find((d) => d.id === currentDraftId);
  if (!current) return null;
  const history = drafts
    .filter((d) => d.alertId === current.alertId && d.version <= current.version)
    .sort((a, b) => a.version - b.version);
  const ai = history.filter((d) => d.generatedBy === 'ai');
  const firstAi = ai[0] ?? null;
  const lastAi = ai[ai.length - 1] ?? null;
  const editors = [...new Set(
    history
      .filter((d) => d.generatedBy === 'analyst_edit' && (!firstAi || d.version > firstAi.version))
      .map((d) => d.authorName?.trim() || 'an analyst'),
  )];

  let text: string;
  if (lastAi) {
    text = `Drafted by AI (${lastAi.model ?? 'model not recorded'}, ${DATE_FMT.format(new Date(lastAi.createdAt))})`;
    if (editors.length) text += `, edited by ${joinNames(editors)}`;
  } else {
    text = `Written by ${joinNames(editors.length ? editors : ['an analyst'])}`;
  }
  return {
    text,
    aiDraftId: lastAi?.id ?? null,
    provider: lastAi?.provider ?? null,
    model: lastAi?.model ?? null,
    promptVersion: lastAi?.promptVersion ?? null,
    inputHash: lastAi?.inputHash ?? null,
    aiDraftedAt: lastAi?.createdAt ?? null,
    editors,
    draftVersion: current.version,
  };
}
