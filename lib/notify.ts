/** Sends a plain-text alert to the site owner's Telegram via a bot. Best-effort — a failed
 * notification is logged, never thrown, so alerting itself can never break a cron run. */
export async function sendTelegramAlert(message: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_ALERT_CHAT_ID;
  if (!token || !chatId) {
    console.error("sendTelegramAlert: TELEGRAM_BOT_TOKEN or TELEGRAM_ALERT_CHAT_ID not set; skipping alert");
    return;
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: message, disable_web_page_preview: true }),
    });
    if (!res.ok) {
      console.error(`sendTelegramAlert: Telegram API returned ${res.status}: ${await res.text()}`);
    }
  } catch (err) {
    console.error("sendTelegramAlert: request failed", err);
  }
}

const MARKET_EMOJI: Record<string, string> = {
  us_stock: "🇺🇸",
  ru_stock: "🇷🇺",
  crypto: "₿",
};

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

export interface ChannelArticle {
  market: string | null;
  title: string;
  dek: string;
  url: string;
  coverImageUrl: string;
}

/** Posts a new article to the public announcement channel (cover image + title + dek + link).
 * Best-effort and capped at 8s like submitToIndexNow — a slow/failed post must never stall or
 * fail the pipeline run that just published the article. */
export async function postArticleToChannel(article: ChannelArticle): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHANNEL_CHAT_ID;
  if (!token || !chatId) {
    console.error("postArticleToChannel: TELEGRAM_BOT_TOKEN or TELEGRAM_CHANNEL_CHAT_ID not set; skipping");
    return;
  }

  const emoji = (article.market && MARKET_EMOJI[article.market]) || "📊";
  const titleLine = `${emoji} <b>${escapeHtml(article.title)}</b>`;
  let caption = `${titleLine}\n\n${escapeHtml(truncate(article.dek, 300))}\n\n${article.url}`;
  if (caption.length > 1024) caption = `${titleLine}\n\n${article.url}`;

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        photo: article.coverImageUrl,
        caption,
        parse_mode: "HTML",
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) {
      console.error(`postArticleToChannel: Telegram API returned ${res.status}: ${await res.text().catch(() => "")}`);
    }
  } catch (err) {
    console.error("postArticleToChannel: request failed", err instanceof Error ? err.message : err);
  }
}
