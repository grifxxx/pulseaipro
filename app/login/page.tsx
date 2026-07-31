"use client";

import { useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { getBrowserAuthClient } from "@/lib/db/supabase-browser";
import { getStrings } from "@/lib/i18n";
import type { Locale } from "@/lib/types";

// Client component, so locale comes from navigator.language rather than the Accept-Language
// header used elsewhere — good enough for a single small form.
function detectLocale(): Locale {
  if (typeof navigator === "undefined") return "en";
  return navigator.language.toLowerCase().startsWith("ru") ? "ru" : "en";
}

export default function LoginPage() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/";
  const locale = detectLocale();
  const t = getStrings(locale);

  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">("idle");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus("loading");
    const supabase = getBrowserAuthClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
    setStatus(error ? "error" : "sent");
  }

  return (
    <div className="max-w-sm mx-auto px-4 sm:px-6 py-16 flex flex-col gap-4">
      <h1 className="text-2xl font-bold tracking-tight">{t.loginTitle}</h1>
      <p className="text-sm text-muted">{t.loginSubtitle}</p>

      {status === "sent" ? (
        <p className="text-sm text-emerald-600 dark:text-emerald-400">{t.loginSent}</p>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t.loginEmailPlaceholder}
            className="rounded-full border border-border bg-surface px-4 py-2 text-sm outline-none focus:border-accent transition-colors"
          />
          <button
            type="submit"
            disabled={status === "loading"}
            className="rounded-full bg-accent px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {status === "loading" ? t.loginSending : t.loginButton}
          </button>
          {status === "error" && (
            <p className="text-sm text-rose-600 dark:text-rose-400">{t.loginError}</p>
          )}
        </form>
      )}
    </div>
  );
}
