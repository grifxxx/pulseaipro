import { getOpenAIClient, OPENAI_EVERGREEN_MODEL } from "@/lib/llm/openai-client";
import {
  EVERGREEN_SCHEMA,
  evergreenSystemPrompt,
  evergreenUserPrompt,
} from "@/lib/llm/evergreen-prompts";
import type { EvergreenTopic } from "@/lib/content/evergreen-topics";
import type { CalloutVariant, Localized } from "@/lib/types";

export interface EvergreenTable {
  caption: Localized<string>;
  columns: Localized<string[]>;
  rows: Localized<string[][]>;
}

export interface EvergreenList {
  ordered: boolean;
  items: Localized<string[]>;
}

export interface EvergreenCallout {
  variant: CalloutVariant;
  title: Localized<string>;
  text: Localized<string>;
}

export interface EvergreenSection {
  heading: Localized<string>;
  paragraphs: Localized<string>[];
  list: EvergreenList | null;
  table: EvergreenTable | null;
  callout: EvergreenCallout | null;
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
  sections: {
    heading: Localized<string>;
    paragraphs: Localized<string>[];
    list: EvergreenList | null;
    table: EvergreenTable | null;
    callout: EvergreenCallout | null;
  }[];
  takeaways: Localized<string>;
  cover_image_prompt: string;
}

/** Minimum Russian body length we accept. A guide that comes back this short has not covered the
 * brief, and publishing a thin page is exactly the mistake this whole rework exists to undo —
 * better to fail the run and alert than to add another low-value URL to the domain. */
const MIN_RU_BODY_CHARS = 2500;

/** A table is only usable if both language grids are rectangular and agree with each other. A
 * ragged one renders as broken markup, so drop it and keep the prose rather than ship that. */
function isUsableTable(table: EvergreenTable): boolean {
  const width = table.columns.ru.length;
  if (width < 2 || table.columns.en.length !== width) return false;
  if (table.rows.ru.length === 0 || table.rows.ru.length !== table.rows.en.length) return false;
  return [...table.rows.ru, ...table.rows.en].every((row) => row.length === width);
}

function isUsableList(list: EvergreenList): boolean {
  return list.items.ru.length > 1 && list.items.ru.length === list.items.en.length;
}

function russianBodyLength(draft: EvergreenDraft): number {
  const parts = [draft.lead.ru, draft.takeaways.ru];
  for (const section of draft.sections) {
    parts.push(section.heading.ru, ...section.paragraphs.map((p) => p.ru));
    if (section.list) parts.push(...section.list.items.ru);
    if (section.table) parts.push(...section.table.rows.ru.flat());
    if (section.callout) parts.push(section.callout.title.ru, section.callout.text.ru);
  }
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
    sections: raw.sections
      .filter((s) => s.paragraphs.length > 0)
      .map((s) => ({
        heading: s.heading,
        paragraphs: s.paragraphs,
        list: s.list && isUsableList(s.list) ? s.list : null,
        table: s.table && isUsableTable(s.table) ? s.table : null,
        callout: s.callout,
      })),
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
