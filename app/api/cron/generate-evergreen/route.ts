import { NextRequest, NextResponse } from "next/server";
import { generateNextEvergreenArticle } from "@/lib/pipeline/generate-evergreen";
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
    const result = await generateNextEvergreenArticle();

    if (result.status === "failed") {
      await sendTelegramAlert(
        `PulseAiPro: не удалось сгенерировать вечнозелёную статью «${result.targetQuery}»\n${result.reason ?? "unknown error"}`
      );
    }
    // An empty queue is not an error, but it does need a human: nothing will publish until
    // somebody adds topics, and silence would look identical to normal operation.
    if (result.status === "skipped") {
      await sendTelegramAlert(`PulseAiPro: очередь вечнозелёных тем пуста — статьи больше не выходят.`);
    }

    return NextResponse.json({ ok: result.status !== "failed", result });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await sendTelegramAlert(`PulseAiPro: сбой генерации вечнозелёной статьи\n${message}`);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
