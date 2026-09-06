import { LEGAL_EMAIL } from "@/lib/legal";

/** Who is behind the content, stated accurately.
 *
 * The guides are written by a model, not by a person, so the site does not put a human name in
 * the "author" slot — that would be a false signal, and a false signal is worse than none. What
 * is true, and what the byline and the structured data say instead, is that a named, identifiable
 * person built the pipeline, decides what it writes about and answers for what gets published. */
export const CREATOR_NAME = "Григорий Яцунов";
export const CREATOR_EMAIL = LEGAL_EMAIL;
export const CREATOR_URL = "/about";

/** Byline shown above every generated guide. Disclosure is deliberate: search engines treat
 * undisclosed machine-written content far worse than disclosed machine-written content. */
export const BYLINE = {
  ru: { writtenBy: "Текст подготовлен нейросетью PulseAiPro", creditLabel: "Алгоритм" },
  en: { writtenBy: "Written by the PulseAiPro neural network", creditLabel: "Algorithm" },
} as const;

export function creatorJsonLd(siteUrl: string) {
  return {
    "@type": "Person",
    name: CREATOR_NAME,
    email: CREATOR_EMAIL,
    url: `${siteUrl}${CREATOR_URL}`,
  };
}
