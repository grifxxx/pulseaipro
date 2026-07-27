import type { PriceSnapshot } from "@/lib/types";

const BASE_URL = "https://iss.moex.com/iss/engines/stock/markets/shares/boards/TQBR/securities.json";

interface IssTable {
  columns: string[];
  data: unknown[][];
}

interface IssResponse {
  marketdata: IssTable;
}

function rowsToObjects(table: IssTable): Record<string, unknown>[] {
  return table.data.map((row) => {
    const obj: Record<string, unknown> = {};
    table.columns.forEach((col, i) => (obj[col] = row[i]));
    return obj;
  });
}

/** Free, keyless MOEX ISS API. Fetches last price + % change vs previous close for a batch of tickers. */
export async function getRussianStockQuotes(tickers: string[]): Promise<Map<string, PriceSnapshot>> {
  const result = new Map<string, PriceSnapshot>();
  if (tickers.length === 0) return result;

  const url = new URL(BASE_URL);
  url.searchParams.set("securities", tickers.join(","));
  url.searchParams.set("iss.meta", "off");
  url.searchParams.set("iss.only", "marketdata");

  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error(`MOEX ISS request failed: ${res.status} ${await res.text()}`);
  }
  const data = (await res.json()) as IssResponse;
  const rows = rowsToObjects(data.marketdata);

  for (const row of rows) {
    const secid = row.SECID as string;
    const last = row.LAST as number | null;
    if (!secid || last == null) continue;
    result.set(secid, {
      price: last,
      changePct24h: (row.LASTTOPREVPRICE as number | null) ?? null,
      volume: (row.VOLTODAY as number | null) ?? null,
      marketCap: null,
      currency: "RUB",
    });
  }
  return result;
}

export interface MoexSearchResult {
  symbol: string;
  name: string;
}

interface SecuritiesSearchResponse {
  securities: IssTable;
}

/** Resolves an arbitrary user query (ticker or name) to a MOEX common-share ticker, for on-demand lookups. */
export async function searchRussianStock(query: string): Promise<MoexSearchResult | null> {
  const url = new URL("https://iss.moex.com/iss/securities.json");
  url.searchParams.set("q", query);
  url.searchParams.set("iss.meta", "off");

  const res = await fetch(url.toString());
  if (!res.ok) return null;
  const data = (await res.json()) as SecuritiesSearchResponse;
  const rows = rowsToObjects(data.securities);

  const match = rows.find(
    (r) => r.type === "common_share" && (r.primary_boardid === "TQBR" || r.marketprice_boardid === "TQBR")
  );
  if (!match) return null;

  return { symbol: match.secid as string, name: (match.shortname as string) ?? (match.name as string) };
}
