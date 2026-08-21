"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";
import { getBrowserAuthClient } from "@/lib/db/supabase-browser";
import { getStrings } from "@/lib/i18n";
import type { Locale } from "@/lib/types";

const linkClass = "rounded-full px-1.5 sm:px-3 py-1.5 hover:bg-surface hover:text-foreground transition-colors";

export function AuthNav({ locale }: { locale: Locale }) {
  const t = getStrings(locale);
  const router = useRouter();
  // undefined = auth state not checked yet; avoids flashing "Войти" before the real state loads.
  const [email, setEmail] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    const supabase = getBrowserAuthClient();
    type GetUserResult = Awaited<ReturnType<typeof supabase.auth.getUser>>;
    supabase.auth.getUser().then((result: GetUserResult) => setEmail(result.data.user?.email ?? null));

    const { data: sub } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
      setEmail(session?.user?.email ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function signOut() {
    const supabase = getBrowserAuthClient();
    await supabase.auth.signOut();
    router.refresh();
  }

  if (email === undefined) return null;

  if (!email) {
    return (
      <Link href="/login" className={linkClass}>
        {t.navLogin}
      </Link>
    );
  }

  return (
    <>
      <Link href="/watchlist" className={linkClass}>
        {t.navWatchlist}
      </Link>
      <Link href="/portfolio" className={linkClass}>
        {t.navPortfolio}
      </Link>
      <button type="button" onClick={signOut} title={email} className={`${linkClass} text-muted`}>
        {t.logoutButton}
      </button>
    </>
  );
}
