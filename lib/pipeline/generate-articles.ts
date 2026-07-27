import { getLatestFeed } from "@/lib/db/queries";
import { insertArticle } from "@/lib/db/articles-queries";
import { generateArticleDraft } from "@/lib/llm/generate-article";
import { generateCoverImage } from "@/lib/images/cover-image";
import { uploadArticleImage } from "@/lib/storage/article-images";
import { buildChangeChartUrl } from "@/lib/datasources/quickchart";
import type { ArticleBlock, AttentionNoteRow, Market } from "@/lib/types";

const MARKETS: Market[] = ["us_stock", "ru_stock", "crypto"];

const MARKET_CHART_TITLE: Record<Market, string> = {
  us_stock: "US stocks — 24h change, %",
  ru_stock: "MOEX stocks — 24h change, %",
  crypto: "Crypto — 24h change, %",
};

const WATCHLIST_HEADING = { ru: "На что обратить внимание", en: "What to watch" };

function todaySlugDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export interface ArticleGenerationResult {
  market: Market;
  status: "created" | "skipped" | "failed";
  reason?: string;
}

async function generateOneMarketArticle(
  market: Market,
  allNotes: AttentionNoteRow[]
): Promise<ArticleGenerationResult> {
  const notes = allNotes.filter((n) => n.market === market);
  if (notes.length === 0) return { market, status: "skipped", reason: "no notes today" };

  const draft = await generateArticleDraft(market, notes);
  if (!draft || draft.sections.length === 0) {
    return { market, status: "skipped", reason: "empty draft" };
  }

  const notesByTicker = new Map(notes.map((n) => [n.ticker, n]));
  const slug = `${todaySlugDate()}-${market.replace(/_/g, "-")}`;

  const coverBytes = await generateCoverImage(draft.coverImagePrompt);
  const coverImageUrl = await uploadArticleImage(`covers/${slug}.webp`, coverBytes);

  const chartUrl = buildChangeChartUrl(
    draft.sections.map((s) => ({
      ticker: s.ticker,
      changePct: notesByTicker.get(s.ticker)?.priceSnapshot?.changePct24h ?? null,
    })),
    MARKET_CHART_TITLE[market]
  );

  const body: ArticleBlock[] = [{ type: "paragraph", text: draft.intro }];

  if (chartUrl) {
    body.push({
      type: "chart",
      src: chartUrl,
      caption: { ru: "Изменение цены за 24 часа по активам из статьи", en: "24h price change for the assets covered" },
    });
  }

  for (const section of draft.sections) {
    const note = notesByTicker.get(section.ticker);
    if (note) {
      body.push({
        type: "asset",
        ticker: note.ticker,
        name: note.name,
        market: note.market,
        logoUrl: note.logoUrl,
        price: note.priceSnapshot?.price ?? null,
        changePct: note.priceSnapshot?.changePct24h ?? null,
        currency: note.priceSnapshot?.currency ?? "USD",
      });
    }
    body.push({ type: "paragraph", text: section.paragraph });
  }

  body.push({ type: "heading", text: WATCHLIST_HEADING });
  body.push({ type: "paragraph", text: draft.watchlist });

  await insertArticle({
    market,
    slug,
    title: draft.title,
    dek: draft.dek,
    body,
    coverImageUrl,
    relatedTickers: draft.sections.map((s) => s.ticker),
  });

  return { market, status: "created" };
}

/** Generates today's 3 market articles (one per market) from the latest attention notes. Best-effort per market. */
export async function generateDailyArticles(): Promise<ArticleGenerationResult[]> {
  const allNotes = await getLatestFeed();

  const results = await Promise.all(
    MARKETS.map(async (market) => {
      try {
        return await generateOneMarketArticle(market, allNotes);
      } catch (err) {
        return {
          market,
          status: "failed" as const,
          reason: err instanceof Error ? err.message : String(err),
        };
      }
    })
  );

  return results;
}
