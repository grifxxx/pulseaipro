import { getOpenAIClient, OPENAI_MODEL } from "@/lib/llm/openai-client";
import { ATTENTION_NOTES_SCHEMA, SYSTEM_PROMPT } from "@/lib/llm/prompts";
import type { AssetBundle, AttentionNote } from "@/lib/types";

const CHUNK_SIZE = 12;
const MIN_NEWS_ITEMS = 1;

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

function buildUserPrompt(bundles: AssetBundle[]): string {
  const parts = bundles.map((b) => {
    const priceLine = b.price
      ? `Price: $${b.price.price} | 24h change: ${b.price.changePct24h ?? "n/a"}% | Volume: ${
          b.price.volume ?? "n/a"
        } | Market cap: ${b.price.marketCap ?? "n/a"}`
      : "Price: no data available";

    const newsLines = b.news
      .slice(0, 8)
      .map(
        (n, i) =>
          `  ${i + 1}. "${n.title}" — ${n.publisher}, ${n.publishedAt}\n     URL: ${n.url}\n     ${
            n.summary ? `Summary: ${n.summary}` : ""
          }`
      )
      .join("\n");

    return `### SYMBOL: ${b.asset.symbol}\nName: ${b.asset.name}\nType: ${b.asset.assetType}\n${priceLine}\nNews:\n${
      newsLines || "  (none)"
    }`;
  });

  return `Here is today's data for a batch of assets. Produce an attention_notes_batch JSON object — exactly one note per SYMBOL listed below (or fewer, if you omit thin ones; never more than one per SYMBOL). Each note's "ticker" field must be copied verbatim from that asset's "SYMBOL:" line. Only include assets where the news actually explains something concrete — skip any asset with no meaningful news.\n\n${parts.join(
    "\n\n"
  )}`;
}

interface LocalizedText {
  ru: string;
  en: string;
}

interface LocalizedTextArray {
  ru: string[];
  en: string[];
}

interface RawSchemaNote {
  ticker: string;
  name: string;
  category: "stock" | "crypto";
  sentiment: "bullish" | "bearish" | "neutral" | "mixed";
  sentiment_score: number;
  summary: LocalizedText;
  why_notable: LocalizedText;
  key_facts: LocalizedTextArray;
  risk_notes: LocalizedText;
  sources: { title: string; url: string; publisher: string; published_at: string }[];
  not_financial_advice: boolean;
  generated_at: string;
}

function toAttentionNote(raw: RawSchemaNote): AttentionNote {
  return {
    ticker: raw.ticker,
    name: raw.name,
    category: raw.category,
    sentiment: raw.sentiment,
    sentimentScore: raw.sentiment_score,
    summary: raw.summary,
    whyNotable: raw.why_notable,
    keyFacts: raw.key_facts,
    riskNotes: raw.risk_notes,
    sources: raw.sources.map((s) => ({
      title: s.title,
      url: s.url,
      publisher: s.publisher,
      publishedAt: s.published_at,
    })),
    notFinancialAdvice: true,
    generatedAt: raw.generated_at,
  };
}

async function analyzeChunk(bundles: AssetBundle[]): Promise<AttentionNote[]> {
  const client = getOpenAIClient();
  const response = await client.chat.completions.create({
    model: OPENAI_MODEL,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: buildUserPrompt(bundles) },
    ],
    response_format: { type: "json_schema", json_schema: ATTENTION_NOTES_SCHEMA },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) return [];

  const parsed = JSON.parse(content) as { notes: RawSchemaNote[] };

  // Defensive: drop any note whose ticker doesn't exactly match a symbol we sent (the model
  // occasionally "normalizes" an id into a different spelling, e.g. a CoinGecko id into a
  // trading symbol), and dedupe in case it produced two notes for the same asset.
  const knownSymbols = new Set(bundles.map((b) => b.asset.symbol));
  const seen = new Set<string>();
  return parsed.notes
    .filter((n) => {
      if (!n.not_financial_advice || !knownSymbols.has(n.ticker) || seen.has(n.ticker)) return false;
      seen.add(n.ticker);
      return true;
    })
    .map(toAttentionNote);
}

/** Analyzes a batch of asset bundles into attention notes, chunking to keep prompts a manageable size. */
export async function analyzeAssetBundles(bundles: AssetBundle[]): Promise<AttentionNote[]> {
  const worthAnalyzing = bundles.filter((b) => b.news.length >= MIN_NEWS_ITEMS);
  if (worthAnalyzing.length === 0) return [];

  const chunks = chunk(worthAnalyzing, CHUNK_SIZE);
  const results = await Promise.all(chunks.map(analyzeChunk));
  return results.flat();
}
