import type { MetadataRoute } from "next";
import { isIndexableArticleKind, SITE_URL } from "@/lib/seo";
import { getLatestArticles } from "@/lib/db/articles-queries";

// Without this the sitemap is generated once at build time and then frozen: between 22 August
// and 7 September it kept serving the article list as it stood on the last deploy, so nothing
// published after that deploy was ever offered to a crawler. Rebuild it hourly instead.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/blog`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/about`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/faq`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/privacy`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/terms`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/cookies`, changeFrequency: "yearly", priority: 0.3 },
  ];

  // Only the pages we actually want ranked. The per-ticker /asset pages and the dated daily
  // articles carry a noindex now, and listing a noindexed URL here just wastes crawl budget
  // and tells the crawler we don't know what our own good pages are.
  let articleRoutes: MetadataRoute.Sitemap = [];
  try {
    const articles = await getLatestArticles();
    articleRoutes = articles
      .filter((a) => isIndexableArticleKind(a.kind))
      .map((a) => ({
        url: `${SITE_URL}/blog/${encodeURIComponent(a.slug)}`,
        lastModified: a.publishedAt,
        changeFrequency: "monthly" as const,
        priority: 0.9,
      }));
  } catch {
    // DB unreachable (e.g. build time without env vars) — fall back to static routes only.
  }

  return [...staticRoutes, ...articleRoutes];
}
