import { getOpenAIClient, OPENAI_EVERGREEN_MODEL } from "@/lib/llm/openai-client";
import {
  EVERGREEN_SCHEMA,
  evergreenSystemPrompt,
  evergreenUserPrompt,
} from "@/lib/llm/evergreen-prompts";
import type { EvergreenTopic } from "@/lib/content/evergreen-topics";
import type { Localized } from "@/lib/types";

export interface EvergreenSection {
  heading: Localized<string>;
  paragraphs: Localized<string>[];
}

export interface EvergreenDraft {
  title: Localized<string>;
  dek: Localized<string>;
  lead: Localized<string>;
  sections: EvergreenSection[];
  takeaways: Localized<string>;
  coverImagePrompt: string;
}

interface RawEvergreen {
  title: Localized<string>;
  dek: Localized<string>;
  lead: Localized<string>;
  sections: { heading: Localized<string>; paragraphs: Localized<string>[] }[];
  takeaways: Localized<string>;
  cover_image_prompt: string;
}

/** Minimum Russian body length we accept. A guide that comes back this short has not covered the
 * brief, and publishing a thin page is exactly the mistake this whole rework exists to undo —
 * better to fail the run and alert than to add another low-value URL to the domain. */
const MIN_RU_BODY_CHARS = 2500;

function russianBodyLength(draft: EvergreenDraft): number {
  const parts = [
    draft.lead.ru,
    draft.takeaways.ru,
    ...draft.sections.flatMap((s) => [s.heading.ru, ...s.paragraphs.map((p) => p.ru)]),
  ];
  return parts.join(" ").length;
}

/** Generates one evergreen guide (text only — no cover image or DB row yet).
 *
 * Runs on the strong model rather than the cheap one used for the news pipeline: these are a
 * handful of pieces a week that have to carry the whole domain's search performance, so the
 * model cost is irrelevant next to the quality difference. */
export async function generateEvergreenDraft(topic: EvergreenTopic): Promise<EvergreenDraft> {
  const client = getOpenAIClient();
  const response = await client.chat.completions.create({
    model: OPENAI_EVERGREEN_MODEL,
    messages: [
      { role: "system", content: evergreenSystemPrompt(topic) },
      { role: "user", content: evergreenUserPrompt(topic) },
    ],
    response_format: { type: "json_schema", json_schema: EVERGREEN_SCHEMA },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error(`empty response for topic "${topic.slug}"`);

  const raw = JSON.parse(content) as RawEvergreen;
  const draft: EvergreenDraft = {
    title: raw.title,
    dek: raw.dek,
    lead: raw.lead,
    sections: raw.sections.filter((s) => s.paragraphs.length > 0),
    takeaways: raw.takeaways,
    coverImagePrompt: raw.cover_image_prompt,
  };

  if (draft.sections.length < 4) {
    throw new Error(`draft for "${topic.slug}" has only ${draft.sections.length} sections`);
  }
  const length = russianBodyLength(draft);
  if (length < MIN_RU_BODY_CHARS) {
    throw new Error(`draft for "${topic.slug}" is too thin: ${length} chars of Russian body`);
  }

  return draft;
}
