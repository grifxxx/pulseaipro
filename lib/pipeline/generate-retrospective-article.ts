import { getNotesInRange } from "@/lib/db/queries";
import { insertArticle } from "@/lib/db/articles-queries";
import { generateRetrospectiveDraft, type PeriodAssetSummary } from "@/lib/llm/generate-retrospective";
import { generateCoverImage } from "@/lib/images/cover-image";
import { uploadArticleImage } from "@/lib/storage/article-images";
import { buildChangeChartUrl } from "@/lib/datasources/quickchart";
import type { ArticleBlock, AttentionNoteRow, RetrospectivePeriod } from "@/lib/types";

const PERIOD_DAYS: Record<RetrospectivePeriod, number> = {
  weekly: 7,
  monthly: 30,
  semiannual: 182,
  yearly: 365,
};

const PERIOD_CHART_TITLE: Record<RetrospectivePeriod, string> = {
  weekly: "Weekly review — period change, %",
  monthly: "Monthly review — period change, %",
  semiannual: "6-month review — period change, %",
  yearly: "Yearly review — period change, %",
};

const SUMMARY_HEADING = { ru: "Итоги периода", en: "Period summary" };

const MAX_ASSETS = 8;
const MIN_ASSETS = 3;

function aggregateByTicker(notes: AttentionNoteRow[]): PeriodAssetSummary[] {
  const byTicker = new Map<string, AttentionNoteRow[]>();
  for (const n of notes) {
    const list = byTicker.get(n.ticker) ?? [];
    list.push(n);
    byTicker.set(n.ticker, list);
  }

  const summaries: PeriodAssetSummary[] = [];
  for (const group of byTicker.values()) {
    const withPrice = group.filter((n) => n.priceSnapshot != null);
    const first = withPrice[0];
    const last = withPrice[withPrice.length - 1];
    const firstPrice = first?.priceSnapshot?.price ?? null;
    const lastPrice = last?.priceSnapshot?.price ?? null;
    const periodChangePct =
      firstPrice != null && lastPrice != null && firstPrice !== 0
        ? ((lastPrice - firstPrice) / firstPrice) * 100
        : null;

    const latest = group[group.length - 1];
    const highlights = group.slice(-5).map((n) => ({
      date: n.generatedAt.slice(0, 10),
      text: n.whyNotable.en,
    }));

    summaries.push({
      ticker: latest.ticker,
      name: latest.name,
      market: latest.market,
      logoUrl: latest.logoUrl,
      currency: last?.priceSnapshot?.currency ?? first?.priceSnapshot?.currency ?? "USD",
      firstPrice,
      lastPrice,
      periodChangePct,
      noteCount: group.length,
      highlights,
    });
  }

  return summaries;
}

function selectFeatured(summaries: PeriodAssetSummary[]): PeriodAssetSummary[] {
  return [...summaries]
    .sort((a, b) => {
      if (b.noteCount !== a.noteCount) return b.noteCount - a.noteCount;
      return Math.abs(b.periodChangePct ?? 0) - Math.abs(a.periodChangePct ?? 0);
    })
    .slice(0, MAX_ASSETS);
}

export type RetrospectiveResult =
  | { period: RetrospectivePeriod; status: "created" }
  | { period: RetrospectivePeriod; status: "skipped"; reason: string };

export async function generateRetrospectiveArticle(
  period: RetrospectivePeriod
): Promise<RetrospectiveResult> {
  const days = PERIOD_DAYS[period];
  const to = new Date();
  const from = new Date(to.getTime() - days * 24 * 60 * 60 * 1000);

  const notes = await getNotesInRange(from.toISOString(), to.toISOString());
  const summaries = aggregateByTicker(notes);
  const featured = selectFeatured(summaries);

  if (featured.length < MIN_ASSETS) {
    return { period, status: "skipped", reason: "not enough period data yet" };
  }

  const draft = await generateRetrospectiveDraft(period, featured);
  if (!draft || draft.sections.length === 0) {
    return { period, status: "skipped", reason: "empty draft" };
  }

  const featuredByTicker = new Map(featured.map((a) => [a.ticker, a]));
  const dateStamp = to.toISOString().slice(0, 10);
  const slug = `${period}-review-${dateStamp}`;

  const coverBytes = await generateCoverImage(draft.coverImagePrompt);
  const coverImageUrl = await uploadArticleImage(`covers/${slug}.webp`, coverBytes);

  const chartUrl = buildChangeChartUrl(
    draft.sections.map((s) => ({
      ticker: s.ticker,
      changePct: featuredByTicker.get(s.ticker)?.periodChangePct ?? null,
    })),
    PERIOD_CHART_TITLE[period]
  );

  const body: ArticleBlock[] = [{ type: "paragraph", text: draft.intro }];

  if (chartUrl) {
    body.push({
      type: "chart",
      src: chartUrl,
      caption: {
        ru: "Изменение цены за период по активам из обзора",
        en: "Period price change for the assets covered",
      },
    });
  }

  for (const section of draft.sections) {
    const asset = featuredByTicker.get(section.ticker);
    if (asset) {
      body.push({
        type: "asset",
        ticker: asset.ticker,
        name: asset.name,
        market: asset.market,
        logoUrl: asset.logoUrl,
        price: asset.lastPrice,
        changePct: asset.periodChangePct,
        currency: asset.currency,
      });
    }
    body.push({ type: "paragraph", text: section.paragraph });
  }

  body.push({ type: "heading", text: SUMMARY_HEADING });
  body.push({ type: "paragraph", text: draft.summary });

  await insertArticle({
    kind: "retrospective",
    period,
    market: null,
    slug,
    title: draft.title,
    dek: draft.dek,
    body,
    coverImageUrl,
    relatedTickers: draft.sections.map((s) => s.ticker),
  });

  return { period, status: "created" };
}
