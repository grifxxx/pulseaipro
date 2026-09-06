import Link from "next/link";
import type { DisplayAttentionNote, Locale } from "@/lib/types";
import { getStrings } from "@/lib/i18n";
import { CURRENCY_SYMBOL } from "@/lib/format";
import { AssetLogo } from "@/components/AssetLogo";

const SENTIMENT_DOT = {
  bullish: "bg-positive",
  bearish: "bg-negative",
  mixed: "bg-warning",
  neutral: "bg-muted/60",
} as const;

/** The homepage's window onto the live feed: the handful of assets with the biggest moves today,
 * one line each. The full feed with filters and search lives on /feed — this is the reason to
 * click through, not a copy of it. */
export function FocusStrip({
  notes,
  locale,
  limit = 6,
}: {
  notes: DisplayAttentionNote[];
  locale: Locale;
  limit?: number;
}) {
  const t = getStrings(locale);

  const movers = notes
    .filter((n) => n.priceSnapshot?.changePct24h != null)
    .sort(
      (a, b) =>
        Math.abs(b.priceSnapshot!.changePct24h!) - Math.abs(a.priceSnapshot!.changePct24h!)
    )
    .slice(0, limit);

  if (movers.length === 0) return null;

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div className="flex flex-col gap-1">
          <h2 className="font-serif text-2xl font-semibold tracking-tight">{t.homeFocusTitle}</h2>
          <p className="text-sm text-muted">{t.homeFocusHint}</p>
        </div>
        <Link href="/feed" className="text-sm font-medium text-accent hover:opacity-80 transition-opacity">
          {t.homeFocusAll} →
        </Link>
      </div>
      <ul className="grid gap-x-8 sm:grid-cols-2 lg:grid-cols-3 rounded-2xl border border-border bg-surface px-5">
        {movers.map((note) => {
          const change = note.priceSnapshot!.changePct24h!;
          const isUp = change >= 0;
          const symbol = CURRENCY_SYMBOL[note.priceSnapshot!.currency] ?? "";
          return (
            <li key={note.id} className="border-t border-border first:border-t-0 sm:[&:nth-child(2)]:border-t-0 lg:[&:nth-child(3)]:border-t-0">
              <Link href={`/asset/${encodeURIComponent(note.ticker)}`} className="group flex items-center gap-3 py-3.5">
                <AssetLogo ticker={note.ticker} name={note.name} logoUrl={note.logoUrl} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${SENTIMENT_DOT[note.sentiment]}`} />
                    <span className="truncate text-sm font-medium text-foreground group-hover:text-accent transition-colors">
                      {note.name}
                    </span>
                  </div>
                  <div className="text-xs text-muted font-mono">{note.ticker}</div>
                </div>
                <div className="text-right font-mono text-sm tabular-nums shrink-0">
                  <div className="text-foreground/85">
                    {symbol}
                    {note.priceSnapshot!.price.toLocaleString()}
                  </div>
                  <div className={isUp ? "text-positive" : "text-negative"}>
                    {isUp ? "▲" : "▼"} {Math.abs(change).toFixed(2)}%
                  </div>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
