import { headers } from "next/headers";
import type { Metadata } from "next";
import { getLatestFeed } from "@/lib/db/queries";
import { FeedExplorer } from "@/components/FeedExplorer";
import { TickerTape } from "@/components/TickerTape";
import { resolveLocale, getStrings, localizeNote } from "@/lib/i18n";
import type { AttentionNoteRow } from "@/lib/types";

export const revalidate = 0;

// SEO title/description pinned to Russian (see the comment in app/layout.tsx).
export const metadata: Metadata = {
  title: "Лента рынка: акции США, России и криптовалюты",
  description:
    "Какие акции и криптовалюты сегодня в новостях: что произошло, почему это заметно и какие риски — со ссылками на источники. Обновляется три раза в день.",
  keywords: [
    "новости фондового рынка",
    "акции США",
    "акции Мосбиржи",
    "новости криптовалют",
    "котировки",
  ],
  alternates: { canonical: "/feed" },
};

/** The live feed — what used to be the homepage. Moved to its own URL when the site's centre
 * of gravity shifted to the guides; nothing about the feed itself changed. */
export default async function FeedPage() {
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
            <span className="h-1.5 w-1.5 rounded-full bg-positive animate-pulse" />
            {t.liveBadge}
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold tracking-tight">{t.homeTitle}</h1>
          <p className="text-sm sm:text-base text-muted max-w-xl">{t.homeSubtitle}</p>
        </div>

        {loadError && (
          <div className="rounded-xl border border-negative/30 bg-negative/5 text-negative text-sm p-4">
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
