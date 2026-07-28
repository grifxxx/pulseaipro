import { WRITING_STYLE_GUIDE } from "@/lib/llm/style-guide";

const MARKET_LABELS: Record<string, string> = {
  us_stock: "US stocks",
  ru_stock: "Russian (MOEX) stocks",
  crypto: "cryptocurrency",
};

export function articleSystemPrompt(market: string): string {
  const marketLabel = MARKET_LABELS[market] ?? market;
  return `You are a financial journalist writing a daily editorial-style digest article about ${marketLabel} for a bilingual (Russian/English) website. The article is built from a batch of short "attention notes" already produced today by another analyst step — you are synthesizing them into a cohesive, readable article, not inventing new facts.

${WRITING_STYLE_GUIDE}

Hard rules (same as the rest of this product):
- Never tell the reader to buy, sell, hold, accumulate, or avoid an asset. Do not issue any directive.
- Never predict future price direction as fact. You may report that a source made such a claim, attributed explicitly to that source.
- The "watchlist" section (what to watch) must stay informational — framed as "here is what could move things next" or "here is what's unresolved", never as a recommendation to act.
- Base everything only on the provided notes. Do not invent facts, numbers, or events not present in the input.
- "sections" must cover only tickers that appear in the provided notes — one section per ticker, and the ticker field must exactly match the ticker given in the input.
- Write in a neutral, editorial-explainer tone — clear and readable, not hype-y, no exclamation marks, no "to the moon" style language.

Language rule:
- Produce every text field (title, dek, intro, watchlist, and each section's paragraph) TWICE: once in Russian ("ru") and once in English ("en"). Both versions must be faithful translations of each other.

Cover image prompt rule:
- "cover_image_prompt" must be a single English sentence describing an abstract, editorial, text-free illustration (no letters, no numbers, no logos, no charts) evoking ${marketLabel} — e.g. color palette, mood, abstract shapes/motifs appropriate to the market. It is fed directly to an image generator, so it must not ask for any text to be rendered in the image.

Output must be a JSON object matching the given schema exactly. No prose outside the JSON.`;
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

export const ARTICLE_SCHEMA = {
  name: "market_article",
  strict: true,
  schema: {
    type: "object",
    properties: {
      title: localizedText(
        "Article headline: punchy but factual, under 90 characters, naturally naming the specific companies/assets or theme covered (not a generic label like 'Market update') so it reads well both to a human reader and to a search engine"
      ),
      dek: localizedText("One-sentence subtitle summarizing the article, specific enough to work as a search meta description"),
      intro: localizedText("2-3 sentence opening paragraph setting the scene for the day"),
      sections: {
        type: "array",
        items: {
          type: "object",
          properties: {
            ticker: { type: "string", description: "Must match a ticker from the provided notes" },
            paragraph: localizedText("2-4 sentence paragraph about this asset"),
          },
          required: ["ticker", "paragraph"],
          additionalProperties: false,
        },
      },
      watchlist: localizedText(
        "Closing synthesis paragraph: what to watch next across these assets, informational only, no directives"
      ),
      cover_image_prompt: {
        type: "string",
        description: "English prompt for an abstract, text-free editorial cover illustration",
      },
    },
    required: ["title", "dek", "intro", "sections", "watchlist", "cover_image_prompt"],
    additionalProperties: false,
  },
} as const;
