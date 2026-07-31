import { NextRequest, NextResponse } from "next/server";
import { generateDailyArticles } from "@/lib/pipeline/generate-articles";
import { sendTelegramAlert } from "@/lib/notify";

export const maxDuration = 300;

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

  try {
    const results = await generateDailyArticles();
    const failed = results.filter((r) => r.status === "failed");
    if (failed.length > 0) {
      const detail = failed.map((r) => `${r.market}: ${r.reason ?? "unknown error"}`).join("\n");
      await sendTelegramAlert(`PulseAiPro: сбой генерации статей блога (generate-articles)\n${detail}`);
    }
    return NextResponse.json({ ok: true, results });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await sendTelegramAlert(`PulseAiPro: сбой генерации статей блога (generate-articles)\n${message}`);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
