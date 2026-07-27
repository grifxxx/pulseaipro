import { STOCK_WATCHLIST, RUSSIAN_STOCK_WATCHLIST, CRYPTO_WATCHLIST } from "@/data/watchlist.seed";
import { fetchStockData, getCompanyLogo } from "@/lib/datasources/finnhub";
import { getCryptoMarkets, getTrendingCoins, type CryptoMarketEntry } from "@/lib/datasources/coingecko";
import { getRussianStockQuotes } from "@/lib/datasources/moex";
import { fetchAllFeeds, groupFeedByAsset } from "@/lib/datasources/rss";
import { analyzeAssetBundles } from "@/lib/llm/analyze";
import {
  createPipelineRun,
  ensureAsset,
  finishPipelineRun,
  getWatchlistBySource,
  insertAttentionNotes,
  updateAssetLogo,
  type WatchlistAssetRow,
} from "@/lib/db/queries";
import type { AssetBundle, AttentionNote, PriceSnapshot, WatchlistAsset } from "@/lib/types";

export interface PipelineResult {
  runId: string;
  assetsScanned: number;
  notesCreated: number;
}

function dedupeAssets(assets: WatchlistAsset[]): WatchlistAsset[] {
  const seen = new Set<string>();
  const out: WatchlistAsset[] = [];
  for (const a of assets) {
    const key = `${a.assetType}:${a.symbol.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(a);
  }
  return out;
}

function bundleKey(symbol: string, assetType: string): string {
  return `${assetType}:${symbol.toLowerCase()}`;
}

/** Best-effort logo enrichment: only hits the network for assets that don't have a cached logo yet. */
async function backfillLogos(
  usStockAssets: WatchlistAsset[],
  cryptoAssets: WatchlistAsset[],
  cryptoMarkets: Map<string, CryptoMarketEntry>,
  assetRowByKey: Map<string, WatchlistAssetRow>
): Promise<void> {
  const updates: Promise<void>[] = [];

  for (const asset of usStockAssets) {
    const row = assetRowByKey.get(bundleKey(asset.symbol, asset.assetType));
    if (!row || row.logoUrl) continue;
    updates.push(
      getCompanyLogo(asset.symbol).then((logoUrl) => {
        if (logoUrl) return updateAssetLogo(row.id, logoUrl).catch(() => undefined);
      })
    );
  }

  for (const asset of cryptoAssets) {
    const row = assetRowByKey.get(bundleKey(asset.symbol, asset.assetType));
    const logoUrl = cryptoMarkets.get(asset.symbol)?.logoUrl;
    if (!row || row.logoUrl || !logoUrl) continue;
    updates.push(updateAssetLogo(row.id, logoUrl).catch(() => undefined));
  }

  await Promise.all(updates);
}

export async function runPipeline(): Promise<PipelineResult> {
  const runId = await createPipelineRun();

  try {
    const [trending, discovered] = await Promise.all([
      getTrendingCoins().catch(() => []),
      // Assets users searched for that we didn't already track — permanently tracked from here on,
      // unlike `trending`, which is re-fetched fresh from CoinGecko every run and not accumulated.
      getWatchlistBySource("search").catch(() => []),
    ]);
    const watchlist = dedupeAssets([
      ...STOCK_WATCHLIST,
      ...RUSSIAN_STOCK_WATCHLIST,
      ...CRYPTO_WATCHLIST,
      ...trending,
      ...discovered,
    ]);

    const assetRows = await Promise.all(watchlist.map((a) => ensureAsset(a)));
    const assetRowByKey = new Map<string, WatchlistAssetRow>(
      assetRows.map((r) => [bundleKey(r.symbol, r.assetType), r])
    );

    const usStockAssets = watchlist.filter((a) => a.market === "us_stock");
    const ruStockAssets = watchlist.filter((a) => a.market === "ru_stock");
    const cryptoAssets = watchlist.filter((a) => a.market === "crypto");

    const [usStockData, ruPrices, cryptoMarkets, feedItems] = await Promise.all([
      Promise.all(usStockAssets.map(async (a) => ({ asset: a, ...(await fetchStockData(a)) }))),
      getRussianStockQuotes(ruStockAssets.map((a) => a.symbol)).catch(
        () => new Map<string, PriceSnapshot>()
      ),
      getCryptoMarkets(cryptoAssets.map((a) => a.symbol)).catch(
        () => new Map<string, CryptoMarketEntry>()
      ),
      fetchAllFeeds().catch(() => []),
    ]);

    const newsByAsset = groupFeedByAsset(feedItems, [...ruStockAssets, ...cryptoAssets]);

    const bundles: AssetBundle[] = [
      ...usStockData.map((d) => ({ asset: d.asset, price: d.price, news: d.news })),
      ...ruStockAssets.map((a) => ({
        asset: a,
        price: ruPrices.get(a.symbol) ?? null,
        news: newsByAsset.get(a.symbol) ?? [],
      })),
      ...cryptoAssets.map((a) => ({
        asset: a,
        price: cryptoMarkets.get(a.symbol)?.price ?? null,
        news: newsByAsset.get(a.symbol) ?? [],
      })),
    ];

    await backfillLogos(usStockAssets, cryptoAssets, cryptoMarkets, assetRowByKey);

    const bundleByKey = new Map(bundles.map((b) => [bundleKey(b.asset.symbol, b.asset.assetType), b]));

    const notes = await analyzeAssetBundles(bundles);

    const entries = await Promise.all(
      notes.map(async (note: AttentionNote) => {
        const key = bundleKey(note.ticker, note.category);
        const bundle = bundleByKey.get(key);
        const assetRow =
          assetRowByKey.get(key) ??
          (await ensureAsset({
            symbol: note.ticker,
            name: note.name,
            assetType: note.category,
            market: bundle?.asset.market ?? "us_stock",
          }));
        return { note, assetId: assetRow.id, priceSnapshot: bundle?.price ?? null };
      })
    );

    const notesCreated = await insertAttentionNotes(runId, entries);

    await finishPipelineRun(runId, {
      status: "success",
      assetsScanned: bundles.length,
      notesCreated,
    });

    return { runId, assetsScanned: bundles.length, notesCreated };
  } catch (err) {
    await finishPipelineRun(runId, {
      status: "failed",
      assetsScanned: 0,
      notesCreated: 0,
      errorMessage: err instanceof Error ? err.message : String(err),
    });
    throw err;
  }
}
