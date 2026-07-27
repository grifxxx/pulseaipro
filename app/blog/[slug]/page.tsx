import { headers } from "next/headers";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getArticleBySlug } from "@/lib/db/articles-queries";
import { ArticleBody } from "@/components/ArticleBody";
import { resolveLocale, getStrings, localizeArticle } from "@/lib/i18n";
import { blogPostingJsonLd, SITE_URL, truncateForDescription } from "@/lib/seo";

export const revalidate = 0;

type PageParams = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  const { slug } = await params;
  const headersList = await headers();
  const locale = resolveLocale(headersList.get("accept-language"));
  const article = await getArticleBySlug(slug);
  if (!article) return {};

  const title = article.title[locale];
  const description = truncateForDescription(article.dek[locale]);

  return {
    title,
    description,
    alternates: { canonical: `/blog/${article.slug}` },
    openGraph: { title, description, images: [article.coverImageUrl] },
  };
}

export default async function ArticlePage({ params }: PageParams) {
  const { slug } = await params;
  const headersList = await headers();
  const locale = resolveLocale(headersList.get("accept-language"));
  const t = getStrings(locale);

  const article = await getArticleBySlug(slug);
  if (!article) notFound();

  const display = localizeArticle(article, locale);
  const jsonLd = blogPostingJsonLd({
    headline: display.title,
    description: display.dek,
    imageUrl: display.coverImageUrl,
    datePublished: display.publishedAt,
    url: `${SITE_URL}/blog/${display.slug}`,
  });

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10 sm:py-14 flex flex-col gap-5">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Link href="/blog" className="text-sm text-muted hover:text-accent transition-colors w-fit">
        {t.backToBlog}
      </Link>

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={display.coverImageUrl}
        alt=""
        className="w-full rounded-2xl border border-border object-cover max-h-96"
      />

      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">{display.title}</h1>
        <p className="text-base text-muted">{display.dek}</p>
        <div className="text-xs text-muted/70">
          {t.publishedLabel}: {new Date(display.publishedAt).toLocaleString(locale === "ru" ? "ru-RU" : "en-US")}
        </div>
      </div>

      <ArticleBody blocks={display.body} />

      {display.relatedTickers.length > 0 && (
        <div className="flex flex-wrap gap-2 border-t border-border pt-5 mt-2">
          {display.relatedTickers.map((ticker) => (
            <Link
              key={ticker}
              href={`/asset/${ticker}`}
              className="rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-medium text-muted hover:text-accent hover:border-accent/40 transition-colors"
            >
              {ticker}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
