import { getLatestFeed } from "@/lib/db/queries";
import { insertArticle } from "@/lib/db/articles-queries";
import { generateHumorArticleDraft } from "@/lib/llm/generate-humor-article";
import { generateCoverImage } from "@/lib/images/cover-image";
import { uploadArticleImage } from "@/lib/storage/article-images";
import { buildChangeChartUrl } from "@/lib/datasources/quickchart";
import type { ArticleBlock, AttentionNoteRow } from "@/lib/types";

const CHART_TITLE = "Today's movers — 24h change, %";
const WATCHLIST_HEADING = { ru: "Что ждёт нас дальше", en: "What's next" };

function todaySlugDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export type HumorArticleResult =
  | { status: "created" }
  | { status: "skipped"; reason: string }
  | { status: "failed"; reason: string };

/** Generates the daily cross-market "ironic digest" — same real notes as the regular articles,
 * one satirical roundup spanning all three markets instead of three per-market pieces. */
export async function generateHumorArticle(): Promise<HumorArticleResult> {
  const notes: AttentionNoteRow[] = await getLatestFeed();
  if (notes.length === 0) return { status: "skipped", reason: "no notes today" };

  const draft = await generateHumorArticleDraft(notes);
  if (!draft || draft.sections.length === 0) {
    return { status: "skipped", reason: "empty draft" };
  }

  const notesByTicker = new Map(notes.map((n) => [n.ticker, n]));
  const slug = `${todaySlugDate()}-humor`;

  const coverBytes = await generateCoverImage(draft.coverImagePrompt);
  const coverImageUrl = await uploadArticleImage(`covers/${slug}.jpg`, coverBytes);

  const chartUrl = buildChangeChartUrl(
    draft.sections.map((s) => ({
      ticker: s.ticker,
      changePct: notesByTicker.get(s.ticker)?.priceSnapshot?.changePct24h ?? null,
    })),
    CHART_TITLE
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
    kind: "humor",
    market: null,
    slug,
    title: draft.title,
    dek: draft.dek,
    body,
    coverImageUrl,
    coverImageBytes: coverBytes.length,
    relatedTickers: draft.sections.map((s) => s.ticker),
  });

  return { status: "created" };
}
