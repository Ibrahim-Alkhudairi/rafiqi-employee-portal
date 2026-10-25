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
        <Link href={`/${lang}`} className={s.brand}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icon.png" alt="" width={36} height={36} />
          <span>{t.brand}</span>
        </Link>
        <div className={s.barEnd}>
          <nav aria-label={t.language} className={s.langs}>
            {t.languages.map((l) => (
              <a
                key={l.lang}
                href={`/${l.lang}${path}`}
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

export type Platform = "ios" | "android" | "other";

export function platformFrom(userAgent: string | null): Platform {
  if (!userAgent) return "other";
  if (/android/i.test(userAgent)) return "android";
  if (/iphone|ipad|ipod/i.test(userAgent)) return "ios";
  return "other";
}

/** Both store badges; on an Android phone Google Play comes first. */
export function StoreBadges({ t, platform }: { t: Content; platform: Platform }) {
  const appStore = (
    <a key="ios" href={links.appStore} lang={t.stores.appStore.lang} className={s.badge}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/badges/app-store.svg" alt={t.stores.appStore.alt} width={175} height={52} />
    </a>
  );
  const googlePlay = (
    <a key="android" href={links.googlePlay} lang={t.stores.googlePlay.lang} className={s.badge}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={t.stores.googlePlay.src} alt={t.stores.googlePlay.alt} width={175} height={52} />
    </a>
  );
  return (
    <div className={s.stores} role="group" aria-label={t.stores.label}>
      {platform === "android" ? [googlePlay, appStore] : [appStore, googlePlay]}
    </div>
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
