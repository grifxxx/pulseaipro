import { searchCoin, getCryptoMarkets } from "@/lib/datasources/coingecko";
import { searchRussianStock, getRussianStockQuotes } from "@/lib/datasources/moex";
import { searchStock, getStockQuote, getCompanyNews, getCompanyLogo } from "@/lib/datasources/finnhub";
import { fetchAllFeeds, groupFeedByAsset } from "@/lib/datasources/rss";
import { analyzeAssetBundles } from "@/lib/llm/analyze";
import {
  ensureAsset,
  updateAssetLogo,
  createPipelineRun,
  finishPipelineRun,
  insertAttentionNotes,
  getAssetHistory,
  countRecentLookups,
  recordLookup,
} from "@/lib/db/queries";
import type { AssetBundle, Market, PriceSnapshot, RawNewsItem, WatchlistAsset } from "@/lib/types";

const RATE_LIMIT_PER_HOUR = 30;
const CACHE_HOURS = 24;

export type LookupResult =
  | { ok: true; ticker: string; market: Market; cached: boolean }
  | { ok: false; error: "not_found" | "no_news" | "rate_limited" };

/** Tries crypto first (broadest free coverage), then MOEX, then global stocks via Finnhub. */
async function resolveAsset(query: string): Promise<WatchlistAsset | null> {
  const coin = await searchCoin(query).catch(() => null);
  if (coin) {
    return { symbol: coin.id, name: coin.name, assetType: "crypto", market: "crypto" };
  }

  const ru = await searchRussianStock(query).catch(() => null);
  if (ru) {
    return { symbol: ru.symbol, name: ru.name, assetType: "stock", market: "ru_stock" };
  }

  const us = await searchStock(query).catch(() => null);
  if (us) {
    return { symbol: us.symbol, name: us.name, assetType: "stock", market: "us_stock" };
  }

  return null;
}

async function fetchPriceAndNews(
  asset: WatchlistAsset
): Promise<{ price: PriceSnapshot | null; news: RawNewsItem[]; logoUrl: string | null }> {
  if (asset.market === "crypto") {
    const [markets, feed] = await Promise.all([getCryptoMarkets([asset.symbol]), fetchAllFeeds()]);
    const entry = markets.get(asset.symbol);
    const news = groupFeedByAsset(feed, [asset]).get(asset.symbol) ?? [];
    return { price: entry?.price ?? null, news, logoUrl: entry?.logoUrl ?? null };
  }

  if (asset.market === "ru_stock") {
    const [quotes, feed] = await Promise.all([getRussianStockQuotes([asset.symbol]), fetchAllFeeds()]);
    const news = groupFeedByAsset(feed, [asset]).get(asset.symbol) ?? [];
    return { price: quotes.get(asset.symbol) ?? null, news, logoUrl: null };
  }

  const [price, news, logoUrl] = await Promise.all([
    getStockQuote(asset.symbol),
    getCompanyNews(asset.symbol),
    getCompanyLogo(asset.symbol),
  ]);
  return { price, news, logoUrl };
}

/** Resolves an arbitrary user search query to an asset, generating a fresh attention note on demand. */
export async function lookupAsset(rawQuery: string): Promise<LookupResult> {
  const query = rawQuery.trim();
  if (!query || query.length > 40) return { ok: false, error: "not_found" };

  const resolved = await resolveAsset(query);
  if (!resolved) return { ok: false, error: "not_found" };

  const history = await getAssetHistory(resolved.symbol);
  const latest = history[0];
  if (latest && Date.now() - new Date(latest.generatedAt).getTime() < CACHE_HOURS * 60 * 60 * 1000) {
    return { ok: true, ticker: resolved.symbol, market: resolved.market, cached: true };
  }

  const recentLookups = await countRecentLookups(60);
  if (recentLookups >= RATE_LIMIT_PER_HOUR) {
    return { ok: false, error: "rate_limited" };
  }
  await recordLookup(query);

  const assetRow = await ensureAsset({ ...resolved, source: "search" });
  const { price, news, logoUrl } = await fetchPriceAndNews(resolved);

  if (logoUrl && !assetRow.logoUrl) {
    await updateAssetLogo(assetRow.id, logoUrl).catch(() => undefined);
  }

  const bundle: AssetBundle = { asset: resolved, price, news };
  const runId = await createPipelineRun();

  try {
    const notes = await analyzeAssetBundles([bundle]);
    if (notes.length === 0) {
      await finishPipelineRun(runId, { status: "success", assetsScanned: 1, notesCreated: 0 });
      return { ok: false, error: "no_news" };
    }

    const notesCreated = await insertAttentionNotes(
      runId,
      notes.map((note) => ({ note, assetId: assetRow.id, priceSnapshot: price }))
    );

    await finishPipelineRun(runId, { status: "success", assetsScanned: 1, notesCreated });
    return { ok: true, ticker: resolved.symbol, market: resolved.market, cached: false };
  } catch (err) {
    await finishPipelineRun(runId, {
      status: "failed",
      assetsScanned: 1,
      notesCreated: 0,
      errorMessage: err instanceof Error ? err.message : String(err),
    });
    throw err;
  }
}
