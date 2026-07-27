import { headers } from "next/headers";
import type { Metadata } from "next";
import { getLatestFeed } from "@/lib/db/queries";
import { FeedExplorer } from "@/components/FeedExplorer";
import { TickerTape } from "@/components/TickerTape";
import { resolveLocale, getStrings, localizeNote } from "@/lib/i18n";
import type { AttentionNoteRow } from "@/lib/types";

export const revalidate = 0;

export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers();
  const locale = resolveLocale(headersList.get("accept-language"));
  const t = getStrings(locale);
  // og:/twitter: pinned to Russian — see the comment in app/layout.tsx.
  const ru = getStrings("ru");
  return {
    title: t.homeTitle,
    description: t.homeSubtitle,
    alternates: { canonical: "/" },
    openGraph: { title: ru.homeTitle, description: ru.homeSubtitle },
  };
}

export default async function Home() {
  const headersList = await headers();
  const locale = resolveLocale(headersList.get("accept-language"));
  const t = getStrings(locale);

  let notes: AttentionNoteRow[];
  let loadError: string | null = null;

  try {
    notes = await getLatestFeed();
  } catch (err) {
    loadError = err instanceof Error ? err.message : String(err);
    notes = [];
  }

  const localizedNotes = notes.map((n) => localizeNote(n, locale));

  return (
    <>
      <TickerTape notes={localizedNotes} />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14 flex flex-col gap-8">
        <div className="flex flex-col gap-3">
          <div className="inline-flex w-fit items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-muted">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            {t.liveBadge}
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">{t.homeTitle}</h1>
          <p className="text-sm sm:text-base text-muted max-w-xl">{t.homeSubtitle}</p>
        </div>

        {loadError && (
          <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 text-rose-700 dark:text-rose-300 text-sm p-4">
            {t.loadErrorPrefix} ({loadError}). {t.loadErrorSuffix}
          </div>
        )}

        {!loadError && notes.length === 0 && (
          <div className="rounded-xl border border-border bg-surface text-sm p-6 text-muted">
            {t.emptyState}
          </div>
        )}

        {!loadError && notes.length > 0 && <FeedExplorer notes={localizedNotes} locale={locale} />}
      </div>
    </>
  );
}
