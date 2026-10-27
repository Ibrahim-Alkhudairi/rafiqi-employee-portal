import Link from "next/link";
import { type Content, type Lang } from "@/content";
import { LanguageLinks } from "./language-links";
import s from "./ui.module.css";

export function SkipLink({ t }: { t: Content }) {
  return (
    <a className={s.skip} href="#main">
      {t.skip}
    </a>
  );
}

/** The navy top bar: app icon and name, and the language switch. */
export function TopBar({ t, lang }: { t: Content; lang: Lang }) {
  return (
    <header className={s.bar}>
      <div className={s.barInner}>
        <Link href={`/${lang}/`} className={s.brand}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icon.png" alt="" width={36} height={36} />
          <span>{t.brand}</span>
        </Link>
        <div className={s.barEnd}>
          <LanguageLinks t={t} lang={lang} />
        </div>
      </div>
    </header>
  );
}
