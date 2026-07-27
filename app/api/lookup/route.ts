import { NextRequest, NextResponse } from "next/server";
import { lookupAsset } from "@/lib/pipeline/lookup-asset";

export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("q");
  if (!query) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 400 });
  }

  try {
    const result = await lookupAsset(query);
    const status = result.ok ? 200 : result.error === "rate_limited" ? 429 : 404;
    return NextResponse.json(result, { status });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
