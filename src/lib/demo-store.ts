import "server-only";
import { companyKey, normalizeEmail } from "./normalize";
import type { Store } from "./types";

// Stands in for the Rafiqi database when RAFIQI_DB_URL is unset. Everything is
// lost when the server restarts.

type Row = { fullName: string; email: string; companyName: string; companyKey: string };

const g = globalThis as typeof globalThis & { __rafiqiDemo?: Map<string, Row> };

function rows() {
  g.__rafiqiDemo ??= new Map();
  return g.__rafiqiDemo;
}

export const demoStore: Store = {
  async saveEmployee({ fullName, email, companyName }, previousNormalizedEmail) {
    const s = rows();
    const normalizedEmail = normalizeEmail(email);
    // Same rules as the SQL store: an existing row for the new email wins;
    // otherwise the earlier row moves to the new email.
    if (previousNormalizedEmail && previousNormalizedEmail !== normalizedEmail) s.delete(previousNormalizedEmail);
    s.set(normalizedEmail, { fullName, email: email.trim(), companyName, companyKey: companyKey(companyName) });
  },
};
