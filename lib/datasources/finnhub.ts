import type { PriceSnapshot, RawNewsItem, WatchlistAsset } from "@/lib/types";

const BASE_URL = "https://finnhub.io/api/v1";

function apiKey(): string {
  const key = process.env.FINNHUB_API_KEY;
  if (!key) throw new Error("FINNHUB_API_KEY is not set");
  return key;
}

async function finnhubGet<T>(path: string, params: Record<string, string>): Promise<T> {
  const url = new URL(BASE_URL + path);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  url.searchParams.set("token", apiKey());

  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error(`Finnhub ${path} failed: ${res.status} ${await res.text()}`);
  }
  return (await res.json()) as T;
}

interface FinnhubQuote {
  c: number; // current price
  dp: number | null; // % change
  v?: number; // volume (not always present on /quote)
}

export async function getStockQuote(symbol: string): Promise<PriceSnapshot | null> {
  try {
    const q = await finnhubGet<FinnhubQuote>("/quote", { symbol });
    if (!q.c) return null;
    return {
      price: q.c,
      changePct24h: q.dp ?? null,
      volume: q.v ?? null,
      marketCap: null,
      currency: "USD",
    };
  } catch {
    return null;
  }
}

interface FinnhubCompanyNews {
  headline: string;
  url: string;
  source: string;
  datetime: number; // unix seconds
  summary: string;
  related: string;
}

export async function getCompanyNews(symbol: string, daysBack = 3): Promise<RawNewsItem[]> {
  const to = new Date();
  const from = new Date(to.getTime() - daysBack * 24 * 60 * 60 * 1000);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);

  try {
    const items = await finnhubGet<FinnhubCompanyNews[]>("/company-news", {
      symbol,
      from: fmt(from),
      to: fmt(to),
    });
    return items.slice(0, 8).map((n) => ({
      title: n.headline,
      url: n.url,
      publisher: n.source,
      publishedAt: new Date(n.datetime * 1000).toISOString(),
      summary: n.summary,
      relatedSymbols: n.related ? n.related.split(",").filter(Boolean) : [symbol],
    }));
  } catch {
    return [];
  }
}

export async function fetchStockData(
  asset: WatchlistAsset
): Promise<{ price: PriceSnapshot | null; news: RawNewsItem[] }> {
  const [price, news] = await Promise.all([
    getStockQuote(asset.symbol),
    getCompanyNews(asset.symbol),
  ]);
  return { price, news };
}

interface FinnhubProfile {
  logo?: string;
}

/** Company logo URL from Finnhub's profile endpoint. Cache the result — logos rarely change. */
export async function getCompanyLogo(symbol: string): Promise<string | null> {
  try {
    const profile = await finnhubGet<FinnhubProfile>("/stock/profile2", { symbol });
    return profile.logo || null;
  } catch {
    return null;
  }
}

export interface StockSearchResult {
  symbol: string;
  name: string;
}

interface FinnhubSearchResponse {
  result: { symbol: string; description: string; type: string }[];
}

/** Resolves an arbitrary user query to a tradable stock symbol, for on-demand lookups. */
export async function searchStock(query: string): Promise<StockSearchResult | null> {
  try {
    const data = await finnhubGet<FinnhubSearchResponse>("/search", { q: query });
    const match = data.result.find((r) => r.type === "Common Stock" && !r.symbol.includes("."));
    if (!match) return null;
    return { symbol: match.symbol, name: match.description };
  } catch {
    return null;
  }
}
