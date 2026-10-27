import { API_URL } from "./api";

// The companies employees can pick on the sign-up form. Rafiqi admins add,
// rename and hide them in the backoffice (EmployeeCompanies), so every page
// loads them when it opens instead of the list being part of the build.
// `slug` is what a sign-up sends as its company, and the company's invite
// link, /ar/join/<slug>/, which opens the form with that company fixed.
export type Company = { slug: string; name: { en: string; ar: string } };

// Demo mode (no backend set): the companies the backend started with.
const DEMO: Company[] = [
  { slug: "zain", name: { en: "Zain", ar: "زين" } },
  { slug: "sidf", name: { en: "SIDF", ar: "صندوق التنمية الصناعية السعودي" } },
  { slug: "niepd", name: { en: "NIEPD", ar: "المعهد الوطني للتطوير المهني التعليمي" } },
];

type ApiCompany = { slug?: unknown; nameEn?: unknown; nameAr?: unknown };

/** The companies shown on the portal, from GET /api/portal/employee-signup/companies. Throws when it can't load them. */
export async function fetchCompanies(): Promise<Company[]> {
  if (!API_URL) return DEMO;

  // Revalidated every time, so a company added in the backoffice shows on the next visit.
  const res = await fetch(`${API_URL}/api/portal/employee-signup/companies`, { cache: "no-cache" });
  if (!res.ok) throw new Error(`Companies: HTTP ${res.status}`);

  // The backend's envelope: { result: [{ slug, nameEn, nameAr }] }
  const result: unknown = (await res.json())?.result;
  if (!Array.isArray(result)) throw new Error("Companies: unexpected response");
  return result.flatMap((c: ApiCompany) =>
    typeof c.slug === "string" && typeof c.nameEn === "string" && typeof c.nameAr === "string"
      ? [{ slug: c.slug, name: { en: c.nameEn, ar: c.nameAr } }]
      : [],
  );
}

/** The company slug in an invite link's path, /ar/join/<slug>/. */
export function inviteSlug(pathname: string): string | null {
  return /^\/(?:ar|en)\/join\/([a-z0-9-]+)\/?$/.exec(pathname)?.[1] ?? null;
}
