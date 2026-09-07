import Link from "next/link";
import type { DisplayAttentionNote, Locale, Sentiment } from "@/lib/types";
import { getStrings } from "@/lib/i18n";

const SENTIMENT_FILL: Record<Sentiment, string> = {
  bullish: "bg-positive",
  bearish: "bg-negative",
  mixed: "bg-warning",
  neutral: "bg-muted/50",
};

function MoverRow({
  note,
  maxAbs,
  index,
  direction,
}: {
  note: DisplayAttentionNote;
  maxAbs: number;
  index: number;
  direction: "up" | "down";
}) {
  const change = note.priceSnapshot!.changePct24h!;
  // Bars are scaled against the largest absolute move on the page, so the longest bar always
  // fills its track and the rest stay comparable to it.
  const width = maxAbs > 0 ? Math.max(4, (Math.abs(change) / maxAbs) * 100) : 4;

  return (
    <li className="flex items-center gap-3">
      <Link
        href={`/asset/${encodeURIComponent(note.ticker)}`}
        title={note.name}
        className="w-20 shrink-0 truncate font-mono text-xs text-foreground/80 hover:text-accent transition-colors"
      >
        {note.ticker}
      </Link>
      <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-surface-hover">
        <div
          className={`h-full rounded-full animate-grow-x ${direction === "up" ? "bg-positive" : "bg-negative"}`}
          style={{ width: `${width}%`, animationDelay: `${index * 80}ms` }}
        />
      </div>
      <span
        className={`w-16 shrink-0 text-right font-mono text-xs tabular-nums ${
          direction === "up" ? "text-positive" : "text-negative"
        }`}
      >
        {change >= 0 ? "+" : "−"}
        {Math.abs(change).toFixed(1)}%
      </span>
    </li>
  );
}

/** A real chart of real numbers: the day's largest moves and the split of news sentiment across
 * the whole feed. Nothing here is invented or decorative — every bar is a value the pipeline
 * already stored, which is the only kind of visualisation worth putting on a finance page. */
export function MarketPulse({ notes, locale }: { notes: DisplayAttentionNote[]; locale: Locale }) {
  const t = getStrings(locale);

  const withChange = notes.filter((n) => n.priceSnapshot?.changePct24h != null);
  if (withChange.length === 0) return null;

  const sorted = [...withChange].sort(
    (a, b) => b.priceSnapshot!.changePct24h! - a.priceSnapshot!.changePct24h!
  );
  const gainers = sorted.filter((n) => n.priceSnapshot!.changePct24h! > 0).slice(0, 5);
  const losers = sorted
    .filter((n) => n.priceSnapshot!.changePct24h! < 0)
    .slice(-5)
    .reverse();
  const maxAbs = Math.max(
    ...[...gainers, ...losers].map((n) => Math.abs(n.priceSnapshot!.changePct24h!)),
    0
  );

  const order: Sentiment[] = ["bullish", "mixed", "neutral", "bearish"];
  const counts = order.map((sentiment) => ({
    sentiment,
    count: notes.filter((n) => n.sentiment === sentiment).length,
  }));
  const total = counts.reduce((sum, c) => sum + c.count, 0);

  return (
    <section className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <h2 className="font-serif text-2xl font-semibold tracking-tight">{t.homePulseTitle}</h2>
        <p className="text-sm text-muted max-w-2xl">{t.homePulseHint}</p>
      </div>

      <div className="rounded-2xl border border-border bg-surface p-5 sm:p-6 flex flex-col gap-6">
        <div className="grid gap-6 sm:grid-cols-2 sm:gap-10">
          {gainers.length > 0 && (
            <div className="flex flex-col gap-3">
              <div className="text-xs font-semibold uppercase tracking-wide text-positive">
                {t.homePulseGainers}
              </div>
              <ul className="flex flex-col gap-2.5">
                {gainers.map((note, i) => (
                  <MoverRow key={note.id} note={note} maxAbs={maxAbs} index={i} direction="up" />
                ))}
              </ul>
            </div>
          )}
          {losers.length > 0 && (
            <div className="flex flex-col gap-3">
              <div className="text-xs font-semibold uppercase tracking-wide text-negative">
                {t.homePulseLosers}
              </div>
              <ul className="flex flex-col gap-2.5">
                {losers.map((note, i) => (
                  <MoverRow key={note.id} note={note} maxAbs={maxAbs} index={i} direction="down" />
                ))}
              </ul>
            </div>
          )}
        </div>

        {total > 0 && (
          <div className="flex flex-col gap-2.5 border-t border-border pt-5">
            <div className="text-xs font-semibold uppercase tracking-wide text-muted">
              {t.homePulseSentiment}
            </div>
            <div
              className="flex h-3 w-full overflow-hidden rounded-full bg-surface-hover animate-grow-x"
              style={{ animationDelay: "240ms" }}
              role="img"
              aria-label={counts.map((c) => `${t.sentiment[c.sentiment]}: ${c.count}`).join(", ")}
            >
              {counts.map((c) =>
                c.count === 0 ? null : (
                  <span
                    key={c.sentiment}
                    className={SENTIMENT_FILL[c.sentiment]}
                    style={{ width: `${(c.count / total) * 100}%` }}
                  />
                )
              )}
            </div>
            <ul className="flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-muted">
              {counts.map((c) => (
                <li key={c.sentiment} className="flex items-center gap-1.5">
                  <span className={`h-2 w-2 rounded-full ${SENTIMENT_FILL[c.sentiment]}`} />
                  {t.sentiment[c.sentiment]}
                  <span className="font-mono tabular-nums text-foreground/70">{c.count}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
