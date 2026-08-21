"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getBrowserAuthClient } from "@/lib/db/supabase-browser";
import { getStrings } from "@/lib/i18n";
import type { Locale } from "@/lib/types";

export function AddToPortfolioButton({ assetId, locale }: { assetId: string; locale: Locale }) {
  const t = getStrings(locale);
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [quantity, setQuantity] = useState("");
  const [avgCost, setAvgCost] = useState("");
  const [saved, setSaved] = useState(false);

  async function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    const supabase = getBrowserAuthClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push(`/login?next=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    setOpen((v) => !v);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const qty = Number(quantity);
    const cost = Number(avgCost);
    if (!(qty > 0) || !(cost >= 0)) return;

    const supabase = getBrowserAuthClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from("portfolio_positions").upsert(
      {
        user_id: user.id,
        asset_id: assetId,
        quantity: qty,
        avg_cost: cost,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,asset_id" }
    );
    if (error) return;

    setSaved(true);
    setTimeout(() => {
      setOpen(false);
      setSaved(false);
      setQuantity("");
      setAvgCost("");
      router.refresh();
    }, 900);
  }

  return (
    <div className="relative inline-block" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        onClick={toggle}
        aria-label={t.portfolioAddButton}
        title={t.portfolioAddButton}
        className="text-sm leading-none text-muted hover:text-accent transition-colors"
      >
        +💼
      </button>
      {open && (
        <form
          onSubmit={save}
          onClick={(e) => e.stopPropagation()}
          className="absolute left-0 top-full z-20 mt-1.5 flex w-52 flex-col gap-2 rounded-xl border border-border bg-surface p-3 shadow-lg"
        >
          {saved ? (
            <div className="text-xs font-medium text-emerald-600 dark:text-emerald-400">✓ {t.portfolioAddButton}</div>
          ) : (
            <>
              <label className="flex flex-col gap-1 text-xs text-muted">
                {t.portfolioQuantityLabel}
                <input
                  autoFocus
                  type="number"
                  step="any"
                  min="0"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="rounded-lg border border-border bg-background px-2 py-1 text-sm text-foreground"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs text-muted">
                {t.portfolioAvgCostLabel}
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={avgCost}
                  onChange={(e) => setAvgCost(e.target.value)}
                  className="rounded-lg border border-border bg-background px-2 py-1 text-sm text-foreground"
                />
              </label>
              <button
                type="submit"
                className="rounded-full bg-accent text-accent-foreground text-xs font-medium px-3 py-1.5 hover:opacity-90 transition-opacity"
              >
                {t.portfolioAddButton}
              </button>
            </>
          )}
        </form>
      )}
    </div>
  );
}
