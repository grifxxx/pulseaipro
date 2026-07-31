import { NextRequest, NextResponse } from "next/server";
import { getServerAuthClient } from "@/lib/db/supabase-server";

/** Magic-link landing page: exchanges the one-time code Supabase put in the email link for a
 * real session cookie, then redirects on to wherever the user was headed. */
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const next = req.nextUrl.searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await getServerAuthClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(new URL(next, req.url));
}
