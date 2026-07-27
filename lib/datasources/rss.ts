import Parser from "rss-parser";
import type { RawNewsItem, WatchlistAsset } from "@/lib/types";

const FEEDS: { url: string; publisher: string }[] = [
  { url: "https://www.coindesk.com/arc/outboundfeeds/rss/", publisher: "CoinDesk" },
  { url: "https://cointelegraph.com/rss", publisher: "Cointelegraph" },
  { url: "https://feeds.reuters.com/reuters/businessNews", publisher: "Reuters Business" },
  { url: "https://finance.yahoo.com/news/rssindex", publisher: "Yahoo Finance" },
  { url: "https://www.marketwatch.com/rss/topstories", publisher: "MarketWatch" },
  // Russian-market coverage (for RU stocks) — all free, no key required.
  { url: "https://www.interfax.ru/rss.asp", publisher: "Interfax" },
  { url: "https://smart-lab.ru/news/rss/", publisher: "Smart-lab" },
  { url: "https://www.finam.ru/analysis/conews/rsspoint/", publisher: "Finam" },
];

const parser = new Parser();
const FEED_TIMEOUT_MS = 10_000;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error("feed timed out")), ms)),
  ]);
}

/** Fetches and flattens all curated RSS feeds. Best-effort — a broken or slow feed is skipped, not fatal. */
export async function fetchAllFeeds(): Promise<RawNewsItem[]> {
  const results = await Promise.allSettled(
    FEEDS.map(async ({ url, publisher }) => {
      const feed = await withTimeout(parser.parseURL(url), FEED_TIMEOUT_MS);
      return (feed.items ?? []).map<RawNewsItem>((item) => ({
        title: item.title ?? "",
        url: item.link ?? "",
        publisher,
        publishedAt: item.isoDate ?? item.pubDate ?? new Date().toISOString(),
        summary: item.contentSnippet,
      }));
    })
  );

  return results
    .filter((r): r is PromiseFulfilledResult<RawNewsItem[]> => r.status === "fulfilled")
    .flatMap((r) => r.value)
    .filter((item) => item.title && item.url);
}

/** Naive keyword match: does this news item's title/summary mention the asset's name or symbol? */
export function matchesAsset(item: RawNewsItem, asset: WatchlistAsset): boolean {
  const haystack = `${item.title} ${item.summary ?? ""}`.toLowerCase();
  const needleName = asset.name.toLowerCase();
  const needleSymbol = asset.symbol.toLowerCase();
  // For crypto, asset.symbol is a CoinGecko id like "the-open-network" - not useful as a keyword,
  // so fall back to just the display name for those.
  const nameHit = haystack.includes(needleName);
  const symbolHit = asset.assetType === "stock" && needleSymbol.length >= 2 && haystack.includes(needleSymbol);
  return nameHit || symbolHit;
}

/** Groups feed items by which watchlist assets they mention. Items matching nothing are dropped. */
export function groupFeedByAsset(
  items: RawNewsItem[],
  assets: WatchlistAsset[]
): Map<string, RawNewsItem[]> {
  const map = new Map<string, RawNewsItem[]>();
  for (const asset of assets) {
    const matches = items.filter((item) => matchesAsset(item, asset));
    if (matches.length > 0) map.set(asset.symbol, matches.slice(0, 6));
  }
  return map;
}
