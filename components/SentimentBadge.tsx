import type { Locale, Sentiment } from "@/lib/types";
import { getStrings } from "@/lib/i18n";

const STYLES: Record<Sentiment, string> = {
  bullish: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  bearish: "bg-rose-500/10 text-rose-700 dark:text-rose-400",
  neutral: "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400",
  mixed: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
};

const DOT: Record<Sentiment, string> = {
  bullish: "bg-emerald-500",
  bearish: "bg-rose-500",
  neutral: "bg-zinc-400",
  mixed: "bg-amber-500",
};

export function SentimentBadge({ sentiment, locale }: { sentiment: Sentiment; locale: Locale }) {
  const t = getStrings(locale);
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${STYLES[sentiment]}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${DOT[sentiment]}`} />
      {t.sentiment[sentiment]}
    </span>
  );
}
