/**
 * The side-panel STR document wraps the narrative in fixed sections (profile, events, compliance).
 * Demo AI refinement only accepts and returns a plain narrative, so the drawer sends just that part
 * and splices the result back, leaving the surrounding document (and any manual edits) intact.
 */
const START = /^[ \t]*(?:Narrative|Summary):[ \t]*\n/m;
const END = /^[ \t]*The above activity deviates/m;
const INDENT = '   ';

function bounds(draft: string): { start: number; end: number } | null {
  const s = START.exec(draft);
  if (!s) return null;
  const start = s.index + s[0].length;
  const rest = draft.slice(start);
  const e = END.exec(rest);
  if (!e) return null;
  return { start, end: start + e.index };
}

/** Returns the narrative text inside the document, or null if the section markers were edited away. */
export function extractNarrative(draft: string): string | null {
  const b = bounds(draft);
  if (!b) return null;
  const text = draft
    .slice(b.start, b.end)
    .split('\n')
    .map((l) => (l.startsWith(INDENT) ? l.slice(INDENT.length) : l))
    .join('\n')
    .trim();
  return text || null;
}

/** Replaces the narrative section with new text; returns null if the section can't be found. */
export function replaceNarrative(draft: string, narrative: string): string | null {
  const b = bounds(draft);
  if (!b) return null;
  const body = narrative.trim().split('\n').map((l) => (l ? INDENT + l : l)).join('\n');
  return `${draft.slice(0, b.start)}${body}\n\n${draft.slice(b.end)}`;
}
