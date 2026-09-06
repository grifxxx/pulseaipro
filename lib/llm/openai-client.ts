import OpenAI from "openai";

let client: OpenAI | null = null;

export function getOpenAIClient(): OpenAI {
  if (!client) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error("OPENAI_API_KEY is not set");
    client = new OpenAI({ apiKey });
  }
  return client;
}

export const OPENAI_MODEL = process.env.OPENAI_MODEL ?? "gpt-5-mini";

/** The evergreen guides run on a stronger model than the news pipeline. There are only a few of
 * them a week and they carry the site's entire search strategy, so the per-article cost is
 * negligible next to the quality difference. Override via env to move to a newer model. */
export const OPENAI_EVERGREEN_MODEL = process.env.OPENAI_EVERGREEN_MODEL ?? "gpt-6-astra";
