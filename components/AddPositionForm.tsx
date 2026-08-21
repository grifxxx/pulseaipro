"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getBrowserAuthClient } from "@/lib/db/supabase-browser";
import { getStrings } from "@/lib/i18n";
import type { Locale } from "@/lib/types";

export function AddPositionForm({ userId, locale }: { userId: string; locale: Locale }) {
  const t = getStrings(locale);
  const router = useRouter();
  const [ticker, setTicker] = useState("");
  const [quantity, setQuantity] = useState("");
  const [avgCost, setAvgCost] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const qty = Number(quantity);
    const cost = Number(avgCost);
    if (!ticker.trim() || !(qty > 0) || !(cost >= 0)) return;

    setSubmitting(true);
    const supabase = getBrowserAuthClient();

    const { data: asset } = await supabase
      .from("watchlist_assets")
      .select("id")
      .ilike("symbol", ticker.trim())
      .maybeSingle();

    if (!asset) {
      setError(t.portfolioTickerNotFound);
      setSubmitting(false);
      return;
    }

    const { error: upsertError } = await supabase.from("portfolio_positions").upsert(
      {
        user_id: userId,
        asset_id: asset.id,
        quantity: qty,
        avg_cost: cost,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,asset_id" }
    );

    setSubmitting(false);
    if (upsertError) {
      setError(upsertError.message);
      return;
    }

    setTicker("");
    setQuantity("");
    setAvgCost("");
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-border bg-surface p-4 flex flex-col sm:flex-row items-end gap-3 flex-wrap"
    >
      <div className="flex flex-col gap-1 min-w-0 flex-1">
        <label className="text-xs font-medium text-muted">{t.portfolioTickerLabel}</label>
        <input
          value={ticker}
          onChange={(e) => setTicker(e.target.value)}
          placeholder={t.portfolioTickerPlaceholder}
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
        />
      </div>
      <div className="flex flex-col gap-1 w-32">
        <label className="text-xs font-medium text-muted">{t.portfolioQuantityLabel}</label>
        <input
          type="number"
          step="any"
          min="0"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
        />
      </div>
      <div className="flex flex-col gap-1 w-36">
        <label className="text-xs font-medium text-muted">{t.portfolioAvgCostLabel}</label>
        <input
          type="number"
          step="any"
          min="0"
          value={avgCost}
          onChange={(e) => setAvgCost(e.target.value)}
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
        />
      </div>
      <button
        type="submit"
        disabled={submitting}
        className="shrink-0 rounded-full bg-accent text-accent-foreground text-sm font-medium px-4 py-2 hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {t.portfolioAddButton}
      </button>
      {error && <p className="w-full text-xs text-rose-600 dark:text-rose-400">{error}</p>}
    </form>
  );
}
