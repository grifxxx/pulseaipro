import { headers } from "next/headers";
import type { Metadata } from "next";
import Link from "next/link";
import { getArticlesPageByKinds } from "@/lib/db/articles-queries";
import { ArticleCard } from "@/components/ArticleCard";
import { BlogPagination } from "@/components/BlogPagination";
import { resolveLocale, getStrings, localizeArticle } from "@/lib/i18n";
import { NOINDEX_FOLLOW } from "@/lib/seo";
import type { Article, ArticleKind } from "@/lib/types";

export const revalidate = 0;

const PAGE_SIZE = 12;
const ARCHIVE_KINDS: ArticleKind[] = ["daily", "humor", "retrospective"];

export const metadata: Metadata = {
  title: "Архив ежедневных заметок",
  description: "Автоматические обзоры рынка, выходившие до перехода сайта на справочные разборы.",
  alternates: { canonical: "/blog/archive" },
  // The posts themselves carry noindex; the listing that leads to them should not be in the
  // index either, or it would rank as a page full of links to nothing.
  robots: NOINDEX_FOLLOW,
};

export default async function ArchivePage({
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
    const result = await getArticlesPageByKinds(ARCHIVE_KINDS, requestedPage, PAGE_SIZE);
    articles = result.articles;
    totalPages = Math.max(1, Math.ceil(result.totalCount / PAGE_SIZE));
    currentPage = result.page;
  } catch (err) {
    loadError = err instanceof Error ? err.message : String(err);
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14 flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <Link href="/blog" className="text-sm text-muted hover:text-accent transition-colors w-fit">
          {t.archiveBackToGuides}
        </Link>
        <h1 className="font-serif text-3xl sm:text-4xl font-semibold tracking-tight">{t.archiveTitle}</h1>
        <p className="text-sm sm:text-base text-muted max-w-xl">{t.archiveSubtitle}</p>
      </div>

      {loadError && (
        <div className="rounded-xl border border-negative/30 bg-negative/5 text-negative text-sm p-4">
          {t.loadErrorPrefix} ({loadError}). {t.loadErrorSuffix}
        </div>
      )}

      {!loadError && articles.length > 0 && (
        <>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {articles.map((article) => (
              <ArticleCard key={article.id} article={localizeArticle(article, locale)} locale={locale} />
            ))}
          </div>
          <BlogPagination currentPage={currentPage} totalPages={totalPages} basePath="/blog/archive" />
        </>
      )}
    </div>
  );
}
