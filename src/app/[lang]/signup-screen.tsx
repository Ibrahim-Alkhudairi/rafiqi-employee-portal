"use client";

import { useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import { fill, type Content, type Lang } from "@/content";
import { fetchCompanies, inviteSlug, type Company } from "@/lib/companies";
import { SignupForm } from "./signup-form";
import s from "./signup.module.css";

const noChanges = () => () => {};

/**
 * The heading and the form. The companies load from the backend when the page
 * opens, so the ones added in the backoffice show without a new build.
 *
 * Every invite link (/[lang]/join/<slug>/) is this one static page, so the
 * company comes from the address. A company that isn't on the portal, or is
 * hidden, gets a short note and a way to the plain sign-up page instead.
 */
export function SignupScreen({ lang, t, invite, badges }: { lang: Lang; t: Content; invite: boolean; badges: ReactNode }) {
  const [companies, setCompanies] = useState<Company[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  // The prerendered page doesn't know the address; the browser does.
  const slug = useSyncExternalStore(noChanges, () => (invite ? inviteSlug(location.pathname) : null), () => null);

  useEffect(() => {
    let current = true;
    fetchCompanies().then(
      (list) => current && setCompanies(list),
      () => current && setFailed(true),
    );
    return () => {
      current = false;
    };
  }, [attempt]);

  const company = invite ? companies?.find((c) => c.slug === slug) : undefined;
  const inactive = invite && companies !== null && !company;

  useEffect(() => {
    if (company) document.title = fill(t.meta.titleWith, { company: company.name[lang] });
  }, [company, lang, t]);

  const options =
    companies
      ?.map((c) => ({ key: c.slug, label: c.name[lang] }))
      .sort((a, b) => a.label.localeCompare(b.label, lang)) ?? null;

  return (
    <>
      <div className={s.hero}>
        <div className={s.heroInner}>
          <p className={s.eyebrow}>{t.signup.eyebrow}</p>
          <h1 className={s.title} data-pending={(invite && !company && !inactive) || undefined}>
            {company ? fill(t.signup.titleWith, { company: company.name[lang] }) : t.signup.title}
          </h1>
        </div>
      </div>
      <div className={s.layout}>
        {inactive ? (
          <section className={`${s.card} ${s.inactive}`} aria-labelledby="inactive-title">
            <h2 id="inactive-title" className={s.inactiveTitle}>
              {t.signup.inviteInactive}
            </h2>
            <a className={s.download} href={`/${lang}/`}>
              {t.signup.inviteInactiveAction}
            </a>
          </section>
        ) : (
          <SignupForm
            t={t.signup}
            companies={options}
            invite={invite}
            initialCompany={company?.slug}
            loadFailed={failed}
            onRetry={() => {
              setFailed(false);
              setAttempt((a) => a + 1);
            }}
            badges={badges}
          />
        )}
      </div>
    </>
  );
}
