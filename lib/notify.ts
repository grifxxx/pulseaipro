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
