import { getOpenAIClient, OPENAI_MODEL } from "@/lib/llm/openai-client";
import { RETROSPECTIVE_SCHEMA, retrospectiveSystemPrompt } from "@/lib/llm/retrospective-prompts";
import type { Localized, Market, RetrospectivePeriod } from "@/lib/types";

export interface PeriodAssetSummary {
  ticker: string;
  name: string;
  market: Market;
  logoUrl: string | null;
  currency: string;
  firstPrice: number | null;
  lastPrice: number | null;
  periodChangePct: number | null;
  noteCount: number;
  highlights: { date: string; text: string }[];
}

export interface RetrospectiveDraft {
  title: Localized<string>;
  dek: Localized<string>;
  intro: Localized<string>;
  sections: { ticker: string; paragraph: Localized<string> }[];
  summary: Localized<string>;
  coverImagePrompt: string;
}

function buildUserPrompt(period: RetrospectivePeriod, assets: PeriodAssetSummary[]): string {
  const parts = assets.map((a) => {
    const changeLine =
      a.periodChangePct != null
        ? `Period change: ${a.periodChangePct >= 0 ? "+" : ""}${a.periodChangePct.toFixed(2)}%`
        : "Period change: not enough price data";
    const highlightLines = a.highlights.map((h) => `  - ${h.date}: ${h.text}`).join("\n");
    return `### TICKER_ID: ${a.ticker}\nName: ${a.name}\nMarket: ${a.market}\nTimes notable this period: ${a.noteCount}\nPrice at start: ${a.firstPrice ?? "n/a"} ${a.currency}\nPrice at end: ${a.lastPrice ?? "n/a"} ${a.currency}\n${changeLine}\nHighlights:\n${highlightLines || "  (none)"}`;
  });

  return `Retrospective data for the "${period}" review, covering ${assets.length} assets across stocks and crypto. Write one cohesive review article — exactly one section per TICKER_ID listed below, ticker copied verbatim.\n\n${parts.join(
    "\n\n"
  )}`;
}

interface LocalizedText {
  ru: string;
  en: string;
}

interface RawRetrospective {
  title: LocalizedText;
  dek: LocalizedText;
  intro: LocalizedText;
  sections: { ticker: string; paragraph: LocalizedText }[];
  summary: LocalizedText;
  cover_image_prompt: string;
}

export async function generateRetrospectiveDraft(
  period: RetrospectivePeriod,
  assets: PeriodAssetSummary[]
): Promise<RetrospectiveDraft | null> {
  if (assets.length === 0) return null;

  const client = getOpenAIClient();
  const response = await client.chat.completions.create({
    model: OPENAI_MODEL,
    messages: [
      { role: "system", content: retrospectiveSystemPrompt(period) },
      { role: "user", content: buildUserPrompt(period, assets) },
    ],
    response_format: { type: "json_schema", json_schema: RETROSPECTIVE_SCHEMA },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) return null;

  const raw = JSON.parse(content) as RawRetrospective;

  // Defensive: drop/dedupe any section whose ticker doesn't exactly match what we sent
  // (same class of model slip-up seen with the daily articles/crypto ids).
  const knownTickers = new Set(assets.map((a) => a.ticker));
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
    summary: raw.summary,
    coverImagePrompt: raw.cover_image_prompt,
  };
}
