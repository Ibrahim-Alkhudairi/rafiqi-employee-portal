"use server";

import { findCompany } from "@/lib/companies";
import { cleanText, isPersonalEmail, isValidEmail, normalizeEmail } from "@/lib/normalize";
import { allow, clientIp } from "@/lib/rate-limit";
import { editToken, isValidEditToken } from "@/lib/edit-token";
import { store } from "@/lib/store";

export type SignupField = "fullName" | "email" | "company";

export type AutosaveInput = {
  fullName: string;
  email: string;
  company: string; // a key from src/lib/companies.ts
  website?: string; // honeypot
  /** The email this browser saved last, with the token the server gave it then. */
  previous?: { email: string; token: string };
};

export type AutosaveResult =
  | { ok: true; email: string; token: string }
  | { ok: false; fields: SignupField[]; message?: "rateLimited" | "failed" };

// Called by the sign-up form whenever a complete set of fields changes. Saving
// again with the same email updates that employee; with `previous`, a
// corrected email moves the earlier row instead of adding a second one.
export async function autosave(input: AutosaveInput): Promise<AutosaveResult> {
  const str = (v: unknown, max: number) => (typeof v === "string" ? v : "").slice(0, max);
  const fullName = cleanText(str(input?.fullName, 200));
  const email = str(input?.email, 256).trim();
  const company = findCompany(str(input?.company, 200));

  const fields: SignupField[] = [];
  if (fullName.length < 2) fields.push("fullName");
  if (!isValidEmail(email) || isPersonalEmail(email)) fields.push("email"); // company emails only
  if (!company) fields.push("company");
  if (fields.length) return { ok: false, fields };

  const normalizedEmail = normalizeEmail(email);
  // Bots fill the hidden "website" field; they are told it saved and nothing is.
  if (str(input.website, 200)) return { ok: true, email, token: editToken(normalizedEmail) };

  const limit = Number(process.env.SAVE_RATE_LIMIT ?? 120); // per IP per 10 minutes; offices share an IP
  if (!allow("save", await clientIp(), limit, 10 * 60 * 1000)) return { ok: false, fields: [], message: "rateLimited" };

  // Only the browser that saved an email may move its row to another email.
  const prev = input.previous;
  const previousNormalizedEmail =
    prev && typeof prev.email === "string" && typeof prev.token === "string" && isValidEditToken(normalizeEmail(prev.email), prev.token)
      ? normalizeEmail(prev.email)
      : undefined;

  try {
    await store.saveEmployee({ fullName, email, companyName: company!.name.en }, previousNormalizedEmail);
  } catch (error) {
    console.error("[autosave] could not save:", error instanceof Error ? error.message : error);
    return { ok: false, fields: [], message: "failed" };
  }
  return { ok: true, email, token: editToken(normalizedEmail) };
}
