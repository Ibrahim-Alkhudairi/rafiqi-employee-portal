"use client";

import { useSyncExternalStore } from "react";
import type { Content, Lang } from "@/content";
import s from "./ui.module.css";

const noChanges = () => () => {};

/**
 * The language switch. It keeps the visitor on the same page, invite links
 * included: those are one static page for every company, so only the address
 * says which company it is. The prerendered links go to each language's home.
 */
export function LanguageLinks({ t, lang }: { t: Content; lang: Lang }) {
  const path = useSyncExternalStore(noChanges, () => location.pathname, () => null);
  const href = (to: string) => path?.replace(/^\/(ar|en)(?=\/|$)/, `/${to}`) ?? `/${to}/`;

  return (
    <nav aria-label={t.language} className={s.langs}>
      {t.languages.map((l) => (
        <a
          key={l.lang}
          href={href(l.lang)}
          lang={l.lang}
          hrefLang={l.lang}
          aria-current={l.lang === lang ? "page" : undefined}
        >
          {l.label}
          {l.name && <span className="visually-hidden"> {l.name}</span>}
        </a>
      ))}
    </nav>
  );
}
