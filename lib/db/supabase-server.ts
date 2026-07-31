import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/** Auth-aware Supabase client for Server Components/Route Handlers — reads the session from
 * request cookies. Cookie writes are wrapped in try/catch because Server Components can't set
 * cookies (only Route Handlers/Server Actions can); middleware.ts is what actually keeps the
 * session cookie fresh across requests. */
export async function getServerAuthClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            // Called from a Server Component — no-op, middleware refreshes the session instead.
          }
        },
      },
    }
  );
}
