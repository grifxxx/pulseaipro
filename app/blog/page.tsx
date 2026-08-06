import { headers } from "next/headers";
import type { Metadata } from "next";
import { getArticlesPage } from "@/lib/db/articles-queries";
import { ArticleCard } from "@/components/ArticleCard";
import { SponsorCard } from "@/components/SponsorCard";
import { BlogPagination } from "@/components/BlogPagination";
import { resolveLocale, getStrings, localizeArticle } from "@/lib/i18n";
import { interleaveSponsors } from "@/lib/sponsors";
import type { Article } from "@/lib/types";

export const revalidate = 0;

const PAGE_SIZE = 9;
const SPONSOR_EVERY_N = 6;

// SEO title/description pinned to Russian (see the comment in app/layout.tsx) and written
// separately from the on-page heading/subtitle so the search snippet can be clear and
// keyword-rich without cluttering the on-site copy.
export const metadata: Metadata = {
  title: "Блог: новости и обзоры рынка акций и криптовалют",
  description:
    "Ежедневные статьи по акциям США, российским акциям и криптовалютам — с обложкой, графиком и разбором ключевых активов дня. Публикуются автоматически на основе новостей.",
  alternates: { canonical: "/blog" },
};

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const requestedPage = Math.max(1, Number(pageParam) || 1);

  const headersList = await headers();
  const locale = resolveLocale(headersList.get("accept-language"));
  const t = getStrings(locale);

  let articles: Article[] = [];
  let totalPages = 1;
  let currentPage = requestedPage;
  let loadError: string | null = null;

  try {
    const result = await getArticlesPage(requestedPage, PAGE_SIZE);
    // Sponsored (RU-only financial offer) content is filtered out of the EN blog —
    // the count/pagination stays server-computed, so an EN page may show one fewer card.
    articles = locale === "ru" ? result.articles : result.articles.filter((a) => a.kind !== "sponsored");
    totalPages = Math.max(1, Math.ceil(result.totalCount / PAGE_SIZE));
    currentPage = result.page;
  } catch (err) {
    loadError = err instanceof Error ? err.message : String(err);
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14 flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">{t.blogTitle}</h1>
        <p className="text-sm sm:text-base text-muted max-w-xl">{t.blogSubtitle}</p>
      </div>

      {loadError && (
        <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 text-rose-700 dark:text-rose-300 text-sm p-4">
          {t.loadErrorPrefix} ({loadError}). {t.loadErrorSuffix}
        </div>
      )}

      {!loadError && articles.length === 0 && (
        <div className="rounded-xl border border-border bg-surface text-sm p-6 text-muted">
          {t.blogEmptyState}
        </div>
      )}

      {!loadError && articles.length > 0 && (
        <>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {(locale === "ru"
              ? interleaveSponsors(articles, SPONSOR_EVERY_N, currentPage)
              : articles.map((item) => ({ kind: "item" as const, item }))
            ).map((cell, i) =>
              cell.kind === "item" ? (
                <ArticleCard key={cell.item.id} article={localizeArticle(cell.item, locale)} locale={locale} />
              ) : (
                <SponsorCard key={`sponsor-${i}`} offer={cell.offer} />
              )
            )}
          </div>
          <BlogPagination currentPage={currentPage} totalPages={totalPages} />
        </>
      )}
    </div>
  );
}
