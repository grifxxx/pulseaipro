"use client";

import { useState } from "react";
import Link from "next/link";
import type { DisplayAttentionNote, Locale, Market } from "@/lib/types";
import { getStrings } from "@/lib/i18n";
import { CURRENCY_SYMBOL } from "@/lib/format";
import { SentimentBadge } from "@/components/SentimentBadge";
import { SourceList } from "@/components/SourceList";
import { AssetLogo } from "@/components/AssetLogo";
import { PriceChart } from "@/components/PriceChart";
import { ShareButtons } from "@/components/ShareButtons";
import { WatchlistStar } from "@/components/WatchlistStar";
import { AddToPortfolioButton } from "@/components/AddToPortfolioButton";
import { SITE_URL } from "@/lib/seo";

const MARKET_DOT: Record<Market, string> = {
  us_stock: "bg-sky-500",
  ru_stock: "bg-violet-500",
  crypto: "bg-orange-500",
};

export function AssetCard({ note, locale }: { note: DisplayAttentionNote; locale: Locale }) {
  const t = getStrings(locale);
  const [showChart, setShowChart] = useState(false);
  const changePct = note.priceSnapshot?.changePct24h;
  const isUp = changePct != null && changePct >= 0;
  const marketLabel =
    note.market === "us_stock" ? t.usStockLabel : note.market === "ru_stock" ? t.ruStockLabel : t.cryptoLabel;
  const currencySymbol = note.priceSnapshot ? CURRENCY_SYMBOL[note.priceSnapshot.currency] ?? "" : "";

  return (
    <article className="group flex min-w-0 flex-col gap-3.5 rounded-2xl border border-border bg-surface p-5 transition-all hover:border-accent/40 hover:shadow-lg hover:shadow-black/[0.03] dark:hover:shadow-black/20">
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-start gap-2.5">
          <AssetLogo ticker={note.ticker} name={note.name} logoUrl={note.logoUrl} />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <Link
                href={`/asset/${note.ticker}`}
                className="font-semibold tracking-tight group-hover:text-accent transition-colors"
              >
                {note.name}
              </Link>
              <WatchlistStar assetId={note.assetId} locale={locale} />
              <AddToPortfolioButton assetId={note.assetId} locale={locale} />
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-muted uppercase tracking-wide mt-0.5">
              <span className={`h-1.5 w-1.5 rounded-full ${MARKET_DOT[note.market]}`} />
              {note.ticker} · {marketLabel}
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <SentimentBadge sentiment={note.sentiment} locale={locale} />
          {note.priceSnapshot && (
            <div className="text-sm font-mono tabular-nums">
              {currencySymbol}
              {note.priceSnapshot.price.toLocaleString()}{" "}
              {changePct != null && (
                <span className={isUp ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}>
                  {isUp ? "▲" : "▼"} {Math.abs(changePct).toFixed(2)}%
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      <p className="text-sm text-foreground/85 leading-relaxed">{note.summary}</p>

      <div>
        <div className="text-[11px] font-semibold text-muted uppercase tracking-wide mb-1">
          {t.whyNotableLabel}
        </div>
        <p className="text-sm text-foreground/85 leading-relaxed">{note.whyNotable}</p>
      </div>

      {note.keyFacts.length > 0 && (
        <ul className="flex flex-col gap-1.5 text-sm text-foreground/85">
          {note.keyFacts.map((fact, i) => (
            <li key={i} className="flex gap-2">
              <span className="text-accent select-none">•</span>
              <span className="leading-relaxed">{fact}</span>
            </li>
          ))}
        </ul>
      )}

      <div className="text-xs text-muted border-t border-border pt-3 leading-relaxed">
        <span className="font-medium text-foreground/70">{t.risksLabel}: </span>
        {note.riskNotes}
      </div>

      <button
        type="button"
        onClick={() => setShowChart((v) => !v)}
        className="w-fit text-xs font-medium text-accent hover:opacity-80 transition-opacity"
      >
        {showChart ? `− ${t.chartHide}` : `+ ${t.chartShow}`}
      </button>
      {showChart && <PriceChart ticker={note.ticker} market={note.market} locale={locale} />}

      <SourceList sources={note.sources} />

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="text-[11px] text-muted/70">
          {t.updatedLabel}: {new Date(note.generatedAt).toLocaleString(locale === "ru" ? "ru-RU" : "en-US")}
        </div>
        <ShareButtons
          url={`${SITE_URL}/asset/${note.ticker}`}
          title={`${note.name} (${note.ticker}): ${note.summary}`}
          label={t.shareLabel}
        />
      </div>
    </article>
  );
}
