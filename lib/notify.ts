import { SITE_URL } from "@/lib/seo";

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

const SENTIMENT_EMOJI: Record<string, string> = {
  bullish: "📈",
  bearish: "📉",
  mixed: "🔀",
  neutral: "➖",
};

/** What it takes for an asset to earn a line in the daily digest. A note has to clear one of these
 * on its own — a strong news signal, or a move large enough that a reader would have noticed it
 * anyway. Both bars are deliberately high. The channel used to get one message per notable note,
 * which measured out at 7-16 messages a day and read as spam. */
const DIGEST_MIN_SENTIMENT = 0.6;
const DIGEST_MIN_CHANGE_PCT = 7;
/** Lines in one digest: enough to be worth opening, short enough to read at a glance. */
const DIGEST_MAX_ITEMS = 3;

export interface ChannelNote {
  ticker: string;
  name: string;
  sentiment: string;
  sentimentScore: number;
  changePct: number | null;
  summary: string;
  url: string;
}

/** Ranks by news strength plus how far the price actually moved, with the price term capped so
 * one wild micro-cap cannot crowd out a genuinely important story. */
function digestScore(note: ChannelNote): number {
  const move = note.changePct == null ? 0 : Math.min(Math.abs(note.changePct) / 10, 1);
  return Math.abs(note.sentimentScore) + move;
}

function qualifies(note: ChannelNote): boolean {
  return (
    Math.abs(note.sentimentScore) >= DIGEST_MIN_SENTIMENT ||
    (note.changePct != null && Math.abs(note.changePct) >= DIGEST_MIN_CHANGE_PCT)
  );
}

/** Posts one digest of the day's most significant assets — a single message, not one per note.
 *
 * Called once a day (see isFirstRunOfDay in lib/db/queries.ts), and only when something actually
 * cleared the bar: a quiet day gets no post at all rather than filler. Together with the article
 * announcements that comes to roughly ten messages a week, which is what a channel worth staying
 * subscribed to looks like. Best-effort — a failed post never breaks the pipeline run. */
export async function postDailyDigestToChannel(notes: ChannelNote[]): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHANNEL_CHAT_ID;
  if (!token || !chatId) {
    console.error("postDailyDigestToChannel: TELEGRAM_BOT_TOKEN or TELEGRAM_CHANNEL_CHAT_ID not set; skipping");
    return;
  }

  const picked = notes
    .filter(qualifies)
    .sort((a, b) => digestScore(b) - digestScore(a))
    .slice(0, DIGEST_MAX_ITEMS);
  if (picked.length === 0) return;

  const lines = picked.map((note) => {
    const emoji = SENTIMENT_EMOJI[note.sentiment] ?? "📊";
    const move =
      note.changePct == null
        ? ""
        : ` ${note.changePct >= 0 ? "+" : "−"}${Math.abs(note.changePct).toFixed(1)}%`;
    return `${emoji} <b>${escapeHtml(note.name)} (${escapeHtml(note.ticker)})</b>${move}\n${escapeHtml(
      truncate(note.summary, 280)
    )}\n<a href="${note.url}">Подробнее</a>`;
  });

  const text = `📊 <b>Главное за день</b>\n\n${lines.join("\n\n")}\n\nВся лента: ${SITE_URL}/feed`;

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) {
      console.error(`postDailyDigestToChannel: Telegram API returned ${res.status}: ${await res.text().catch(() => "")}`);
    }
  } catch (err) {
    console.error("postDailyDigestToChannel: request failed", err instanceof Error ? err.message : err);
  }
}

// Different chat_ids aren't subject to Telegram's per-chat throttling as strictly as the
// channel is, but a small delay keeps a big watchlist-notify burst well under the global
// ~30 msg/sec limit.
const WATCHLIST_NOTIFY_DELAY_MS = 400;

export interface WatchlistNotification {
  chatId: number;
  ticker: string;
  name: string;
  sentiment: string;
  summary: string;
  url: string;
}

async function sendWatchlistNotification(n: WatchlistNotification): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return;

  const emoji = SENTIMENT_EMOJI[n.sentiment] ?? "📊";
  const text = `${emoji} <b>${escapeHtml(n.name)} (${escapeHtml(n.ticker)})</b>\n\n${escapeHtml(
    truncate(n.summary, 600)
  )}\n\n${n.url}`;

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: n.chatId, text, parse_mode: "HTML" }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) {
      console.error(`sendWatchlistNotification: Telegram API returned ${res.status}: ${await res.text().catch(() => "")}`);
    }
  } catch (err) {
    console.error("sendWatchlistNotification: request failed", err instanceof Error ? err.message : err);
  }
}

/** DMs every user who has this asset in their "Избранное" watchlist and has linked Telegram —
 * unlike the public channel, there's no threshold here: the user chose this specific ticker, so
 * every note about it is relevant to them. Best-effort per recipient. */
export async function notifyWatchlistUsers(notifications: WatchlistNotification[]): Promise<void> {
  for (const n of notifications) {
    await sendWatchlistNotification(n);
    await new Promise((resolve) => setTimeout(resolve, WATCHLIST_NOTIFY_DELAY_MS));
  }
}

export interface PriceAlertNotification {
  chatId: number;
  ticker: string;
  name: string;
  changePct: number;
  price: number;
  currency: string;
  url: string;
}

async function sendSinglePriceAlert(n: PriceAlertNotification): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return;

  const arrow = n.changePct >= 0 ? "🚀" : "🔻";
  const sign = n.changePct >= 0 ? "+" : "";
  const text = `${arrow} <b>${escapeHtml(n.name)} (${escapeHtml(n.ticker)})</b>: ${sign}${n.changePct.toFixed(
    2
  )}% за 24 часа\n\nТекущая цена: ${n.price} ${n.currency}\n\n${n.url}`;

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: n.chatId, text, parse_mode: "HTML" }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) {
      console.error(`sendSinglePriceAlert: Telegram API returned ${res.status}: ${await res.text().catch(() => "")}`);
    }
  } catch (err) {
    console.error("sendSinglePriceAlert: request failed", err instanceof Error ? err.message : err);
  }
}

/** DMs users whose watchlist asset crossed the price-move threshold this run — cooldown-gated
 * per user+asset by the caller (lib/db/queries.ts) so a price that stays elevated across many
 * pipeline runs doesn't re-alert every run. */
export async function sendPriceAlerts(notifications: PriceAlertNotification[]): Promise<void> {
  for (const n of notifications) {
    await sendSinglePriceAlert(n);
    await new Promise((resolve) => setTimeout(resolve, WATCHLIST_NOTIFY_DELAY_MS));
  }
}
