import { companyKey } from "./normalize";

// The companies employees can pick on the sign-up form. The English name is
// what gets stored (EmployeeTrackings.CompanyName), so Arabic and English
// sign-ups count as one company. `slug` is the company's invite link,
// /ar/join/<slug>, which opens the form with the company already chosen.
// To add a company, add a line here.
export const companies = [{ slug: "zain", name: { en: "Zain", ar: "زين" } }].map((c) => ({
  ...c,
  key: companyKey(c.name.en),
}));

export function findCompany(key: string) {
  return companies.find((c) => c.key === key);
}

export function findCompanyBySlug(slug: string) {
  return companies.find((c) => c.slug === slug);
}
