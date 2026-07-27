import type { PriceSnapshot, WatchlistAsset } from "@/lib/types";

const BASE_URL = "https://api.coingecko.com/api/v3";

function headers(): HeadersInit {
  const key = process.env.COINGECKO_API_KEY;
  return key ? { "x-cg-demo-api-key": key } : {};
}

interface CoinGeckoMarket {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  price_change_percentage_24h: number | null;
  total_volume: number | null;
  market_cap: number | null;
}

export interface CryptoMarketEntry {
  price: PriceSnapshot;
  logoUrl: string | null;
}

/** Fetch price/market data (+ coin icon URL) for a batch of CoinGecko coin IDs in one call. */
export async function getCryptoMarkets(coinIds: string[]): Promise<Map<string, CryptoMarketEntry>> {
  const result = new Map<string, CryptoMarketEntry>();
  if (coinIds.length === 0) return result;

  const url = new URL(`${BASE_URL}/coins/markets`);
  url.searchParams.set("vs_currency", "usd");
  url.searchParams.set("ids", coinIds.join(","));
  url.searchParams.set("price_change_percentage", "24h");

  const res = await fetch(url.toString(), { headers: headers() });
  if (!res.ok) {
    throw new Error(`CoinGecko /coins/markets failed: ${res.status} ${await res.text()}`);
  }
  const data = (await res.json()) as CoinGeckoMarket[];

  for (const coin of data) {
    result.set(coin.id, {
      price: {
        price: coin.current_price,
        changePct24h: coin.price_change_percentage_24h,
        volume: coin.total_volume,
        marketCap: coin.market_cap,
        currency: "USD",
      },
      logoUrl: coin.image || null,
    });
  }
  return result;
}

interface TrendingResponse {
  coins: { item: { id: string; name: string; symbol: string } }[];
}

/** Surfaces CoinGecko's currently-trending coins as extra watchlist candidates for this run. */
export async function getTrendingCoins(): Promise<WatchlistAsset[]> {
  const res = await fetch(`${BASE_URL}/search/trending`, { headers: headers() });
  if (!res.ok) return [];
  const data = (await res.json()) as TrendingResponse;
  return data.coins.map((c) => ({
    symbol: c.item.id,
    name: c.item.name,
    assetType: "crypto" as const,
    market: "crypto" as const,
    source: "trending" as const,
  }));
}

export interface CoinSearchResult {
  id: string;
  name: string;
  logoUrl: string | null;
}

interface SearchResponse {
  coins: { id: string; name: string; large?: string; thumb?: string; market_cap_rank: number | null }[];
}

// CoinGecko's search also surfaces obscure "tokenized stock" wrapper products (e.g. a
// synthetic on-chain "PayPal" token) that would otherwise shadow real stock ticker searches.
// Requiring a reasonably real market-cap rank filters those out while still covering
// thousands of genuine cryptocurrencies.
const MAX_TRUSTED_RANK = 500;

/** Resolves an arbitrary user query to a CoinGecko coin, for on-demand lookups. */
export async function searchCoin(query: string): Promise<CoinSearchResult | null> {
  const url = new URL(`${BASE_URL}/search`);
  url.searchParams.set("query", query);
  const res = await fetch(url.toString(), { headers: headers() });
  if (!res.ok) return null;
  const data = (await res.json()) as SearchResponse;
  if (data.coins.length === 0) return null;

  // Prefer the highest-market-cap match (search results aren't always ranked that way).
  const best = [...data.coins].sort(
    (a, b) => (a.market_cap_rank ?? Infinity) - (b.market_cap_rank ?? Infinity)
  )[0];
  if (best.market_cap_rank == null || best.market_cap_rank > MAX_TRUSTED_RANK) return null;

  return { id: best.id, name: best.name, logoUrl: best.large || best.thumb || null };
}
