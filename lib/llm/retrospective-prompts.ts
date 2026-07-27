const PERIOD_LABELS: Record<string, string> = {
  weekly: "the past week",
  monthly: "the past month",
  semiannual: "the past six months",
  yearly: "the past year",
};

export function retrospectiveSystemPrompt(period: string): string {
  const periodLabel = PERIOD_LABELS[period] ?? period;
  return `You are a financial analyst writing a RETROSPECTIVE review of ${periodLabel} for a bilingual (Russian/English) website, covering stocks and crypto together. Unlike a same-day update, this looks backward at what already happened — you are describing history, not predicting or recommending anything.

Hard rules:
- Never tell the reader to buy, sell, hold, accumulate, or avoid an asset going forward. This is a historical review, not guidance for future action.
- You may factually state how an asset's price moved over the period and describe which news events coincided with that move — that is historical description, not a prediction, and is allowed and expected here.
- Do not predict future price direction. Do not use the review to suggest what to do next.
- Base everything only on the provided period data (price change, number of times each asset was notable, and the news highlights given). Do not invent facts or numbers.
- "sections" must cover only the TICKER_IDs provided, one section each, copied verbatim — do not translate, reformat, or invent tickers.
- Each section's paragraph should mention the period price change figure that was provided and tie it to the news highlights given for that asset.
- The closing "summary" section should synthesize the defining themes of the period across these assets — still purely descriptive/historical, not advice.
- Write in a neutral, editorial-explainer tone.

Language rule:
- Produce every text field (title, dek, intro, summary, and each section's paragraph) TWICE: once in Russian ("ru") and once in English ("en"), faithful translations of each other.

Cover image prompt rule:
- "cover_image_prompt" must be a single English sentence describing an abstract, editorial, text-free illustration evoking a "look back over ${periodLabel}" theme (e.g. calendar, timeline, retrospective motifs) — no letters, numbers, logos, or charts requested in the image.

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

export const RETROSPECTIVE_SCHEMA = {
  name: "retrospective_article",
  strict: true,
  schema: {
    type: "object",
    properties: {
      title: localizedText("Retrospective headline, factual, under 90 characters"),
      dek: localizedText("One-sentence subtitle summarizing the period review"),
      intro: localizedText("2-3 sentence opening paragraph framing the period"),
      sections: {
        type: "array",
        items: {
          type: "object",
          properties: {
            ticker: { type: "string", description: "Must match a ticker from the provided period data" },
            paragraph: localizedText(
              "2-4 sentence paragraph: how price moved over the period and which news coincided with it"
            ),
          },
          required: ["ticker", "paragraph"],
          additionalProperties: false,
        },
      },
      summary: localizedText(
        "Closing synthesis paragraph: the defining themes of the period across these assets, purely descriptive"
      ),
      cover_image_prompt: {
        type: "string",
        description: "English prompt for an abstract, text-free retrospective/review cover illustration",
      },
    },
    required: ["title", "dek", "intro", "sections", "summary", "cover_image_prompt"],
    additionalProperties: false,
  },
} as const;
