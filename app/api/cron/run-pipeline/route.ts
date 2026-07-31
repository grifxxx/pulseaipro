import { NextRequest, NextResponse } from "next/server";
import { runPipeline } from "@/lib/pipeline/run-pipeline";
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
    const result = await runPipeline();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await sendTelegramAlert(`PulseAiPro: сбой пайплайна новостей (run-pipeline)\n${message}`);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
