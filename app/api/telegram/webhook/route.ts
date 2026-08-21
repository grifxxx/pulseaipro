import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/db/supabase-client";

// How long a /start <token> deep link stays valid before the user has to generate a new one.
const TOKEN_MAX_AGE_MS = 30 * 60 * 1000;

const START_TOKEN_RE = /^\/start\s+([0-9a-f-]{36})/i;

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!secret) return false;
  return req.headers.get("x-telegram-bot-api-secret-token") === secret;
}

async function sendMessage(chatId: number, text: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return;
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) console.error(`telegram webhook sendMessage: ${res.status} ${await res.text().catch(() => "")}`);
  } catch (err) {
    console.error("telegram webhook sendMessage failed:", err instanceof Error ? err.message : err);
  }
}

/** Handles updates from the pulseaipro_alerts_bot webhook — currently just the account-linking
 * /start <token> deep link opened from the "Избранное" page. Best-effort: Telegram retries
 * webhook deliveries on non-2xx, so real errors still return 200 to avoid a retry storm once
 * we've already decided the update isn't actionable. */
export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const update = await req.json().catch(() => null);
  const message = update?.message;
  const text: string | undefined = message?.text;
  const chatId: number | undefined = message?.chat?.id;

  if (!text || !chatId) return NextResponse.json({ ok: true });

  const match = text.match(START_TOKEN_RE);
  if (!match) {
    await sendMessage(
      chatId,
      "Привет! Чтобы подключить уведомления по избранным активам, зайди на pulsaipro.ru → «Избранное» и нажми «Подключить Telegram»."
    );
    return NextResponse.json({ ok: true });
  }

  const token = match[1];
  const db = getServiceClient();
  const { data: tokenRow } = await db
    .from("telegram_link_tokens")
    .select("user_id, created_at")
    .eq("token", token)
    .maybeSingle();

  const isExpired = !tokenRow || Date.now() - new Date(tokenRow.created_at as string).getTime() > TOKEN_MAX_AGE_MS;
  if (isExpired) {
    await sendMessage(chatId, "Ссылка устарела. Вернись на pulsaipro.ru → «Избранное» и получи новую.");
    return NextResponse.json({ ok: true });
  }

  await db.from("telegram_links").upsert({ user_id: tokenRow.user_id, chat_id: chatId });
  await db.from("telegram_link_tokens").delete().eq("token", token);
  await sendMessage(
    chatId,
    "Готово! Теперь здесь будут приходить уведомления, когда выходит новость по активу из твоего избранного на PulseAiPro."
  );

  return NextResponse.json({ ok: true });
}
