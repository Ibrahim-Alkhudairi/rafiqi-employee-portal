import { content, fill, type Lang } from "@/content";
import { companies } from "@/lib/companies";
import { SignupForm } from "./signup-form";
import s from "./signup.module.css";
import { StoreBadges } from "./store-badges";
import { SkipLink, TopBar } from "./ui";

type Company = (typeof companies)[number];

/**
 * The sign-up page. Opened from a company's invite link (/[lang]/join/[slug]),
 * it names the company in the heading and has it already chosen in the form.
 */
export function SignupPage({ lang, company }: { lang: Lang; company?: Company }) {
  const t = content[lang];

  return (
    <>
      <SkipLink t={t} />
      <TopBar t={t} lang={lang} path={company ? `/join/${company.slug}` : ""} />
      <main id="main" tabIndex={-1}>
        <div className={s.hero}>
          <div className={s.heroInner}>
            <p className={s.eyebrow}>{t.signup.eyebrow}</p>
            <h1 className={s.title}>{company ? fill(t.signup.titleWith, { company: company.name[lang] }) : t.signup.title}</h1>
          </div>
        </div>
        <div className={s.layout}>
          <SignupForm
            t={t.signup}
            companies={companies.map((c) => ({ key: c.key, label: c.name[lang] }))}
            initialCompany={company?.key}
            badges={<StoreBadges stores={t.stores} />}
          />
        </div>
      </main>
    </>
  );
}
