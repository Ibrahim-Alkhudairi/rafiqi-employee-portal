import { ar } from "./ar";
import { en } from "./en";

export const content = { ar, en };
export type Lang = keyof typeof content;
export type Content = typeof en;
export const langs = Object.keys(content) as Lang[];
export const hasLang = (l: string): l is Lang => l in content;

export const links = {
  appStore: "https://apps.apple.com/sa/app/id1602789379",
  googlePlay: "https://play.google.com/store/apps/details?id=org.liajlehum.rafeeq",
};

/** Fills {placeholders} in a content string. */
export function fill(text: string, values: Record<string, string | number>): string {
  return text.replace(/\{(\w+)\}/g, (_, k: string) => String(values[k] ?? ""));
}
