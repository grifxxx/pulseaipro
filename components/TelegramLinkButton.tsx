"use client";

import { useEffect, useState } from "react";
import { getBrowserAuthClient } from "@/lib/db/supabase-browser";
import { getStrings } from "@/lib/i18n";
import type { Locale } from "@/lib/types";

const BOT_USERNAME = "pulseaipro_alerts_bot";

type LinkState = "loading" | "linked" | "not-linked";

export function TelegramLinkButton({ locale }: { locale: Locale }) {
  const t = getStrings(locale);
  const [state, setState] = useState<LinkState>("loading");
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const supabase = getBrowserAuthClient();

    supabase.auth.getUser().then(async (result) => {
      if (cancelled) return;
      const uid = result.data.user?.id ?? null;
      setUserId(uid);
      if (!uid) {
        setState("not-linked");
        return;
      }
      const { data } = await supabase.from("telegram_links").select("user_id").eq("user_id", uid).maybeSingle();
      if (!cancelled) setState(data ? "linked" : "not-linked");
    });

    return () => {
      cancelled = true;
    };
  }, []);

  async function connect() {
    if (!userId) return;
    const supabase = getBrowserAuthClient();
    const { data, error } = await supabase
      .from("telegram_link_tokens")
      .insert({ user_id: userId })
      .select("token")
      .single();
    if (error || !data) return;
    window.open(`https://t.me/${BOT_USERNAME}?start=${data.token}`, "_blank", "noopener,noreferrer");
  }

  async function disconnect() {
    if (!userId) return;
    setState("not-linked");
    const supabase = getBrowserAuthClient();
    const { error } = await supabase.from("telegram_links").delete().eq("user_id", userId);
    if (error) setState("linked");
  }

  if (state === "loading" || !userId) return null;

  return (
    <div className="rounded-xl border border-border bg-surface p-4 flex items-center justify-between gap-3 flex-wrap">
      <div>
        <div className="text-sm font-medium text-foreground">{t.telegramConnectTitle}</div>
        <p className="text-xs text-muted mt-0.5">{t.telegramConnectDesc}</p>
      </div>
      {state === "linked" ? (
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
            {t.telegramConnectedLabel}
          </span>
          <button
            type="button"
            onClick={disconnect}
            className="text-xs font-medium text-muted hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
          >
            {t.telegramDisconnectButton}
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={connect}
          className="shrink-0 rounded-full bg-accent text-accent-foreground text-xs font-medium px-4 py-2 hover:opacity-90 transition-opacity"
        >
          {t.telegramConnectButton}
        </button>
      )}
    </div>
  );
}
