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
  }

  body.push({
    type: "heading",
    text: { ru: "Коротко", en: "In short" },
  });
  body.push({ type: "paragraph", text: draft.takeaways });

  return body;
}

/** Generates and publishes the next evergreen guide in the queue. One article per run — these are
 * meant to be few and good, which is the whole point of replacing the daily recap treadmill. */
export async function generateNextEvergreenArticle(): Promise<EvergreenGenerationResult> {
  const topic = await nextUnpublishedTopic();
  if (!topic) {
    return { status: "skipped", reason: "evergreen queue is empty — add topics to EVERGREEN_TOPICS" };
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
