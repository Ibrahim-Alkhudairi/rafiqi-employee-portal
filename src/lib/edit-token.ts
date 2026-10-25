import { createHmac, timingSafeEqual } from "node:crypto";

// Edit tokens: HMAC-SHA256 with SESSION_SECRET. The browser that saved a
// sign-up gets one, so it alone may later move that row to a corrected email.
// Nothing is stored server-side, so any instance can verify a token.

function secret(): string {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) throw new Error("SESSION_SECRET must be set to at least 32 characters.");
  return s;
}

const sign = (payload: string) => createHmac("sha256", secret()).update(payload).digest("base64url");

/**
 * Proof that this browser saved the sign-up for `normalizedEmail`, so it may
 * later move that row to a corrected email. Nobody else can forge it.
 */
export const editToken = (normalizedEmail: string) => sign(`edit:${normalizedEmail}`);

export function isValidEditToken(normalizedEmail: string, token: string): boolean {
  const expected = Buffer.from(editToken(normalizedEmail));
  const given = Buffer.from(token);
  return expected.length === given.length && timingSafeEqual(expected, given);
}
