import { getOpenAIClient, OPENAI_MODEL } from "@/lib/llm/openai-client";
import { ARTICLE_SCHEMA, HUMOR_ARTICLE_SYSTEM_PROMPT } from "@/lib/llm/humor-prompts";
import type { AttentionNoteRow, Localized } from "@/lib/types";

const MAX_ASSETS = 8;

export interface ArticleDraft {
  title: Localized<string>;
  dek: Localized<string>;
  intro: Localized<string>;
  sections: { ticker: string; paragraph: Localized<string> }[];
  watchlist: Localized<string>;
  coverImagePrompt: string;
}

const MARKET_LABEL: Record<string, string> = {
  us_stock: "US stock",
  ru_stock: "Russian (MOEX) stock",
  crypto: "crypto",
};

function buildUserPrompt(notes: AttentionNoteRow[]): string {
  const parts = notes.map((n) => {
    const priceLine = n.priceSnapshot
      ? `Price: ${n.priceSnapshot.price} ${n.priceSnapshot.currency} | 24h change: ${
          n.priceSnapshot.changePct24h ?? "n/a"
        }%`
      : "Price: no data";
    return `### TICKER_ID: ${n.ticker}\nDisplay name: ${n.name}\nMarket: ${
      MARKET_LABEL[n.market] ?? n.market
    }\nSentiment: ${n.sentiment}\n${priceLine}\nSummary: ${n.summary.en}\nWhy notable: ${
      n.whyNotable.en
    }\nKey facts: ${n.keyFacts.en.join("; ")}\nRisks: ${n.riskNotes.en}`;
  });

  return `Today's most notable attention notes across all markets (US stocks, Russian stocks, crypto). Write one cohesive ironic/satirical roundup covering these assets — exactly one section per TICKER_ID listed below, no more, no fewer. Each section's "ticker" field must be copied verbatim, character-for-character, from that asset's "TICKER_ID:" line above (e.g. for crypto this is a CoinGecko id like "bitmart-token", NOT a trading symbol like "BMX" — copy it exactly as shown, do not translate or reformat it).\n\n${parts.join(
    "\n\n"
  )}`;
}

interface LocalizedText {
  ru: string;
  en: string;
}

interface RawArticle {
  title: LocalizedText;
  dek: LocalizedText;
  intro: LocalizedText;
  sections: { ticker: string; paragraph: LocalizedText }[];
  watchlist: LocalizedText;
  cover_image_prompt: string;
}

/** Generates the daily cross-market "ironic digest" draft from today's most notable notes
 * (top MAX_ASSETS by |sentimentScore|, same selection logic as the regular daily articles). */
export async function generateHumorArticleDraft(notes: AttentionNoteRow[]): Promise<ArticleDraft | null> {
  if (notes.length === 0) return null;

  const selected = [...notes]
    .sort((a, b) => Math.abs(b.sentimentScore) - Math.abs(a.sentimentScore))
    .slice(0, MAX_ASSETS);

  const client = getOpenAIClient();
  const response = await client.chat.completions.create({
    model: OPENAI_MODEL,
    messages: [
      { role: "system", content: HUMOR_ARTICLE_SYSTEM_PROMPT },
      { role: "user", content: buildUserPrompt(selected) },
    ],
    response_format: { type: "json_schema", json_schema: ARTICLE_SCHEMA },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) return null;

  const raw = JSON.parse(content) as RawArticle;

  const knownTickers = new Set(selected.map((n) => n.ticker));
  const seen = new Set<string>();
  const sections = raw.sections.filter((s) => {
    if (!knownTickers.has(s.ticker) || seen.has(s.ticker)) return false;
    seen.add(s.ticker);
    return true;
  });

  return {
    title: raw.title,
    dek: raw.dek,
    intro: raw.intro,
    sections,
    watchlist: raw.watchlist,
    coverImagePrompt: raw.cover_image_prompt,
  };
}
