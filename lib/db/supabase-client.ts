import { createClient, SupabaseClient } from "@supabase/supabase-js";

let publicClient: SupabaseClient | null = null;
let serviceClient: SupabaseClient | null = null;

/** Anon-key client for read-only queries (safe to use from server components). */
export function getPublicClient(): SupabaseClient {
  if (!publicClient) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) throw new Error("Supabase public env vars are not set");
    publicClient = createClient(url, key);
  }
  return publicClient;
}

/** Service-role client — server-only, bypasses RLS. Never import this into client components. */
export function getServiceClient(): SupabaseClient {
  if (!serviceClient) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) throw new Error("Supabase service-role env vars are not set");
    serviceClient = createClient(url, key);
  }
  return serviceClient;
}
