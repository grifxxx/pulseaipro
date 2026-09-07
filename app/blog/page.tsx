import { headers } from "next/headers";
import type { Metadata } from "next";
import Link from "next/link";
import { getArticlesByKinds } from "@/lib/db/articles-queries";
import { GuideSections, GuideRow } from "@/components/GuideList";
import { resolveLocale, getStrings, localizeArticle } from "@/lib/i18n";
import type { Article } from "@/lib/types";

export const revalidate = 0;

// SEO title/description pinned to Russian (see the comment in app/layout.tsx).
export const metadata: Metadata = {
  title: "Статьи: налоги, ИИС, облигации, биржа и криптовалюты простыми словами",
  description:
    "Справочные статьи для частного инвестора: ИИС-3 и вычеты, ОФЗ, шорт и биржевой стакан, дивидендная отсечка, налог на криптовалюту, стейкинг. С расчётами и таблицами.",
  alternates: { canonical: "/blog" },
};

/** The guides, all of them, grouped by topic. The old daily recaps are deliberately not here:
 * mixing ~170 noindexed posts into this listing buried the guides and spent the page's link
 * weight on URLs we have asked search engines to ignore. They live in /blog/archive. */
export default async function BlogPage() {
  const headersList = await headers();
  const locale = resolveLocale(headersList.get("accept-language"));
  const t = getStrings(locale);

  let guides: Article[] = [];
  let sponsored: Article[] = [];
  let loadError: string | null = null;

  try {
    const articles = await getArticlesByKinds(["evergreen", "sponsored"]);
    guides = articles.filter((a) => a.kind === "evergreen");
    // Sponsored (RU-only financial offers) content is not shown to the EN audience at all.
    sponsored = locale === "ru" ? articles.filter((a) => a.kind === "sponsored") : [];
  } catch (err) {
    loadError = err instanceof Error ? err.message : String(err);
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-16 flex flex-col gap-12">
      <div className="flex flex-col gap-3 max-w-3xl">
        <h1 className="font-serif text-4xl sm:text-5xl font-semibold leading-[1.1] tracking-tight">
          {t.blogTitle}
        </h1>
        <p className="text-base sm:text-lg leading-relaxed text-foreground/75">{t.blogSubtitle}</p>
      </div>

      {loadError && (
        <div className="rounded-xl border border-negative/30 bg-negative/5 text-negative text-sm p-4">
          {t.loadErrorPrefix} ({loadError}). {t.loadErrorSuffix}
        </div>
      )}

      {!loadError && guides.length === 0 && (
        <div className="rounded-xl border border-border bg-surface text-sm p-6 text-muted">
          {t.blogEmptyState}
        </div>
      )}

      {!loadError && guides.length > 0 && (
        <GuideSections articles={guides.map((a) => localizeArticle(a, locale))} locale={locale} />
      )}

      {sponsored.length > 0 && (
        <section className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,2.2fr)] md:gap-10">
          <div className="flex flex-col gap-1.5">
            <h2 className="font-serif text-2xl font-semibold tracking-tight">{t.sponsoredGroupTitle}</h2>
            <p className="text-sm leading-relaxed text-muted">
              Отмечены и отделены от статей, чтобы их нельзя было спутать.
            </p>
          </div>
          <ul className="flex flex-col">
            {sponsored.map((article) => (
              <GuideRow key={article.id} article={localizeArticle(article, locale)} locale={locale} />
            ))}
          </ul>
        </section>
      )}

      <div className="border-t border-border pt-6">
        <Link href="/blog/archive" className="text-sm text-muted hover:text-foreground transition-colors">
          {t.blogArchiveLink} →
        </Link>
      </div>
    </div>
  );
}
