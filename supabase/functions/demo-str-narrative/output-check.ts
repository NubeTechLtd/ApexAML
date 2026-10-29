// Rejects model output that does not look like an STR narrative of the expected length.
const words = (t: string) => t.trim().split(/\s+/).filter(Boolean).length;
const FORBIDDEN = [
  /^\s*(#{1,6}\s|[-*•]\s|\d+[.)]\s)/m, // headings or lists
  /```/,
  /<\/?[a-z][^>]*>/i, // markup
  /\b(system prompt|my instructions|as an ai( language)? model|i am an ai|i can(?:'|no)t help with)\b/i,
  /https?:\/\//i,
];

export function isPlausibleNarrative(text: string, minWords = 100, maxWords = 320): boolean {
  if (typeof text !== 'string') return false;
  const t = text.trim();
  if (t.length < 400 || t.length > 3000) return false;
  const n = words(t);
  if (n < minWords || n > maxWords) return false;
  if (t.split(/\n\s*\n/).length > 2) return false;
  if (!/\bsubject\b/i.test(t)) return false;
  return !FORBIDDEN.some((re) => re.test(t));
}

export function isPlausibleConfirmation(text: string): boolean {
  if (typeof text !== 'string') return false;
  const t = text.trim();
  return t.length > 0 && t.length <= 400 && !t.includes('\n\n') && !/```|https?:\/\//i.test(t);
}

export const checkGenerate = (narrative: string) => isPlausibleNarrative(narrative);
// Refinements may shorten or lengthen the draft, so allow a wider band.
export const checkRefine = (narrative: string, confirmation: string) =>
  isPlausibleNarrative(narrative, 60, 400) && isPlausibleConfirmation(confirmation);
