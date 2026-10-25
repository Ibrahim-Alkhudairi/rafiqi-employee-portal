import { headers } from "next/headers";
import { content, fill, type Lang } from "@/content";
import { companies } from "@/lib/companies";
import { SignupForm } from "./signup-form";
import s from "./signup.module.css";
import { Footer, platformFrom, SkipLink, StoreBadges, TopBar } from "./ui";

type Company = (typeof companies)[number];

/**
 * The sign-up page. Opened from a company's invite link (/[lang]/join/[slug]),
 * it names the company in the heading and has it already chosen in the form.
 */
export async function SignupPage({ lang, company }: { lang: Lang; company?: Company }) {
  const t = content[lang];
  const platform = platformFrom((await headers()).get("user-agent"));

  return (
    <>
      <SkipLink t={t} />
      <TopBar t={t} lang={lang} path={company ? `/join/${company.slug}` : ""} />
      <main id="main" tabIndex={-1}>
        <div className={s.hero}>
          <div className={s.heroInner}>
            <p className={s.eyebrow}>{t.signup.eyebrow}</p>
            <h1 className={s.title}>{company ? fill(t.signup.titleWith, { company: company.name[lang] }) : t.signup.title}</h1>
            <p className={s.lead}>{t.signup.lead}</p>
          </div>
        </div>
        <div className={s.layout}>
          <SignupForm
            t={t.signup}
            companies={companies.map((c) => ({ key: c.key, label: c.name[lang] }))}
            initialCompany={company?.key}
            badges={<StoreBadges t={t} platform={platform} />}
          />
          <section className={s.steps} aria-labelledby="steps-title">
            <h2 id="steps-title" className={s.stepsTitle}>
              {t.signup.stepsLabel}
            </h2>
            <ol>
              {t.signup.steps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </section>
        </div>
      </main>
      <Footer t={t} />
    </>
  );
}
