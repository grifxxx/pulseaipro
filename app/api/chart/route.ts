import { NextRequest } from "next/server";
import { getChartSeries, type ChartRange } from "@/lib/datasources/charts";
import type { Market } from "@/lib/types";

const VALID_MARKETS = new Set<Market>(["us_stock", "ru_stock", "crypto"]);
const VALID_RANGES = new Set<ChartRange>(["1d", "1w", "1m", "1y", "all"]);

export async function GET(req: NextRequest) {
  const ticker = req.nextUrl.searchParams.get("ticker");
  const market = req.nextUrl.searchParams.get("market") as Market | null;
  const range = req.nextUrl.searchParams.get("range") as ChartRange | null;

  if (!ticker || !market || !range || !VALID_MARKETS.has(market) || !VALID_RANGES.has(range)) {
    return Response.json({ error: "invalid_params" }, { status: 400 });
  }

  try {
    const series = await getChartSeries(ticker, market, range);
    return Response.json(series);
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "chart_fetch_failed" },
      { status: 502 }
    );
  }
}
