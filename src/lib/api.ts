// Saves a sign-up through the Rafiqi backend (POST /api/portal/employee-signup),
// which checks it again and stores it in EmployeeTrackings. The portal itself is
// plain files with no server or database access.

export type SignupField = "fullName" | "email" | "company";

export type SignupInput = {
  fullName: string;
  email: string;
  company: string; // a company's slug, from src/lib/companies.ts
  website?: string; // honeypot
  /** The email this browser saved last, with the token the backend gave it then. */
  previous?: { email: string; token: string };
};

export type SignupResult =
  | { ok: true; email: string; token: string }
  | { ok: false; fields: SignupField[]; message?: "rateLimited" | "failed" };

// Set at build time. Empty (local runs) means demo mode: saving is pretended.
export const API_URL =(process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/+$/, "");

const FIELDS: SignupField[] = ["fullName", "email", "company"];

export async function saveSignup(input: SignupInput): Promise<SignupResult> {
  if (!API_URL) return { ok: true, email: input.email.trim(), token: "demo" };

  const res = await fetch(`${API_URL}/api/portal/employee-signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fullName: input.fullName,
      email: input.email,
      company: input.company,
      website: input.website ?? "",
      previousEmail: input.previous?.email,
      previousToken: input.previous?.token,
    }),
  });
  if (res.status === 429) return { ok: false, fields: [], message: "rateLimited" };
  if (!res.ok) return { ok: false, fields: [], message: "failed" };

  // The backend's envelope: { result: { ok, email, token, fields } }
  const result = (await res.json())?.result;
  if (result?.ok && typeof result.email === "string" && typeof result.token === "string") {
    return { ok: true, email: result.email, token: result.token };
  }
  const fields = Array.isArray(result?.fields) ? FIELDS.filter((f) => result.fields.includes(f)) : [];
  return fields.length ? { ok: false, fields } : { ok: false, fields: [], message: "failed" };
}
