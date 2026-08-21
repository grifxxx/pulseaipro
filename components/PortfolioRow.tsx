"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { getBrowserAuthClient } from "@/lib/db/supabase-browser";
import { AssetLogo } from "@/components/AssetLogo";
import { CURRENCY_SYMBOL } from "@/lib/format";
import { getStrings } from "@/lib/i18n";
import type { Locale } from "@/lib/types";

export interface PortfolioRowData {
  assetId: string;
  ticker: string;
  name: string;
  logoUrl: string | null;
  quantity: number;
  avgCost: number;
  currentPrice: number | null;
  currency: string;
}

export function PortfolioRow({
  userId,
  position,
  locale,
}: {
  userId: string;
  position: PortfolioRowData;
  locale: Locale;
}) {
  const t = getStrings(locale);
  const router = useRouter();
  const [removing, setRemoving] = useState(false);
  const symbol = CURRENCY_SYMBOL[position.currency] ?? "";

  const currentValue = position.currentPrice != null ? position.currentPrice * position.quantity : null;
  const costBasis = position.avgCost * position.quantity;
  const pnl = currentValue != null ? currentValue - costBasis : null;
  const pnlPct = position.currentPrice != null && position.avgCost > 0 ? ((position.currentPrice - position.avgCost) / position.avgCost) * 100 : null;
  const isUp = pnl != null && pnl >= 0;

  async function remove() {
    setRemoving(true);
    const supabase = getBrowserAuthClient();
    await supabase
      .from("portfolio_positions")
      .delete()
      .eq("user_id", userId)
      .eq("asset_id", position.assetId);
    router.refresh();
  }

  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-surface p-4 flex-wrap">
      <AssetLogo ticker={position.ticker} name={position.name} logoUrl={position.logoUrl} />
      <div className="min-w-0 flex-1">
        <Link href={`/asset/${position.ticker}`} className="font-semibold tracking-tight hover:text-accent transition-colors">
          {position.name}
        </Link>
        <div className="text-[11px] text-muted uppercase tracking-wide">
          {position.ticker} · {position.quantity} шт · {t.portfolioAvgCostLabel.toLowerCase()} {symbol}
          {position.avgCost}
        </div>
      </div>

      <div className="text-right shrink-0">
        <div className="text-[11px] text-muted uppercase tracking-wide">{t.portfolioCurrentPriceLabel}</div>
        <div className="text-sm font-mono tabular-nums">
          {position.currentPrice != null ? `${symbol}${position.currentPrice}` : t.portfolioNoPriceData}
        </div>
      </div>

      <div className="text-right shrink-0">
        <div className="text-[11px] text-muted uppercase tracking-wide">{t.portfolioPnlLabel}</div>
        {pnl != null && pnlPct != null ? (
          <div className={`text-sm font-mono tabular-nums font-semibold ${isUp ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
            {isUp ? "▲" : "▼"} {symbol}
            {Math.abs(pnl).toFixed(2)} ({pnlPct >= 0 ? "+" : ""}
            {pnlPct.toFixed(2)}%)
          </div>
        ) : (
          <div className="text-sm text-muted">—</div>
        )}
      </div>

      <button
        type="button"
        onClick={remove}
        disabled={removing}
        className="shrink-0 text-xs font-medium text-muted hover:text-rose-600 dark:hover:text-rose-400 transition-colors disabled:opacity-50"
      >
        {t.portfolioRemoveButton}
      </button>
    </div>
  );
}
