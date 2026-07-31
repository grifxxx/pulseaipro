"use client";

import { createBrowserClient } from "@supabase/ssr";

let client: ReturnType<typeof createBrowserClient> | null = null;

/** Auth-aware Supabase client for Client Components — shares the session cookie set by
 * middleware.ts, so signInWithOtp/signOut/getUser all stay in sync with the server. */
export function getBrowserAuthClient() {
  if (!client) {
    client = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return client;
}
