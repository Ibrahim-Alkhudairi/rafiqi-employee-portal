const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function isValidEmail(email: string): boolean {
  return email.length <= 256 && EMAIL.test(email);
}

// Free mail providers: employees have to use their company email, so these are
// turned away with a message saying so. The backend checks the same list
// (EmployeeSignupService); keep the two in step.
const PERSONAL_DOMAINS = new Set([
  "gmail.com", "googlemail.com", "msn.com", "icloud.com", "me.com", "mac.com", "aol.com",
  "proton.me", "protonmail.com", "gmx.com", "mail.com", "yandex.com", "zoho.com", "ymail.com",
]);
const PERSONAL_FAMILIES = /^(hotmail|outlook|live|yahoo)\.[a-z]{2,}(\.[a-z]{2,})?$/; // hotmail.com, outlook.sa, yahoo.co.uk…

export function isPersonalEmail(email: string): boolean {
  const domain = email.trim().toLowerCase().split("@")[1] ?? "";
  return PERSONAL_DOMAINS.has(domain) || PERSONAL_FAMILIES.test(domain);
}

// A grouping key for free-text company names: "ACME  Co." and "acme co"
// become one company, and so do Arabic spellings that differ only in hamza,
// taa marbuta, alif maqsura, tatweel or diacritics.
export function companyKey(name: string): string {
  return name
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[ً-ْٰـ]/g, "") // diacritics, tatweel
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/[^\p{L}\p{N}]+/gu, " ") // punctuation and symbols act as spaces
    .trim()
    .replace(/\s+/g, " ");
}
