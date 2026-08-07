import { cache } from "react";
import { getPublicClient, getServiceClient } from "@/lib/db/supabase-client";
import { submitToIndexNow } from "@/lib/indexnow";
import { postArticleToChannel } from "@/lib/notify";
import { SITE_URL } from "@/lib/seo";
import type { Article, ArticleBlock, ArticleKind, Market, RetrospectivePeriod } from "@/lib/types";

export interface NewArticle {
  kind?: ArticleKind;
  market?: Market | null;
  period?: RetrospectivePeriod | null;
  slug: string;
  title: Article["title"];
  dek: Article["dek"];
  body: ArticleBlock[];
  coverImageUrl: string;
  coverImageBytes?: number;
  relatedTickers: string[];
}

/** Upserts on slug so re-running generation for the same market/day (or period) replaces rather than duplicates. */
export async function insertArticle(article: NewArticle): Promise<void> {
  const db = getServiceClient();
  const { error } = await db.from("articles").upsert(
    {
      kind: article.kind ?? "daily",
      market: article.market ?? null,
      period: article.period ?? null,
      slug: article.slug,
      title: article.title,
      dek: article.dek,
      body: article.body,
      cover_image_url: article.coverImageUrl,
      cover_image_bytes: article.coverImageBytes ?? null,
      related_tickers: article.relatedTickers,
      published_at: new Date().toISOString(),
    },
    { onConflict: "slug" }
  );
  if (error) throw new Error(`insertArticle failed: ${error.message}`);

  const url = `${SITE_URL}/blog/${encodeURIComponent(article.slug)}`;
  await submitToIndexNow([url, `${SITE_URL}/blog`, `${SITE_URL}/sitemap.xml`]);

  // Sponsored articles are disclosed ad placements — post those to the channel manually and
  // deliberately, not automatically, same as they're already excluded from the Zen RSS feed.
  if ((article.kind ?? "daily") !== "sponsored") {
    await postArticleToChannel({
      market: article.market ?? null,
      title: article.title.ru,
      dek: article.dek.ru,
      url,
      coverImageUrl: article.coverImageUrl,
    });
  }
}

function rowToArticle(r: Record<string, unknown>): Article {
  return {
    id: r.id as string,
    slug: r.slug as string,
    kind: (r.kind as ArticleKind) ?? "daily",
    market: (r.market as Market | null) ?? null,
    period: (r.period as RetrospectivePeriod | null) ?? null,
    title: r.title as Article["title"],
    dek: r.dek as Article["dek"],
    coverImageUrl: r.cover_image_url as string,
    coverImageBytes: (r.cover_image_bytes as number | null) ?? null,
    body: r.body as ArticleBlock[],
    relatedTickers: (r.related_tickers as string[]) ?? [],
    publishedAt: r.published_at as string,
  };
}

export const getLatestArticles = cache(async (market?: Market): Promise<Article[]> => {
  const db = getPublicClient();
  let query = db.from("articles").select("*").order("published_at", { ascending: false });
  if (market) query = query.eq("market", market);
  const { data, error } = await query;
  if (error) throw new Error(`getLatestArticles failed: ${error.message}`);
  return (data ?? []).map(rowToArticle);
});

export interface ArticlesPage {
  articles: Article[];
  totalCount: number;
  page: number;
  pageSize: number;
}

/** Clamps the requested page to a valid range first, so an out-of-bounds page (e.g. a stale
 * bookmark or a hand-edited URL) never sends Supabase an unsatisfiable range and errors out —
 * it just silently returns the nearest real page instead. */
export const getArticlesPage = cache(async (page: number, pageSize: number): Promise<ArticlesPage> => {
  const db = getPublicClient();

  const { count, error: countError } = await db
    .from("articles")
    .select("id", { count: "exact", head: true });
  if (countError) throw new Error(`getArticlesPage failed: ${countError.message}`);

  const totalCount = count ?? 0;
  if (totalCount === 0) {
    return { articles: [], totalCount: 0, page: 1, pageSize };
  }

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const clampedPage = Math.min(Math.max(1, page), totalPages);
  const from = (clampedPage - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, error } = await db
    .from("articles")
    .select("*")
    .order("published_at", { ascending: false })
    .range(from, to);
  if (error) throw new Error(`getArticlesPage failed: ${error.message}`);

  return { articles: (data ?? []).map(rowToArticle), totalCount, page: clampedPage, pageSize };
});

export const getArticleBySlug = cache(async (slug: string): Promise<Article | null> => {
  const db = getPublicClient();
  const { data, error } = await db.from("articles").select("*").eq("slug", slug).maybeSingle();
  if (error) throw new Error(`getArticleBySlug failed: ${error.message}`);
  return data ? rowToArticle(data) : null;
});
