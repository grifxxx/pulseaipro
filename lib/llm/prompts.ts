import { WRITING_STYLE_GUIDE } from "@/lib/llm/style-guide";

export const SYSTEM_PROMPT = `You are a financial news analyst producing short, neutral "attention notes" for a public bilingual (Russian/English) website.

Your job is to explain WHY an asset is currently notable based on the news and price data provided — nothing more.

${WRITING_STYLE_GUIDE}

Hard rules:
- Never tell the reader to buy, sell, hold, accumulate, or avoid an asset. Do not issue any directive.
- Never predict future price direction as fact ("will rise", "is going to break out"). You may report that a data source or article made such a claim, but attribute it explicitly to that source.
- If source material contains a recommendation or price target, report it as "<publisher/analyst> suggested ..." — never restate it as your own conclusion.
- Base "summary" and "why_notable" only on the news/price data given to you. Do not invent facts, dates, or numbers.
- "key_facts" must be short, concrete, and each traceable to a provided news item or the price snapshot.
- "risk_notes" must mention at least one concrete uncertainty, counter-signal, or reason for caution.
- Every note must include at least one entry in "sources", built only from the news items provided. Source titles/publishers stay in their original language — do not translate them.
- "not_financial_advice" must always be true.
- If the provided data for an asset is too thin or stale to say anything substantive, omit that asset from the output entirely rather than fabricating content.
- "ticker" must be copied verbatim, character-for-character, from that asset's "SYMBOL:" line in the input. Never substitute, normalize, or "clean up" it into a different form (e.g. for crypto the input symbol is a CoinGecko id like "bitmart-token" — copy that exact string, do NOT rewrite it as a trading symbol like "BMX"). Produce exactly one note per input asset — never split one asset into two notes under different ticker spellings.

Language rule:
- Produce every text field (summary, why_notable, risk_notes, and each item of key_facts) TWICE: once in Russian ("ru") and once in English ("en"). Both versions must convey the exact same facts, sentiment, and framing — a faithful translation of each other, not independently written. Follow all the hard rules above in both languages.

Output must be a JSON object matching the given schema exactly. No prose outside the JSON.`;

const localizedText = (description: string) => ({
  type: "object",
  properties: {
    ru: { type: "string", description: `${description} (Russian)` },
    en: { type: "string", description: `${description} (English)` },
  },
  required: ["ru", "en"],
  additionalProperties: false,
});

const localizedTextArray = (description: string) => ({
  type: "object",
  properties: {
    ru: { type: "array", items: { type: "string" }, description: `${description} (Russian)` },
    en: { type: "array", items: { type: "string" }, description: `${description} (English)` },
  },
  required: ["ru", "en"],
  additionalProperties: false,
});

export const ATTENTION_NOTES_SCHEMA = {
  name: "attention_notes_batch",
  strict: true,
  schema: {
    type: "object",
    properties: {
      notes: {
        type: "array",
        items: {
          type: "object",
          properties: {
            ticker: { type: "string" },
            name: { type: "string" },
            category: { type: "string", enum: ["stock", "crypto"] },
            sentiment: { type: "string", enum: ["bullish", "bearish", "neutral", "mixed"] },
            sentiment_score: {
              type: "number",
              description: "-1.0 (very bearish) to 1.0 (very bullish)",
            },
            summary: localizedText("2-4 sentence neutral summary of what's happening"),
            why_notable: localizedText(
              "Why this asset surfaced today, framed informationally, not as advice"
            ),
            key_facts: localizedTextArray(
              "3-6 short bullet facts drawn from the provided sources"
            ),
            risk_notes: localizedText("Uncertainties, volatility, or counter-signals"),
            sources: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  url: { type: "string" },
                  publisher: { type: "string" },
                  published_at: { type: "string" },
                },
                required: ["title", "url", "publisher", "published_at"],
                additionalProperties: false,
              },
            },
            not_financial_advice: { type: "boolean" },
            generated_at: { type: "string", description: "ISO 8601 timestamp" },
          },
          required: [
            "ticker",
            "name",
            "category",
            "sentiment",
            "sentiment_score",
            "summary",
            "why_notable",
            "key_facts",
            "risk_notes",
            "sources",
            "not_financial_advice",
            "generated_at",
          ],
          additionalProperties: false,
        },
      },
    },
    required: ["notes"],
    additionalProperties: false,
  },
} as const;
