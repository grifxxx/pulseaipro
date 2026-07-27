import Link from "next/link";
import type { DisplayAttentionNote } from "@/lib/types";

const CURRENCY_SYMBOL: Record<string, string> = {
  USD: "$",
  RUB: "₽",
};

function TickerItem({ note }: { note: DisplayAttentionNote }) {
  const change = note.priceSnapshot?.changePct24h;
  const isUp = change != null && change >= 0;
  const symbol = CURRENCY_SYMBOL[note.priceSnapshot?.currency ?? "USD"] ?? "";

  return (
    <Link
      href={`/asset/${encodeURIComponent(note.ticker)}`}
      className="flex items-center gap-1.5 text-xs font-mono whitespace-nowrap text-background/85 hover:text-background transition-colors"
    >
      <span className="font-semibold">{note.ticker}</span>
      <span>
        {symbol}
        {note.priceSnapshot?.price.toLocaleString()}
      </span>
      {change != null && (
        <span className={isUp ? "text-emerald-400" : "text-rose-400"}>
          {isUp ? "▲" : "▼"} {Math.abs(change).toFixed(2)}%
        </span>
      )}
    </Link>
  );
}

/** Classic scrolling stock-ticker strip. Pure CSS animation — no client JS needed. */
export function TickerTape({ notes }: { notes: DisplayAttentionNote[] }) {
  const items = notes.filter((n) => n.priceSnapshot != null);
  if (items.length === 0) return null;

  const duration = Math.min(Math.max(items.length * 3, 30), 120);

  return (
    <div className="relative overflow-hidden border-b border-border bg-foreground" role="marquee">
      <div
        className="flex w-max animate-ticker gap-8 px-4 py-2"
        style={{ animationDuration: `${duration}s` }}
      >
        <div className="flex shrink-0 gap-8">
          {items.map((n) => (
            <TickerItem key={n.id} note={n} />
          ))}
        </div>
        <div className="flex shrink-0 gap-8" aria-hidden="true">
          {items.map((n) => (
            <TickerItem key={`dup-${n.id}`} note={n} />
          ))}
        </div>
      </div>
    </div>
  );
}
