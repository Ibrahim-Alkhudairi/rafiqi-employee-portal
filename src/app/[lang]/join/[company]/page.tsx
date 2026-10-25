import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { content, fill, hasLang } from "@/content";
import { companies, findCompanyBySlug } from "@/lib/companies";
import { SignupPage } from "../../signup-page";

// A company's invite link: /ar/join/zain opens the sign-up form with Zain
// already chosen. Unknown companies are a 404.
export const generateStaticParams = () => companies.map((c) => ({ company: c.slug }));

export async function generateMetadata({ params }: PageProps<"/[lang]/join/[company]">): Promise<Metadata> {
  const { lang, company: slug } = await params;
  const company = findCompanyBySlug(slug);
  if (!hasLang(lang) || !company) return {};
  return { title: fill(content[lang].meta.titleWith, { company: company.name[lang] }) };
}

export default async function JoinPage({ params }: PageProps<"/[lang]/join/[company]">) {
  const { lang, company: slug } = await params;
  const company = findCompanyBySlug(slug);
  if (!hasLang(lang) || !company) notFound();
  return <SignupPage lang={lang} company={company} />;
}
