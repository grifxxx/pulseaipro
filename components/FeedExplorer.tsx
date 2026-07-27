"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { DisplayAttentionNote, Locale, Market, Sentiment } from "@/lib/types";
import { getStrings } from "@/lib/i18n";
import { AssetCard } from "@/components/AssetCard";
import { Pagination } from "@/components/Pagination";

type MarketFilter = "all" | Market;
type SortBy = "newest" | "changeDesc" | "changeAsc" | "alpha";
type LookupState = "idle" | "loading" | "not_found" | "no_news" | "rate_limited";

const SENTIMENTS: Sentiment[] = ["bullish", "bearish", "mixed", "neutral"];
const PAGE_SIZE = 12;

export function FeedExplorer({ notes, locale }: { notes: DisplayAttentionNote[]; locale: Locale }) {
  const t = getStrings(locale);
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [market, setMarket] = useState<MarketFilter>("all");
  const [sentiments, setSentiments] = useState<Set<Sentiment>>(new Set());
  const [sortBy, setSortBy] = useState<SortBy>("newest");
  const [lookupState, setLookupState] = useState<LookupState>("idle");
  const [page, setPage] = useState(1);

  const marketTabs: { value: MarketFilter; label: string }[] = [
    { value: "all", label: t.filterAll },
    { value: "us_stock", label: t.filterUsStocks },
    { value: "ru_stock", label: t.filterRuStocks },
    { value: "crypto", label: t.filterCrypto },
  ];

  function toggleSentiment(s: Sentiment) {
    setSentiments((prev) => {
      const next = new Set(prev);
      if (next.has(s)) next.delete(s);
      else next.add(s);
      return next;
    });
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let result = notes.filter((n) => {
      if (market !== "all" && n.market !== market) return false;
      if (sentiments.size > 0 && !sentiments.has(n.sentiment)) return false;
      if (q && !n.name.toLowerCase().includes(q) && !n.ticker.toLowerCase().includes(q)) return false;
      return true;
    });

    result = [...result].sort((a, b) => {
      switch (sortBy) {
        case "changeDesc":
          return (b.priceSnapshot?.changePct24h ?? -Infinity) - (a.priceSnapshot?.changePct24h ?? -Infinity);
        case "changeAsc":
          return (a.priceSnapshot?.changePct24h ?? Infinity) - (b.priceSnapshot?.changePct24h ?? Infinity);
        case "alpha":
          return a.name.localeCompare(b.name);
        case "newest":
        default:
          return new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime();
      }
    });

    return result;
  }, [notes, market, sentiments, query, sortBy]);

  // Reset to page 1 whenever the filters change — adjusting state during render
  // (rather than in an effect) per React's guidance for derived-state resets.
  const filterKey = `${query}|${market}|${[...sentiments].sort().join(",")}|${sortBy}`;
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey);
  if (filterKey !== prevFilterKey) {
    setPrevFilterKey(filterKey);
    setPage(1);
  }

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  function goToPage(p: number) {
    setPage(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const queryMatchesNothing = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return false;
    return !notes.some((n) => n.name.toLowerCase().includes(q) || n.ticker.toLowerCase().includes(q));
  }, [notes, query]);

  async function handleLookup() {
    const q = query.trim();
    if (!q) return;
    setLookupState("loading");
    try {
      const res = await fetch(`/api/lookup?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (data.ok) {
        router.push(`/asset/${encodeURIComponent(data.ticker)}`);
        return;
      }
      setLookupState(data.error === "rate_limited" ? "rate_limited" : data.error === "no_news" ? "no_news" : "not_found");
    } catch {
      setLookupState("not_found");
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setLookupState("idle");
            }}
            placeholder={t.searchPlaceholder}
            className="w-full rounded-full border border-border bg-surface px-4 py-2 pr-9 text-sm outline-none focus:border-accent transition-colors placeholder:text-muted"
          />
          {query.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setLookupState("idle");
              }}
              aria-label={t.clearSearch}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center rounded-full text-muted hover:bg-border hover:text-foreground transition-colors"
            >
              ✕
            </button>
          )}
        </div>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortBy)}
          className="rounded-full border border-border bg-surface px-3.5 py-2 text-sm outline-none focus:border-accent transition-colors w-fit"
        >
          <option value="newest">{t.sortNewest}</option>
          <option value="changeDesc">{t.sortChangeDesc}</option>
          <option value="changeAsc">{t.sortChangeAsc}</option>
          <option value="alpha">{t.sortAlpha}</option>
        </select>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {marketTabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setMarket(tab.value)}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
              market === tab.value
                ? "bg-accent text-white"
                : "bg-surface border border-border text-muted hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
        <span className="mx-1 h-4 w-px bg-border hidden sm:inline-block" />
        {SENTIMENTS.map((s) => (
          <button
            key={s}
            onClick={() => toggleSentiment(s)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              sentiments.has(s)
                ? "bg-foreground text-background"
                : "bg-surface border border-border text-muted hover:text-foreground"
            }`}
          >
            {t.sentiment[s]}
          </button>
        ))}
      </div>

      <div className="text-xs text-muted">{t.resultsCount(filtered.length)}</div>

      {filtered.length === 0 && queryMatchesNothing ? (
        <div className="rounded-xl border border-accent/30 bg-accent/5 text-sm p-6 flex flex-col gap-3">
          <p className="text-foreground/85">{t.lookupCta(query.trim())}</p>
          <button
            onClick={handleLookup}
            disabled={lookupState === "loading"}
            className="w-fit flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-80"
          >
            {lookupState === "loading" && (
              <span className="h-3.5 w-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin" />
            )}
            {lookupState === "loading" ? t.lookupLoading : t.lookupButton}
          </button>
          {lookupState === "not_found" && <p className="text-rose-600 dark:text-rose-400">{t.lookupErrorNotFound}</p>}
          {lookupState === "no_news" && <p className="text-muted">{t.lookupErrorNoNews}</p>}
          {lookupState === "rate_limited" && (
            <p className="text-rose-600 dark:text-rose-400">{t.lookupErrorRateLimited}</p>
          )}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface text-sm p-6 text-muted">
          {t.noResultsState}
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {paged.map((note) => (
              <AssetCard key={note.id} note={note} locale={locale} />
            ))}
          </div>
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={goToPage} />
        </>
      )}
    </div>
  );
}
