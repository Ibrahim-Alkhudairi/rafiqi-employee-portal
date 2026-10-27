import { content, type Lang } from "@/content";
import { SignupScreen } from "./signup-screen";
import { StoreBadges } from "./store-badges";
import { SkipLink, TopBar } from "./ui";

/**
 * The sign-up page. Opened from a company's invite link (/[lang]/join/<slug>/),
 * it names the company in the heading and has it already chosen in the form.
 */
export function SignupPage({ lang, invite = false }: { lang: Lang; invite?: boolean }) {
  const t = content[lang];

  return (
    <>
      <SkipLink t={t} />
      <TopBar t={t} lang={lang} />
      <main id="main" tabIndex={-1}>
        <SignupScreen lang={lang} t={t} invite={invite} badges={<StoreBadges stores={t.stores} />} />
      </main>
    </>
  );
}
