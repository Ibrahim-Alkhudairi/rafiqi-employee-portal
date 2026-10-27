import { notFound } from "next/navigation";
import { hasLang } from "@/content";
import { SignupPage } from "../../signup-page";

// A company's invite link: /ar/join/zain/ opens the sign-up form with Zain
// already chosen. Companies are added in the backoffice, so the build can't
// list them: this exports one page, /ar/join/, and public/.htaccess serves it
// for every /ar/join/<slug>/. The page reads the company from the address.
export const generateStaticParams = () => [{ company: [] }];

export default async function JoinPage({ params }: PageProps<"/[lang]/join/[[...company]]">) {
  const { lang } = await params;
  if (!hasLang(lang)) notFound();
  return <SignupPage lang={lang} invite />;
}
