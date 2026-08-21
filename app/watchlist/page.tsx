import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getServerAuthClient } from "@/lib/db/supabase-server";
import { getLatestFeedForAssetIds } from "@/lib/db/queries";
import { AssetCard } from "@/components/AssetCard";
import { TelegramLinkButton } from "@/components/TelegramLinkButton";
import { resolveLocale, getStrings, localizeNote } from "@/lib/i18n";

export const revalidate = 0;

export const metadata: Metadata = {
  title: getStrings("ru").watchlistTitle,
  robots: { index: false }, // personal page, nothing to rank in search
};

export default async function WatchlistPage() {
  const headersList = await headers();
  const locale = resolveLocale(headersList.get("accept-language"));
  const t = getStrings(locale);

  const supabase = await getServerAuthClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/watchlist");

  const { data: rows } = await supabase.from("user_watchlist").select("asset_id").eq("user_id", user.id);
  const assetIds = (rows ?? []).map((r) => r.asset_id as string);
  const notes = await getLatestFeedForAssetIds(assetIds);
  const localizedNotes = notes.map((n) => localizeNote(n, locale));

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14 flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">{t.watchlistTitle}</h1>
        <p className="text-sm sm:text-base text-muted max-w-xl">{t.watchlistSubtitle}</p>
      </div>

      <TelegramLinkButton locale={locale} />

      {localizedNotes.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface text-sm p-6 text-muted">
          {t.watchlistEmpty}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {localizedNotes.map((note) => (
            <AssetCard key={note.id} note={note} locale={locale} />
          ))}
        </div>
      )}
    </div>
  );
}
