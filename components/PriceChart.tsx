"use client";

import { useEffect, useState } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { Locale, Market } from "@/lib/types";
import type { ChartPoint, ChartRange } from "@/lib/datasources/charts";
import { CURRENCY_SYMBOL } from "@/lib/format";
import { getStrings } from "@/lib/i18n";

const RANGES: ChartRange[] = ["1d", "1w", "1m", "1y", "all"];

function rangeLabel(range: ChartRange, t: ReturnType<typeof getStrings>): string {
  switch (range) {
    case "1d":
      return t.chartRangeDay;
    case "1w":
      return t.chartRangeWeek;
    case "1m":
      return t.chartRangeMonth;
    case "1y":
      return t.chartRangeYear;
    case "all":
      return t.chartRangeAll;
  }
}

function formatTick(t: number, range: ChartRange, locale: Locale): string {
  const date = new Date(t);
  const dtLocale = locale === "ru" ? "ru-RU" : "en-US";
  if (range === "1d") return date.toLocaleTimeString(dtLocale, { hour: "2-digit", minute: "2-digit" });
  if (range === "1w") return date.toLocaleDateString(dtLocale, { weekday: "short" });
  if (range === "all") return date.toLocaleDateString(dtLocale, { month: "short", year: "2-digit" });
  return date.toLocaleDateString(dtLocale, { day: "2-digit", month: "short" });
}

function formatTooltipLabel(t: number, range: ChartRange, locale: Locale): string {
  const date = new Date(t);
  const dtLocale = locale === "ru" ? "ru-RU" : "en-US";
  if (range === "1d") {
    return date.toLocaleString(dtLocale, { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
  }
  return date.toLocaleDateString(dtLocale, { day: "2-digit", month: "short", year: "numeric" });
}

type FetchState =
  | { status: "error" }
  | { status: "empty" }
  | { status: "ok"; points: ChartPoint[]; currency: string };

export function PriceChart({ ticker, market, locale }: { ticker: string; market: Market; locale: Locale }) {
  const t = getStrings(locale);
  const [range, setRange] = useState<ChartRange>("1m");
  const requestKey = `${ticker}|${market}|${range}`;
  // Keyed by requestKey so a stale in-flight response never overwrites a newer one, and so
  // "loading" can be derived (below) instead of set synchronously at the top of the effect.
  const [result, setResult] = useState<{ key: string; state: FetchState } | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch(`/api/chart?ticker=${encodeURIComponent(ticker)}&market=${market}&range=${range}`)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("failed"))))
      .then((data: { points: ChartPoint[]; currency: string }) => {
        if (cancelled) return;
        setResult({
          key: requestKey,
          state:
            !data.points || data.points.length < 2
              ? { status: "empty" }
              : { status: "ok", points: data.points, currency: data.currency },
        });
      })
      .catch(() => {
        if (!cancelled) setResult({ key: requestKey, state: { status: "error" } });
      });

    return () => {
      cancelled = true;
    };
  }, [ticker, market, range, requestKey]);

  const state: FetchState | { status: "loading" } =
    result && result.key === requestKey ? result.state : { status: "loading" };

  const isUp =
    state.status === "ok" && state.points.length >= 2
      ? state.points[state.points.length - 1].p >= state.points[0].p
      : true;
  const color = isUp ? "#10b981" : "#f43f5e";

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4">
      <div className="flex flex-wrap items-center gap-1.5">
        {RANGES.map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setRange(r)}
            className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
              range === r
                ? "bg-accent text-white"
                : "bg-background border border-border text-muted hover:text-foreground"
            }`}
          >
            {rangeLabel(r, t)}
          </button>
        ))}
      </div>

      <div className="h-48 w-full">
        {state.status === "loading" && (
          <div className="flex h-full items-center justify-center text-xs text-muted">{t.chartLoading}</div>
        )}
        {state.status === "error" && (
          <div className="flex h-full items-center justify-center text-xs text-rose-600 dark:text-rose-400">
            {t.chartError}
          </div>
        )}
        {state.status === "empty" && (
          <div className="flex h-full items-center justify-center text-xs text-muted">{t.chartNoData}</div>
        )}
        {state.status === "ok" && (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={state.points} margin={{ top: 4, right: 4, bottom: 0, left: 4 }}>
              <defs>
                <linearGradient id={`priceFill-${ticker}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.25} />
                  <stop offset="100%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="t"
                type="number"
                domain={["dataMin", "dataMax"]}
                tickFormatter={(t) => formatTick(t, range, locale)}
                tick={{ fontSize: 11, fill: "currentColor", opacity: 0.6 }}
                axisLine={false}
                tickLine={false}
                minTickGap={40}
              />
              <YAxis domain={["auto", "auto"]} hide />
              <Tooltip
                labelFormatter={(t) => formatTooltipLabel(Number(t), range, locale)}
                formatter={(value) => [
                  `${CURRENCY_SYMBOL[state.currency] ?? ""}${Number(value).toLocaleString(locale === "ru" ? "ru-RU" : "en-US")}`,
                  "",
                ]}
                contentStyle={{
                  background: "var(--color-surface)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Area type="monotone" dataKey="p" stroke={color} strokeWidth={2} fill={`url(#priceFill-${ticker})`} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
