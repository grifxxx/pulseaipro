"use client";

import { Area, AreaChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { Locale } from "@/lib/types";
import { getStrings } from "@/lib/i18n";

interface Point {
  t: number;
  s: number;
}

function formatTick(t: number, locale: Locale): string {
  return new Date(t).toLocaleDateString(locale === "ru" ? "ru-RU" : "en-US", { month: "short", year: "2-digit" });
}

function formatTooltipLabel(t: number, locale: Locale): string {
  return new Date(t).toLocaleDateString(locale === "ru" ? "ru-RU" : "en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/** Trend of sentiment_score (-1..1) across every note ever published for this asset — reuses
 * the same append-only history that already powers retrospectives, just charted directly. Only
 * worth rendering once there's an actual trend to see, not for a freshly-tracked asset. */
export function SentimentTrendChart({
  points,
  locale,
}: {
  points: { generatedAt: string; sentimentScore: number }[];
  locale: Locale;
}) {
  const t = getStrings(locale);
  if (points.length < 3) return null;

  const data: Point[] = points.map((p) => ({ t: new Date(p.generatedAt).getTime(), s: p.sentimentScore }));
  const last = data[data.length - 1].s;
  const color = last >= 0 ? "#10b981" : "#f43f5e";

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4">
      <div className="text-sm font-medium text-foreground">{t.sentimentHistoryTitle}</div>
      <div className="h-40 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 4 }}>
            <defs>
              <linearGradient id="sentimentFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.25} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="t"
              type="number"
              domain={["dataMin", "dataMax"]}
              tickFormatter={(v) => formatTick(v, locale)}
              tick={{ fontSize: 11, fill: "currentColor", opacity: 0.6 }}
              axisLine={false}
              tickLine={false}
              minTickGap={40}
            />
            <YAxis domain={[-1, 1]} hide />
            <ReferenceLine y={0} stroke="currentColor" strokeOpacity={0.15} />
            <Tooltip
              labelFormatter={(v) => formatTooltipLabel(Number(v), locale)}
              formatter={(value) => [Number(value).toFixed(2), t.sentimentHistoryTitle]}
              contentStyle={{
                background: "var(--color-surface)",
                border: "1px solid var(--color-border)",
                borderRadius: 8,
                fontSize: 12,
              }}
            />
            <Area type="monotone" dataKey="s" stroke={color} strokeWidth={2} fill="url(#sentimentFill)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
