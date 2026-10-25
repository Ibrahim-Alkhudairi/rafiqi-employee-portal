import { notFound } from "next/navigation";
import { hasLang } from "@/content";
import { SignupPage } from "./signup-page";

export default async function Page({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;
  if (!hasLang(lang)) notFound();
  return <SignupPage lang={lang} />;
}
