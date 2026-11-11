// Provenance recorded on every AI-written STR draft (live zone).
export async function sha256Hex(text: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** Name plus a hash prefix of the prompt text, so any prompt edit changes the version. */
export async function promptVersion(name: string, systemPrompt: string): Promise<string> {
  return `${name}@${(await sha256Hex(systemPrompt)).slice(0, 12)}`;
}

/** Hash of exactly what the model received: system prompt and user input. */
export function inputHash(systemPrompt: string, input: string): Promise<string> {
  return sha256Hex(JSON.stringify({ system: systemPrompt, input }));
}

/** Model vendor from a gateway model id such as "google/gemini-3.8-flash". */
export function providerOf(model: string): string {
  const i = model.indexOf('/');
  return i > 0 ? model.slice(0, i) : 'unknown';
}

export const DRAFT_SELECT = 'id, alert_id, version, narrative, generated_by, provider, model, prompt_version, input_hash, created_by, author_name, created_at';
