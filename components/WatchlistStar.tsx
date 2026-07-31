"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getBrowserAuthClient } from "@/lib/db/supabase-browser";
import { getStrings } from "@/lib/i18n";
import type { Locale } from "@/lib/types";

type StarState = "loading" | "in" | "out";

export function WatchlistStar({ assetId, locale }: { assetId: string; locale: Locale }) {
  const t = getStrings(locale);
  const router = useRouter();
  const [state, setState] = useState<StarState>("loading");
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const supabase = getBrowserAuthClient();
    type GetUserResult = Awaited<ReturnType<typeof supabase.auth.getUser>>;

    supabase.auth.getUser().then((result: GetUserResult) => {
      if (cancelled) return;
      const uid = result.data.user?.id ?? null;
      setUserId(uid);
      if (!uid) {
        setState("out");
        return;
      }
      const query = supabase
        .from("user_watchlist")
        .select("asset_id")
        .eq("user_id", uid)
        .eq("asset_id", assetId)
        .maybeSingle();
      query.then((rowResult: Awaited<typeof query>) => {
        if (!cancelled) setState(rowResult.data ? "in" : "out");
      });
    });

    return () => {
      cancelled = true;
    };
  }, [assetId]);

  async function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    if (!userId) {
      router.push(`/login?next=${encodeURIComponent(window.location.pathname)}`);
      return;
    }

    const supabase = getBrowserAuthClient();
    if (state === "in") {
      setState("out");
      const { error } = await supabase
        .from("user_watchlist")
        .delete()
        .eq("user_id", userId)
        .eq("asset_id", assetId);
      if (error) setState("in");
    } else {
      setState("in");
      const { error } = await supabase.from("user_watchlist").insert({ user_id: userId, asset_id: assetId });
      if (error) setState("out");
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={state === "in" ? t.watchlistStarRemove : t.watchlistStarAdd}
      title={state === "in" ? t.watchlistStarRemove : t.watchlistStarAdd}
      className={`text-lg leading-none transition-colors ${
        state === "in" ? "text-amber-500" : "text-muted hover:text-amber-500"
      }`}
    >
      {state === "in" ? "★" : "☆"}
    </button>
  );
}
