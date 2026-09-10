import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

/** AI crawlers (GPTBot, ClaudeBot, PerplexityBot, YandexAdditional and the rest) are left open
 * on purpose — the wildcard rule below covers them.
 *
 * The argument for blocking them is that they answer a reader's question without sending the
 * visit. That argument belongs to sites whose pages earn money from being opened. This one has
 * no ads to protect and, at four pages in the Yandex index, a visibility problem rather than an
 * over-exposure one: being quoted with a link in an AI answer is a channel we do not otherwise
 * have. Revisit if the site ever starts earning per visit. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: "/api/" }],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
