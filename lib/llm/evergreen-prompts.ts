import { WRITING_STYLE_GUIDE } from "@/lib/llm/style-guide";
import type { EvergreenTopic } from "@/lib/content/evergreen-topics";

/** Evergreen guides are the opposite of the daily recaps in every way that matters: they are
 * written once, for a query people actually type, and they have to stay correct for years. That
 * puts the whole burden on depth and accuracy rather than on freshness, so the prompt pushes hard
 * on concreteness (worked examples, named rules) and hard against anything dated. */
export function evergreenSystemPrompt(topic: EvergreenTopic): string {
  return `You are writing a reference guide in Russian for a personal-finance site aimed at private investors in Russia. This is not news — it is an evergreen explainer that must still be useful and accurate a year from now.

The article must answer this exact search query, thoroughly and directly: "${topic.targetQuery}"

${WRITING_STYLE_GUIDE}

Depth requirements (this is what separates a page that ranks from one that gets dropped):
- Answer the query directly in the opening paragraph. A reader who reads only the first three sentences must already have the core answer.
- Cover every point in the editorial brief you are given. Do not skip a point because it is complicated.
- Include at least one concrete worked example with real numbers, shown step by step, wherever the topic involves a calculation.
- Prefer specifics over generalities: name the rule, the article of law, the form, the mechanism. If you name a legal norm or a rate, name it only when you are confident it is correct.
- Anticipate the follow-up questions a reader will have after the main answer, and answer them in their own sections.
- Target 1200-1800 words of Russian body text across 5-9 sections. Length must come from substance, never from padding.

Accuracy rules (YMYL topic — a wrong number here does real damage):
- If a figure, rate or threshold changes over time and you are not confident of the current value, describe the mechanism and tell the reader where to check the current value, instead of stating a number you are unsure of.
- Never invent article numbers, form names, deadlines or rates. Omission is far better than a plausible-looking invention.
- Do not write anything that will be wrong next month. Avoid "сейчас", "в этом году", "недавно" — write in terms that stay true.

Hard rules (same as the rest of this product):
- Never tell the reader to buy, sell, hold, or avoid an asset, and never recommend a specific broker, exchange or service as the right choice. Describe options and trade-offs; the decision is the reader's.
- Never predict future price direction as fact.
- Neutral explanatory tone. No hype, no exclamation marks, no second-person cheerleading.

Language rule:
- Produce every text field TWICE: once in Russian ("ru") and once in English ("en"). Russian is the primary version and the one that must read most naturally; the English one is a faithful translation.
- The Russian title and the Russian lead paragraph must both contain the target query phrase naturally, in a grammatically correct form. Do not repeat it mechanically anywhere else.

Cover image prompt rule:
- "cover_image_prompt" must be a single English sentence describing an abstract, editorial, text-free illustration (no letters, no numbers, no logos, no charts, no recognisable brand marks) evoking the topic's mood. It is fed straight to an image generator, so it must not ask for any text to be rendered.

Output must be a JSON object matching the given schema exactly. No prose outside the JSON.`;
}

export function evergreenUserPrompt(topic: EvergreenTopic): string {
  return `Target search query: ${topic.targetQuery}

Working title (you may refine the wording, but the query must remain recognisable in it): ${topic.workingTitle}

Editorial brief — everything listed here has to be covered:
${topic.brief}

Write the guide now.`;
}

const localizedText = (description: string) => ({
  type: "object",
  properties: {
    ru: { type: "string", description: `${description} (Russian)` },
    en: { type: "string", description: `${description} (English)` },
  },
  required: ["ru", "en"],
  additionalProperties: false,
});

export const EVERGREEN_SCHEMA = {
  name: "evergreen_guide",
  strict: true,
  schema: {
    type: "object",
    properties: {
      title: localizedText(
        "Headline under 90 characters that contains the target query naturally and promises a concrete answer, not a vague topic label"
      ),
      dek: localizedText(
        "One-sentence subtitle that works as the search meta description: says exactly what the reader will learn, under 155 characters"
      ),
      lead: localizedText(
        "Opening paragraph of 3-4 sentences that answers the target query directly and up front, before any background"
      ),
      sections: {
        type: "array",
        description: "5-9 sections, in reading order",
        items: {
          type: "object",
          properties: {
            heading: localizedText("Section heading — a specific statement or question, not a one-word label"),
            paragraphs: {
              type: "array",
              description: "1-4 paragraphs of body text for this section",
              items: localizedText("A body paragraph"),
            },
          },
          required: ["heading", "paragraphs"],
          additionalProperties: false,
        },
      },
      takeaways: localizedText(
        "Closing paragraph summarising what the reader should now be able to do or check. Informational only — no call to invest or to use a particular service."
      ),
      cover_image_prompt: {
        type: "string",
        description: "Single English sentence describing an abstract, text-free cover illustration",
      },
    },
    required: ["title", "dek", "lead", "sections", "takeaways", "cover_image_prompt"],
    additionalProperties: false,
  },
} as const;
