import Link from "next/link";
import type { DisplayArticle, Locale, Market } from "@/lib/types";
import { getStrings } from "@/lib/i18n";

const MARKET_DOT: Record<Market, string> = {
  us_stock: "bg-sky-500",
  ru_stock: "bg-violet-500",
  crypto: "bg-orange-500",
};

const PERIOD_DOT = "bg-pink-500";
const HUMOR_DOT = "bg-fuchsia-500";

export function ArticleCard({ article, locale }: { article: DisplayArticle; locale: Locale }) {
  const t = getStrings(locale);
  const isSponsored = article.kind === "sponsored";

  const badgeLabel =
    article.kind === "humor"
      ? t.humorLabel
      : article.kind === "retrospective" && article.period
        ? t.periodLabel[article.period]
        : article.market === "us_stock"
          ? t.usStockLabel
          : article.market === "ru_stock"
            ? t.ruStockLabel
            : t.cryptoLabel;

  const badgeDot =
    article.kind === "humor" ? HUMOR_DOT : article.kind === "retrospective" ? PERIOD_DOT : MARKET_DOT[article.market ?? "us_stock"];

  return (
    <article
      className={`group flex flex-col overflow-hidden rounded-2xl border transition-all hover:shadow-lg hover:shadow-black/[0.03] dark:hover:shadow-black/20 ${
        isSponsored
          ? "border-amber-500/25 bg-amber-500/[0.04] hover:border-amber-500/45"
          : "border-border bg-surface hover:border-accent/40"
      }`}
    >
      <Link href={`/blog/${article.slug}`} className="block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={article.coverImageUrl}
          alt={article.title}
          className="h-44 w-full object-cover bg-surface-hover"
        />
      </Link>
      <div className="flex flex-col gap-2 p-5">
        <div className="flex items-center gap-1.5 text-[11px] text-muted uppercase tracking-wide">
          {isSponsored ? (
            <span className="rounded-full bg-amber-500/15 px-2 py-0.5 font-semibold text-amber-700 dark:text-amber-400">
              Реклама
            </span>
          ) : (
            <>
              <span className={`h-1.5 w-1.5 rounded-full ${badgeDot}`} />
              {badgeLabel}
            </>
          )}
        </div>
        <Link href={`/blog/${article.slug}`} className="font-semibold tracking-tight leading-snug group-hover:text-accent transition-colors">
          {article.title}
        </Link>
        <p className="text-sm text-foreground/80 leading-relaxed">{article.dek}</p>
        <div className="text-[11px] text-muted/70 mt-1">
          {new Date(article.publishedAt).toLocaleDateString(locale === "ru" ? "ru-RU" : "en-US")}
        </div>
      </div>
    </article>
  );
}
