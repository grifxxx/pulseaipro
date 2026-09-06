import type { Locale, Sentiment } from "@/lib/types";
import { getStrings } from "@/lib/i18n";

const STYLES: Record<Sentiment, string> = {
  bullish: "bg-positive/10 text-positive",
  bearish: "bg-negative/10 text-negative",
  neutral: "bg-muted/10 text-muted",
  mixed: "bg-warning/10 text-warning",
};

const DOT: Record<Sentiment, string> = {
  bullish: "bg-positive",
  bearish: "bg-negative",
  neutral: "bg-muted/60",
  mixed: "bg-warning",
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
