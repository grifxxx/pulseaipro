// One-off script: generates a cover image and inserts the "Автоследование Т-Банк" sponsored
// explainer article. Run with: node scripts/publish-tbank-autofollow-article.mjs
// Requires migration 0007_sponsored_articles.sql to already be applied (kind = 'sponsored').

import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

function loadEnvLocal(url) {
  const content = readFileSync(url, "utf8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}

loadEnvLocal(new URL("../.env.local", import.meta.url));

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const openaiKey = process.env.OPENAI_API_KEY;
if (!supabaseUrl || !serviceKey) throw new Error("Missing Supabase env vars in .env.local");
if (!openaiKey) throw new Error("Missing OPENAI_API_KEY in .env.local");

const db = createClient(supabaseUrl, serviceKey);
const openai = new OpenAI({ apiKey: openaiKey });

const SLUG = "avtosledovanie-tbank-obzor";

const title = {
  ru: "Автоследование Т-Банк: как работает копитрейдинг и что нужно знать перед подключением",
  en: "T-Bank Copy Trading (Автоследование): How It Works and What to Know Before Joining",
};

const dek = {
  ru: "Разбираем, как устроено автоследование в Т-Инвестициях, сколько это может стоить, какие есть риски и кому эта услуга подходит.",
  en: "A plain-language look at T-Bank's copy-trading service — how it works, typical costs, the real risks, and who it's actually for.",
};

const bodyRu = [
  {
    type: "paragraph",
    text: "Автоследование — один из самых обсуждаемых сервисов на российском брокерском рынке: он обещает торговать «как профи», даже если вы никогда не открывали терминал. Разбираемся, как это устроено технически, где заканчивается маркетинг и начинается реальный механизм, и какие вопросы стоит задать себе перед подключением.",
  },
  { type: "heading", text: "Что такое автоследование" },
  {
    type: "paragraph",
    text: "Автоследование (копитрейдинг) — это сервис, при котором сделки выбранного автора стратегии автоматически и пропорционально повторяются на вашем собственном брокерском счёте. Вы не отдаёте деньги в управление третьему лицу — активы всё время остаются на вашем счёте, вы просто разрешаете системе копировать конкретные сделки в выбранном вами объёме.",
  },
  { type: "heading", text: "Как это работает технически" },
  {
    type: "paragraph",
    text: "Обычно процесс выглядит так: вы выбираете стратегию из каталога — у каждой есть публичная статистика по доходности, просадкам и риск-профилю за прошлые периоды. Затем вы выделяете сумму, которую готовы направить на копирование, и подключаетесь. Дальше каждая сделка автора стратегии автоматически масштабируется под ваш объём и исполняется на вашем счёте. Отключиться, поставить на паузу или изменить сумму можно в любой момент — это не долгосрочное обязательство.",
  },
  { type: "heading", text: "Иллюстративный пример (вымышленный, не реальный случай)" },
  {
    type: "paragraph",
    text: "Чтобы было понятнее, разберём условный пример — это не реальный человек и не гарантия результата, а просто иллюстрация механики. Представим, что читатель выделил на копирование одной из стратегий 50 000 ₽. В первый месяц стратегия показала рост на 4%, и на счёте стало 52 000 ₽ без учёта комиссий. Во второй месяц рынок развернулся, стратегия ушла в просадку на 6%, и баланс снизился до 48 880 ₽. Это нормальная механика любой торговой стратегии: доходность и просадки чередуются, и по одной удачной неделе нельзя судить о результате на годы вперёд.",
  },
  { type: "heading", text: "Комиссии и минимальная сумма" },
  {
    type: "paragraph",
    text: "Как правило, площадки берут либо процент от прибыли за успешный период (так называемая success fee), либо фиксированную комиссию за подписку на стратегию — иногда оба варианта сразу. Минимальная сумма для подключения к конкретной стратегии тоже варьируется. Условия периодически меняются, поэтому точные цифры по каждой стратегии стоит смотреть непосредственно в приложении Т-Банка перед подключением, а не ориентироваться на цифры из статей в интернете.",
  },
  { type: "heading", text: "Плюсы и минусы" },
  { type: "paragraph", text: "Плюс: не нужно самостоятельно анализировать рынок и держать позиции под контролем — за вас это делает выбранная стратегия." },
  { type: "paragraph", text: "Плюс: активы остаются на вашем счёте, а не переводятся в чужое управление; отключиться можно в любой момент." },
  { type: "paragraph", text: "Минус: прошлая доходность стратегии ничего не гарантирует — рынок может развернуться уже на следующий день после вашего подключения." },
  { type: "paragraph", text: "Минус: при масштабировании сделок под небольшую сумму возможны отклонения от точной пропорции из‑за лотности и ликвидности инструментов — итоговый результат может немного отличаться от результата автора стратегии." },
  { type: "heading", text: "Кому подходит, а кому — нет" },
  {
    type: "paragraph",
    text: "Автоследование может быть интересно тем, у кого нет времени самостоятельно следить за рынком, но кто готов принять инвестиционный риск и не рассчитывает на гарантированный доход. Это не подходит тем, кому деньги могут понадобиться в ближайшей перспективе, и тем, кто психологически не готов пережить отрицательные периоды — а они будут практически у любой стратегии.",
  },
  { type: "heading", text: "Главное о рисках" },
  {
    type: "paragraph",
    text: "Автоследование — это инвестиционная услуга, а не индивидуальная инвестиционная рекомендация и не гарантия дохода. Результаты стратегии в прошлом не определяют её результаты в будущем. Стоимость активов может как расти, так и снижаться, вплоть до потери части вложенных средств. Перед подключением к любой стратегии изучите её полную статистику, размер комиссий и историю просадок в приложении Т-Банка.",
  },
  { type: "heading", text: "Как подключить" },
  {
    type: "paragraph",
    text: "Автоследование доступно в приложении Т-Банка тем, у кого открыт брокерский счёт: остаётся выбрать стратегию в каталоге, изучить её статистику и подключить перевод части портфеля на копирование.",
  },
];

const bodyEn = [
  {
    type: "paragraph",
    text: "Copy trading — sold under the Russian name «автоследование» — is one of the most talked-about features on Russian brokerage platforms: automatically mirroring an experienced trader's positions without you touching a trading terminal yourself. Here's a plain-language look at the mechanics, typical costs, and the risks worth understanding before signing up.",
  },
  { type: "heading", text: "What copy trading actually is" },
  {
    type: "paragraph",
    text: "Copy trading is a service where a chosen strategy author's trades are automatically and proportionally mirrored in your own brokerage account. Your assets stay in your own account the whole time — you're not handing money to someone else to manage, you're just authorizing the system to replicate specific trades at a size you choose.",
  },
  { type: "heading", text: "How it works, mechanically" },
  {
    type: "paragraph",
    text: "You pick a strategy from a catalog — each one comes with public track-record statistics: past returns, drawdowns, and a risk profile. You then allocate an amount you're comfortable committing, and the platform scales the strategy author's trades to match your allocation and executes them in your account. You can pause, resize, or disconnect at any time — it isn't a long-term commitment.",
  },
  { type: "heading", text: "An illustrative example (not a real person, no promised outcome)" },
  {
    type: "paragraph",
    text: "To make the mechanics concrete — this is a made-up illustration, not a real case or a promised result. Imagine a reader who allocates 50,000 rubles to a chosen strategy. In month one the strategy is up 4%, bringing the balance to 52,000 rubles before fees. In month two the market turns and the strategy draws down 6%, taking the balance to 48,880 rubles. That back-and-forth is normal for any trading strategy — one good week says nothing about the years ahead.",
  },
  { type: "heading", text: "Fees and minimums" },
  {
    type: "paragraph",
    text: "Platforms typically charge either a performance/success fee on profitable periods, a flat subscription fee per strategy, or both. Minimums vary by strategy and change over time, so check the current terms for a specific strategy directly in the T-Bank app before committing — not from numbers in an article.",
  },
  { type: "heading", text: "Pros and cons" },
  { type: "paragraph", text: "Pro: you don't have to analyze the market or manage positions yourself — the chosen strategy does that." },
  { type: "paragraph", text: "Pro: assets stay in your own account rather than being handed to someone else to manage, and you can disconnect any time." },
  { type: "paragraph", text: "Con: past performance guarantees nothing — the market can turn the day after you join." },
  { type: "paragraph", text: "Con: scaling trades to a small allocation can cause minor deviations from the strategy author's exact results, due to lot sizes and liquidity." },
  { type: "heading", text: "Who it's for — and who it isn't" },
  {
    type: "paragraph",
    text: "Copy trading can make sense for people who don't have time to watch the market themselves but accept investment risk and don't expect guaranteed returns. It's not a fit for money you'll need soon, or for anyone who can't tolerate a losing stretch — which happens to virtually every strategy at some point.",
  },
  { type: "heading", text: "The risk disclosure that matters most" },
  {
    type: "paragraph",
    text: "Copy trading is an investment service, not individualized investment advice, and not a guarantee of profit. A strategy's past results don't determine its future ones. Asset values can rise or fall, including the possibility of losing part of the amount invested. Review a strategy's full statistics, fees, and drawdown history in the T-Bank app before connecting to it.",
  },
  { type: "heading", text: "How to get started" },
  {
    type: "paragraph",
    text: "Copy trading is available in the T-Bank app to anyone with a brokerage account open: browse the strategy catalog, review the statistics, and allocate part of your portfolio to follow one.",
  },
];

if (bodyRu.length !== bodyEn.length) throw new Error("RU/EN body block count mismatch");
const body = bodyRu.map((b, i) => ({ type: b.type, text: { ru: b.text, en: bodyEn[i].text } }));

async function main() {
  console.log("Generating cover image...");
  const imageModel = process.env.OPENAI_IMAGE_MODEL ?? "gpt-image-2";
  const imgRes = await openai.images.generate({
    model: imageModel,
    prompt:
      "Editorial abstract illustration representing automated investing and copy trading: flowing golden and teal light trails connecting nodes in a network, a subtle upward trend motif, clean modern fintech aesthetic, soft gradient background. No text, no numbers, no logos, no readable charts.",
    size: "1536x1024",
    quality: "medium",
    output_format: "webp",
    n: 1,
  });
  const b64 = imgRes.data?.[0]?.b64_json;
  if (!b64) throw new Error("Image generation returned no data");
  const bytes = Buffer.from(b64, "base64");

  console.log("Uploading cover image...");
  const path = `covers/${SLUG}.webp`;
  const { error: upErr } = await db.storage.from("article-images").upload(path, bytes, {
    contentType: "image/webp",
    upsert: true,
  });
  if (upErr) throw new Error(`upload failed: ${upErr.message}`);
  const { data: pub } = db.storage.from("article-images").getPublicUrl(path);
  const coverImageUrl = pub.publicUrl;

  console.log("Inserting article row...");
  const { error: insErr } = await db.from("articles").upsert(
    {
      kind: "sponsored",
      market: null,
      period: null,
      slug: SLUG,
      title,
      dek,
      body,
      cover_image_url: coverImageUrl,
      related_tickers: [],
      published_at: new Date().toISOString(),
    },
    { onConflict: "slug" }
  );
  if (insErr) throw new Error(`insert failed: ${insErr.message}`);

  console.log("Done.");
  console.log("Slug:", SLUG);
  console.log("Cover:", coverImageUrl);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
