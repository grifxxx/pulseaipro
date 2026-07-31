import { NextRequest, NextResponse } from "next/server";
import { generateRetrospectiveArticle } from "@/lib/pipeline/generate-retrospective-article";
import { sendTelegramAlert } from "@/lib/notify";
import type { RetrospectivePeriod } from "@/lib/types";

export const maxDuration = 120;

const VALID_PERIODS: RetrospectivePeriod[] = ["weekly", "monthly", "semiannual", "yearly"];

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = req.headers.get("authorization");
  return header === `Bearer ${secret}`;
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const period = req.nextUrl.searchParams.get("period") as RetrospectivePeriod | null;
  if (!period || !VALID_PERIODS.includes(period)) {
    return NextResponse.json(
      { ok: false, error: `period must be one of: ${VALID_PERIODS.join(", ")}` },
      { status: 400 }
    );
  }

  try {
    const result = await generateRetrospectiveArticle(period);
    return NextResponse.json({ ok: true, result });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await sendTelegramAlert(`PulseAiPro: сбой генерации ретроспективы (${period})\n${message}`);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
