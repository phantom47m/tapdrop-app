import { customAlphabet } from "nanoid";

/**
 * Short-code alphabet — base32 minus visually-ambiguous characters
 * (no 0/O, 1/I/L, 8/B). 28 characters, ~5 bits each.
 *
 * 5 chars = 28^5 ≈ 17M combinations, plenty for v0.1.
 */
const ALPHABET = "23456789ACDEFGHJKMNPQRSTUVWXYZ";
const SHORT_CODE_LENGTH = 5;

const generateRaw = customAlphabet(ALPHABET, SHORT_CODE_LENGTH);

/** Returns a 5-char code prefixed with "T", e.g. "T9F4K". */
export function generateShortCode(): string {
  return "T" + generateRaw();
}

/** Normalize user input — uppercase, strip everything not in alphabet, limit length. */
export function normalizeShortCode(input: string): string {
  const stripped = input.toUpperCase().replace(/[^T2-9ACDEFGHJKMNPQRSTUVWXYZ]/g, "");
  return stripped.slice(0, SHORT_CODE_LENGTH + 1);
}
