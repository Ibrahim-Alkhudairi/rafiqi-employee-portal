"use client";

import { useSyncExternalStore } from "react";
import { links, type Content } from "@/content";
import s from "./ui.module.css";

type Platform = "ios" | "android" | "other";

function platformFrom(userAgent: string): Platform {
  if (/android/i.test(userAgent)) return "android";
  if (/iphone|ipad|ipod/i.test(userAgent)) return "ios";
  return "other";
}

// The site is static files, so the phone is recognised in the browser; the
// prerendered HTML uses the default order.
const noChanges = () => () => {};
const usePlatform = () => useSyncExternalStore(noChanges, () => platformFrom(navigator.userAgent), (): Platform => "other");

/** Both store badges; on an Android phone Google Play comes first. */
export function StoreBadges({ stores }: { stores: Content["stores"] }) {
  const platform = usePlatform();
  const appStore = (
    <a key="ios" href={links.appStore} lang={stores.appStore.lang} className={s.badge}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/badges/app-store.svg" alt={stores.appStore.alt} width={175} height={52} />
    </a>
  );
  const googlePlay = (
    <a key="android" href={links.googlePlay} lang={stores.googlePlay.lang} className={s.badge}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={stores.googlePlay.src} alt={stores.googlePlay.alt} width={175} height={52} />
    </a>
  );
  return (
    <div className={s.stores} role="group" aria-label={stores.label}>
      {platform === "android" ? [googlePlay, appStore] : [appStore, googlePlay]}
    </div>
  );
}
