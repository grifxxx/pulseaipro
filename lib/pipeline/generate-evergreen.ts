import { getLatestArticles, insertArticle } from "@/lib/db/articles-queries";
import { generateEvergreenDraft } from "@/lib/llm/generate-evergreen";
import { generateCoverImage } from "@/lib/images/cover-image";
import { uploadArticleImage } from "@/lib/storage/article-images";
import { EVERGREEN_TOPICS, type EvergreenTopic } from "@/lib/content/evergreen-topics";
import type { ArticleBlock } from "@/lib/types";

export interface EvergreenGenerationResult {
  status: "created" | "skipped" | "failed";
  slug?: string;
  targetQuery?: string;
  reason?: string;
}

/** The first topic in the queue that hasn't been published yet. The queue is ordered, so this is
 * simply "the next one" — publishing order is an editorial decision made in the topics file, not
 * something the cron should be guessing at. */
export async function nextUnpublishedTopic(): Promise<EvergreenTopic | null> {
  const published = new Set((await getLatestArticles()).map((a) => a.slug));
  return EVERGREEN_TOPICS.find((t) => !published.has(t.slug)) ?? null;
}

function draftToBlocks(draft: Awaited<ReturnType<typeof generateEvergreenDraft>>): ArticleBlock[] {
  const body: ArticleBlock[] = [{ type: "paragraph", text: draft.lead }];

  for (const section of draft.sections) {
    body.push({ type: "heading", text: section.heading });
    for (const paragraph of section.paragraphs) {
      body.push({ type: "paragraph", text: paragraph });
    }
    // Fixed order within a section: prose sets up the facts, the list or table lays them out,
    // and the callout is the thing to remember on the way out.
    if (section.list) {
      body.push({ type: "list", ordered: section.list.ordered, items: section.list.items });
    }
    if (section.table) {
      body.push({
        type: "table",
        caption: section.table.caption,
        columns: section.table.columns,
        rows: section.table.rows,
      });
    }
    if (section.callout) {
      body.push({
        type: "callout",
        variant: section.callout.variant,
        title: section.callout.title,
        text: section.callout.text,
      });
    }
  }

  body.push({
    type: "heading",
    text: { ru: "Коротко", en: "In short" },
  });
  body.push({ type: "paragraph", text: draft.takeaways });

  return body;
}

/** Generates and publishes an evergreen guide. One article per run — these are meant to be few
 * and good, which is the whole point of replacing the daily recap treadmill.
 *
 * With no `slug` it takes the next unpublished topic in the queue, which is what the cron does.
 * Passing a slug regenerates that specific topic instead: insertArticle upserts on slug, so the
 * existing article is replaced in place, keeping its URL and whatever links point at it. */
export async function generateNextEvergreenArticle(slug?: string): Promise<EvergreenGenerationResult> {
  const topic = slug
    ? EVERGREEN_TOPICS.find((t) => t.slug === slug)
    : await nextUnpublishedTopic();
  if (!topic) {
    return {
      status: "skipped",
      reason: slug
        ? `no topic with slug "${slug}" in EVERGREEN_TOPICS`
        : "evergreen queue is empty — add topics to EVERGREEN_TOPICS",
    };
  }

  try {
    const draft = await generateEvergreenDraft(topic);

    const coverBytes = await generateCoverImage(draft.coverImagePrompt);
    const coverImageUrl = await uploadArticleImage(`covers/${topic.slug}.jpg`, coverBytes);

    await insertArticle({
      kind: "evergreen",
      market: null,
      period: null,
      slug: topic.slug,
      title: draft.title,
      dek: draft.dek,
      body: draftToBlocks(draft),
      coverImageUrl,
      coverImageBytes: coverBytes.length,
      relatedTickers: topic.relatedTickers ?? [],
    });

    return { status: "created", slug: topic.slug, targetQuery: topic.targetQuery };
  } catch (err) {
    return {
      status: "failed",
      slug: topic.slug,
      targetQuery: topic.targetQuery,
      reason: err instanceof Error ? err.message : String(err),
    };
  }
}
