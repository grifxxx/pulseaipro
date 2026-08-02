import Link from "next/link";
import type { ArticleAssetWidget } from "@/lib/types";
import { AssetLogo } from "@/components/AssetLogo";

const CURRENCY_SYMBOL: Record<string, string> = {
  USD: "$",
  RUB: "₽",
};

export function AssetWidget({ ticker, name, logoUrl, price, changePct, currency }: ArticleAssetWidget) {
  const isUp = changePct != null && changePct >= 0;
  const currencySymbol = CURRENCY_SYMBOL[currency] ?? "";

  return (
    <Link
      href={`/asset/${encodeURIComponent(ticker)}`}
      className="group flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3 transition-colors hover:border-accent/40"
    >
      <AssetLogo ticker={ticker} name={name} logoUrl={logoUrl} />
      <div className="min-w-0 flex-1">
        <div className="font-medium text-sm truncate group-hover:text-accent transition-colors">{name}</div>
        <div className="text-[11px] text-muted uppercase tracking-wide">{ticker}</div>
      </div>
      {price != null && (
        <div className="text-sm font-mono tabular-nums text-right shrink-0">
          <div>
            {currencySymbol}
            {price.toLocaleString()}
          </div>
          {changePct != null && (
            <div className={isUp ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}>
              {isUp ? "▲" : "▼"} {Math.abs(changePct).toFixed(2)}%
            </div>
          )}
        </div>
      )}
    </Link>
  );
}
