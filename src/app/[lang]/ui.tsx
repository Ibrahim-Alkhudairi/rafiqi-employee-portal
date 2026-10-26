import Link from "next/link";
import { links, type Content, type Lang } from "@/content";
import s from "./ui.module.css";

export function SkipLink({ t }: { t: Content }) {
  return (
    <a className={s.skip} href="#main">
      {t.skip}
    </a>
  );
}

/** The navy top bar: app icon and name, and the language switch. */
export function TopBar({ t, lang, path }: { t: Content; lang: Lang; path: string }) {
  return (
    <header className={s.bar}>
      <div className={s.barInner}>
        <Link href={`/${lang}/`} className={s.brand}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icon.png" alt="" width={36} height={36} />
          <span>{t.brand}</span>
        </Link>
        <div className={s.barEnd}>
          <nav aria-label={t.language} className={s.langs}>
            {t.languages.map((l) => (
              <a
                key={l.lang}
                href={`/${l.lang}${path}/`}
                lang={l.lang}
                hrefLang={l.lang}
                aria-current={l.lang === lang ? "page" : undefined}
              >
                {l.label}
                {l.name && <span className="visually-hidden"> {l.name}</span>}
              </a>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
}

export function Footer({ t }: { t: Content }) {
  return (
    <footer className={s.footer}>
      <div className={s.footerInner}>
        <a href={links.privacy}>{t.footer.privacy}</a>
      </div>
    </footer>
  );
}
