import { NextRequest, NextResponse } from "next/server";
import { getLatestFeed } from "@/lib/db/queries";
import { postNotableNotesToChannel } from "@/lib/notify";
import { SITE_URL } from "@/lib/seo";

// Temporary: verifies postNotableNotesToChannel against real, already-generated notes (no new
// LLM call) without needing a fresh pipeline run. Remove after verification.

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const notes = await getLatestFeed();
  const notable = notes.filter((n) => Math.abs(n.sentimentScore) >= 0.5).slice(0, 1);

  await postNotableNotesToChannel(
    notable.map((n) => ({
      ticker: n.ticker,
      name: n.name,
      sentiment: n.sentiment,
      sentimentScore: n.sentimentScore,
      summary: n.summary.ru,
      url: `${SITE_URL}/asset/${encodeURIComponent(n.ticker)}`,
    }))
  );

  return NextResponse.json({ ok: true, posted: notable.map((n) => n.ticker) });
}
