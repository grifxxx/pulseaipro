import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";
import { getLatestFeed } from "@/lib/db/queries";
import { getLatestArticles } from "@/lib/db/articles-queries";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/blog`, changeFrequency: "daily", priority: 0.8 },
    { url: `${SITE_URL}/about`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/faq`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/privacy`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/terms`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/cookies`, changeFrequency: "yearly", priority: 0.3 },
  ];

  let assetRoutes: MetadataRoute.Sitemap = [];
  try {
    const notes = await getLatestFeed();
    assetRoutes = notes.map((n) => ({
      url: `${SITE_URL}/asset/${encodeURIComponent(n.ticker)}`,
      lastModified: n.generatedAt,
      changeFrequency: "daily" as const,
      priority: 0.7,
    }));
  } catch {
    // DB unreachable (e.g. build time without env vars) — fall back to static routes only.
  }

  let articleRoutes: MetadataRoute.Sitemap = [];
  try {
    const articles = await getLatestArticles();
    articleRoutes = articles.map((a) => ({
      url: `${SITE_URL}/blog/${encodeURIComponent(a.slug)}`,
      lastModified: a.publishedAt,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    }));
  } catch {
    // DB unreachable — fall back to static routes only.
  }

  return [...staticRoutes, ...assetRoutes, ...articleRoutes];
}
