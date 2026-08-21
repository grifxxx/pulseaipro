import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getServerAuthClient } from "@/lib/db/supabase-server";
import { getLatestFeedForAssetIds } from "@/lib/db/queries";
import { AddPositionForm } from "@/components/AddPositionForm";
import { PortfolioRow, type PortfolioRowData } from "@/components/PortfolioRow";
import { resolveLocale, getStrings } from "@/lib/i18n";

export const revalidate = 0;

export const metadata: Metadata = {
  title: getStrings("ru").portfolioTitle,
  robots: { index: false }, // personal page, nothing to rank in search
};

export default async function PortfolioPage() {
  const headersList = await headers();
  const locale = resolveLocale(headersList.get("accept-language"));
  const t = getStrings(locale);

  const supabase = await getServerAuthClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/portfolio");

  const { data: positionRows } = await supabase
    .from("portfolio_positions")
    .select("asset_id, quantity, avg_cost")
    .eq("user_id", user.id);
  const positions = positionRows ?? [];
  const assetIds = positions.map((p) => p.asset_id as string);

  const notes = await getLatestFeedForAssetIds(assetIds);
  const noteByAssetId = new Map(notes.map((n) => [n.assetId, n]));

  // Positions whose asset never got a note yet (rare — e.g. just added) still need a
  // ticker/name to display, so fall back to the asset row directly.
  const missingAssetIds = assetIds.filter((id) => !noteByAssetId.has(id));
  const { data: fallbackAssets } =
    missingAssetIds.length > 0
      ? await supabase.from("watchlist_assets").select("id, symbol, name").in("id", missingAssetIds)
      : { data: [] as { id: string; symbol: string; name: string }[] };
  const fallbackByAssetId = new Map((fallbackAssets ?? []).map((a) => [a.id as string, a]));

  const rows: PortfolioRowData[] = positions
    .map((p): PortfolioRowData | null => {
      const assetId = p.asset_id as string;
      const note = noteByAssetId.get(assetId);
      const fallback = fallbackByAssetId.get(assetId);
      if (!note && !fallback) return null;

      return {
        assetId,
        ticker: note?.ticker ?? fallback!.symbol,
        name: note?.name ?? fallback!.name,
        logoUrl: note?.logoUrl ?? null,
        quantity: Number(p.quantity),
        avgCost: Number(p.avg_cost),
        currentPrice: note?.priceSnapshot?.price ?? null,
        currency: note?.priceSnapshot?.currency ?? "USD",
      };
    })
    .filter((r): r is PortfolioRowData => r !== null);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-14 flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">{t.portfolioTitle}</h1>
        <p className="text-sm sm:text-base text-muted max-w-xl">{t.portfolioSubtitle}</p>
      </div>

      <AddPositionForm userId={user.id} locale={locale} />

      {rows.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface text-sm p-6 text-muted">{t.portfolioEmpty}</div>
      ) : (
        <div className="flex flex-col gap-3">
          {rows.map((row) => (
            <PortfolioRow key={row.assetId} userId={user.id} position={row} locale={locale} />
          ))}
        </div>
      )}
    </div>
  );
}
