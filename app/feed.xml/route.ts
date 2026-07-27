import { getLatestArticles } from "@/lib/db/articles-queries";
import { getRecentNotesForFeed } from "@/lib/db/queries";
import { buildRssFeed, escapeXml, toRfc822, type RssItem } from "@/lib/rss";
import { SITE_NAME, SITE_URL, truncateForDescription } from "@/lib/seo";
import type { Article, ArticleBlock, AttentionNoteRow } from "@/lib/types";

export const revalidate = 0;

const MAX_ARTICLE_ITEMS = 60;
const MAX_NOTE_ITEMS = 150;

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
  )}" /></figure>\n<p>${escapeXml(article.dek.ru)}</p>\n${bodyHtml}`;

  return {
    title: article.title.ru,
    link,
    guid: `pulseaipro-article-${article.id}`,
    pubDate: toRfc822(article.publishedAt),
    contentHtml,
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
  };
}

export async function GET() {
  const [articles, notes] = await Promise.all([
    getLatestArticles(),
    getRecentNotesForFeed(MAX_NOTE_ITEMS),
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
      "PulseAiPro — автоматические новостные сводки и статьи по акциям США, российским акциям и криптовалютам. Информационный контент, не инвестиционная рекомендация.",
    language: "ru",
    items,
  });

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
    },
  });
}
