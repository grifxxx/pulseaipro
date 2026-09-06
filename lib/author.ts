import { LEGAL_EMAIL } from "@/lib/legal";

/** The site's named author. Finance is a YMYL topic: Yandex and Google both expect a real,
 * identifiable person behind the content, not a faceless brand. Every indexable article
 * carries this byline and a matching schema.org Person in its JSON-LD. */
export const AUTHOR_NAME = "Григорий Яцунов";
export const AUTHOR_EMAIL = LEGAL_EMAIL;
export const AUTHOR_URL = "/about";

/** One-line credential shown under the byline. Keep it factual — it is an E-E-A-T signal,
 * and an inflated claim here is worse than none at all. */
export const AUTHOR_TAGLINE = "автор и редактор PulseAiPro";

export function authorJsonLd(siteUrl: string) {
  return {
    "@type": "Person",
    name: AUTHOR_NAME,
    email: AUTHOR_EMAIL,
    url: `${siteUrl}${AUTHOR_URL}`,
  };
}
