/** Live zone: AI STR drafting needs the institution's consent (institution_settings). */
export const AI_DRAFTING_CONSENT_MESSAGE =
  "AI drafting is turned off for your institution. It needs your institution's consent: an institution administrator can turn it on in Settings.";

/** Thrown by the live provider when the server refuses because AI drafting is off. */
export class AiDraftingDisabledError extends Error {
  constructor() {
    super(AI_DRAFTING_CONSENT_MESSAGE);
    this.name = 'AiDraftingDisabledError';
  }
}

export const AI_DRAFTING_MIN_JUSTIFICATION = 20;
