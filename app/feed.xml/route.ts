import { getLatestArticles } from "@/lib/db/articles-queries";
import { getSignificantNotesForFeed } from "@/lib/db/queries";
import { buildRssFeed, escapeXml, toRfc822, type RssItem } from "@/lib/rss";
import { SITE_NAME, SITE_URL, truncateForDescription } from "@/lib/seo";
import type { Article, ArticleBlock, AttentionNoteRow } from "@/lib/types";

export const revalidate = 0;

const MAX_ARTICLE_ITEMS = 60;
const NOTE_WINDOW_DAYS = 14;
const NOTE_PER_DAY_LIMIT = 5;

const MARKET_CATEGORY: Record<string, string> = {
  us_stock: "Акции США",
  ru_stock: "Акции РФ",
  crypto: "Криптовалюты",
};

/** Dzen's <enclosure> only accepts JPEG/GIF/PNG — articles published before the switch away from
 * webp have no byte-length on file and get no enclosure (they still show inline images in the
 * body via content:encoded). */
function enclosureFor(url: string, bytes: number | null): RssItem["enclosure"] | undefined {
  if (bytes == null) return undefined;
  const ext = url.split(".").pop()?.toLowerCase();
  const type = ext === "jpg" || ext === "jpeg" ? "image/jpeg" : ext === "png" ? "image/png" : ext === "gif" ? "image/gif" : null;
  return type ? { url, length: bytes, type } : undefined;
}

function sourceLinkHtml(link: string): string {
  return `<p>Источник: <a href="${escapeXml(link)}">${SITE_NAME}</a></p>`;
}

function articleBlockToHtml(block: ArticleBlock): string {
  switch (block.type) {
    case "heading":
      return `<h2>${escapeXml(block.text.ru)}</h2>`;
    case "paragraph":
      return `<p>${escapeXml(block.text.ru)}</p>`;
    case "asset": {
      const changeStr =
        block.changePct != null ? ` (${block.changePct >= 0 ? "+" : ""}${block.changePct.toFixed(2)}%)` : "";
      const priceStr = block.price != null ? `${block.price} ${block.currency}${changeStr}` : "";
      return `<p><strong>${escapeXml(block.name)} (${escapeXml(block.ticker)})</strong>${
        priceStr ? `: ${escapeXml(priceStr)}` : ""
      }</p>`;
    }
    case "chart":
      return `<figure><img src="${escapeXml(block.src)}" alt="${escapeXml(
        block.caption.ru
      )}" /><figcaption>${escapeXml(block.caption.ru)}</figcaption></figure>`;
  }
}

function articleToItem(article: Article): RssItem {
  const link = `${SITE_URL}/blog/${article.slug}`;
  const bodyHtml = article.body.map(articleBlockToHtml).join("\n");
  const contentHtml = `<figure><img src="${escapeXml(article.coverImageUrl)}" alt="${escapeXml(
    article.title.ru
  )}" /></figure>\n<p>${escapeXml(article.dek.ru)}</p>\n${bodyHtml}\n${sourceLinkHtml(link)}`;

  return {
    title: article.title.ru,
    link,
    guid: `pulseaipro-article-${article.id}`,
    pubDate: toRfc822(article.publishedAt),
    contentHtml,
    category:
      article.kind === "humor"
        ? "С иронией"
        : article.market
          ? MARKET_CATEGORY[article.market] ?? "Финансы"
          : "Обзоры рынка",
    enclosure: enclosureFor(article.coverImageUrl, article.coverImageBytes),
  };
}

function noteToItem(note: AttentionNoteRow): RssItem {
  const link = `${SITE_URL}/asset/${encodeURIComponent(note.ticker)}`;
  const summary = note.summary.ru;
  const whyNotable = note.whyNotable.ru;
  const keyFacts = note.keyFacts.ru;
  const riskNotes = note.riskNotes.ru;

  const factsHtml =
    keyFacts.length > 0 ? `<ul>${keyFacts.map((f) => `<li>${escapeXml(f)}</li>`).join("")}</ul>` : "";

  const contentHtml = [
    `<p>${escapeXml(summary)}</p>`,
    `<p><strong>Почему это важно:</strong> ${escapeXml(whyNotable)}</p>`,
    factsHtml,
    riskNotes ? `<p><em>Риски: ${escapeXml(riskNotes)}</em></p>` : "",
    sourceLinkHtml(link),
  ]
    .filter(Boolean)
    .join("\n");

  const title = `${note.name} (${note.ticker}): ${truncateForDescription(summary, 90)}`;

  return {
    title,
    link,
    guid: `pulseaipro-note-${note.id}`,
    pubDate: toRfc822(note.generatedAt),
    contentHtml,
    category: MARKET_CATEGORY[note.market] ?? "Финансы",
  };
}

export async function GET() {
  const [articles, notes] = await Promise.all([
    getLatestArticles(),
    getSignificantNotesForFeed(NOTE_WINDOW_DAYS, NOTE_PER_DAY_LIMIT),
  ]);

  const items = [
    ...articles
      .filter((a) => a.kind !== "sponsored")
      .slice(0, MAX_ARTICLE_ITEMS)
      .map(articleToItem),
    ...notes.map(noteToItem),
  ].sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());

  const xml = buildRssFeed({
    title: SITE_NAME,
    link: SITE_URL,
    description:
      "PulseAiPro — автоматические статьи и самые значимые новости по акциям США, российским акциям и криптовалютам. Информационный контент, не инвестиционная рекомендация.",
    language: "ru",
    items,
  });

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
    },
  });
}
