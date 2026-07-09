// Input validation for the scoring endpoint (Story 4.2).

export const MAX_INPUT_CHARS = 2000;

export type Validation =
  | { ok: true; text: string }
  | { ok: false; error: string; status: number };

/** Validate and bound the user's free-text input server-side. */
export function validateInput(raw: unknown): Validation {
  if (typeof raw !== "string" || raw.trim().length === 0) {
    return {
      ok: false,
      error: "Please enter your interests and the paths you're weighing.",
      status: 400,
    };
  }
  if (raw.length > MAX_INPUT_CHARS) {
    return {
      ok: false,
      error: `Please keep it under ${MAX_INPUT_CHARS} characters.`,
      status: 400,
    };
  }
  return { ok: true, text: raw };
}
