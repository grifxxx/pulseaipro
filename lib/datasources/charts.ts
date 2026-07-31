import type { Market } from "@/lib/types";

export type ChartRange = "1d" | "1w" | "1m" | "1y" | "all";

export interface ChartPoint {
  t: number; // unix ms
  p: number; // price
}

export interface ChartSeries {
  points: ChartPoint[];
  currency: string;
}

/** How long Next.js should cache each upstream chart response — short for intraday
 * (prices move fast), long for wide ranges (they barely change minute to minute). */
function revalidateSeconds(range: ChartRange): number {
  switch (range) {
    case "1d":
      return 60;
    case "1w":
      return 300;
    default:
      return 3600;
  }
}

function cgHeaders(): HeadersInit {
  const key = process.env.COINGECKO_API_KEY;
  return key ? { "x-cg-demo-api-key": key } : {};
}

async function fetchYahooChart(symbol: string, range: ChartRange): Promise<ChartSeries> {
  const PARAMS: Record<ChartRange, { range: string; interval: string }> = {
    "1d": { range: "1d", interval: "5m" },
    "1w": { range: "5d", interval: "15m" },
    "1m": { range: "1mo", interval: "1d" },
    "1y": { range: "1y", interval: "1d" },
    all: { range: "max", interval: "1mo" },
  };
  const { range: r, interval } = PARAMS[range];
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=${r}&interval=${interval}`;

  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0" },
    next: { revalidate: revalidateSeconds(range) },
  });
  if (!res.ok) throw new Error(`Yahoo chart failed: ${res.status}`);
  const json = await res.json();
  const result = json?.chart?.result?.[0];
  if (!result) throw new Error("Yahoo chart: no data");

  const timestamps: number[] = result.timestamp ?? [];
  const closes: (number | null)[] = result.indicators?.quote?.[0]?.close ?? [];
  const points: ChartPoint[] = timestamps
    .map((t, i) => ({ t: t * 1000, p: closes[i] }))
    .filter((pt): pt is ChartPoint => pt.p != null);

  return { points, currency: result.meta?.currency ?? "USD" };
}

const MOEX_CANDLE_PARAMS: Record<ChartRange, { interval: number; days: number }> = {
  "1d": { interval: 10, days: 1 },
  "1w": { interval: 60, days: 7 },
  "1m": { interval: 24, days: 31 },
  "1y": { interval: 24, days: 366 },
  all: { interval: 31, days: 3650 },
};

async function fetchMoexChart(symbol: string, range: ChartRange): Promise<ChartSeries> {
  const { interval, days } = MOEX_CANDLE_PARAMS[range];
  const now = new Date();
  const from = new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const till = now.toISOString().slice(0, 10);

  const url = new URL(
    `https://iss.moex.com/iss/engines/stock/markets/shares/boards/TQBR/securities/${encodeURIComponent(symbol)}/candles.json`
  );
  url.searchParams.set("interval", String(interval));
  url.searchParams.set("from", from);
  url.searchParams.set("till", till);
  url.searchParams.set("iss.meta", "off");

  const res = await fetch(url.toString(), { next: { revalidate: revalidateSeconds(range) } });
  if (!res.ok) throw new Error(`MOEX candles failed: ${res.status}`);
  const json = await res.json();
  const columns: string[] = json?.candles?.columns ?? [];
  const rows: unknown[][] = json?.candles?.data ?? [];
  const closeIdx = columns.indexOf("close");
  const endIdx = columns.indexOf("end");
  if (closeIdx === -1 || endIdx === -1) throw new Error("MOEX candles: unexpected shape");

  const points: ChartPoint[] = rows
    .map((row) => ({ t: new Date(row[endIdx] as string).getTime(), p: row[closeIdx] as number }))
    .filter((pt) => Number.isFinite(pt.t) && Number.isFinite(pt.p));

  return { points, currency: "RUB" };
}

// CoinGecko's free public API caps historical queries at 365 days — "all" is clamped to the
// same window as "1y" rather than failing outright.
const COINGECKO_DAYS: Record<ChartRange, number> = { "1d": 1, "1w": 7, "1m": 30, "1y": 365, all: 365 };

async function fetchCoinGeckoChart(coinId: string, range: ChartRange): Promise<ChartSeries> {
  const days = COINGECKO_DAYS[range];
  const url = new URL(`https://api.coingecko.com/api/v3/coins/${encodeURIComponent(coinId)}/market_chart`);
  url.searchParams.set("vs_currency", "usd");
  url.searchParams.set("days", String(days));

  const res = await fetch(url.toString(), {
    headers: cgHeaders(),
    next: { revalidate: revalidateSeconds(range) },
  });
  if (!res.ok) throw new Error(`CoinGecko market_chart failed: ${res.status}`);
  const json = await res.json();
  const prices: [number, number][] = json?.prices ?? [];
  const points: ChartPoint[] = prices.map(([t, p]) => ({ t, p }));

  return { points, currency: "USD" };
}

/** Historical price series for the interactive chart, dispatched by market. Ticker convention
 * matches the rest of the app: plain symbol for stocks, CoinGecko id for crypto. */
export async function getChartSeries(ticker: string, market: Market, range: ChartRange): Promise<ChartSeries> {
  if (market === "crypto") return fetchCoinGeckoChart(ticker, range);
  if (market === "ru_stock") return fetchMoexChart(ticker, range);
  return fetchYahooChart(ticker, range);
}
