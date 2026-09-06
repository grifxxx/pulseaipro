import { headers } from "next/headers";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getArticleBySlug, getArticlesByKinds } from "@/lib/db/articles-queries";
import { ArticleBody } from "@/components/ArticleBody";
import { AuthorCard } from "@/components/AuthorCard";
import { GuideRow } from "@/components/GuideList";
import { ShareButtons } from "@/components/ShareButtons";
import { SponsorCard } from "@/components/SponsorCard";
import { TableOfContents } from "@/components/TableOfContents";
import { resolveLocale, getStrings, localizeArticle } from "@/lib/i18n";
import {
  blogPostingJsonLd,
  breadcrumbJsonLd,
  isIndexableArticleKind,
  NOINDEX_FOLLOW,
  SITE_URL,
  truncateForDescription,
} from "@/lib/seo";
import { AUTHOR_BIO, AUTHOR_NAME } from "@/lib/author";
import { offerForArticleSlug, offerForKey } from "@/lib/sponsors";
import { TOPICS, topicForSlug } from "@/lib/content/evergreen-topics";
import type { Article } from "@/lib/types";

export const revalidate = 0;

type PageParams = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) return {};

  // title/description (incl. og:/twitter:, which inherit these) pinned to Russian —
  // see the comment in app/layout.tsx.
  const title = article.title.ru;
  const description = truncateForDescription(article.dek.ru);

  return {
    title,
    description,
    alternates: { canonical: `/blog/${article.slug}` },
    openGraph: { title, description, images: [article.coverImageUrl] },
    ...(isIndexableArticleKind(article.kind) ? {} : { robots: NOINDEX_FOLLOW }),
  };
}

/** Up to three other guides to read next: same topic first, then the newest of the rest. This is
 * the internal linking the site had none of — ИИС-3 and the ИИС-deduction guide are written as
 * a deliberate pair and have to point at each other. */
async function relatedGuides(current: Article): Promise<Article[]> {
  if (current.kind !== "evergreen") return [];
  const all = (await getArticlesByKinds(["evergreen"])).filter((a) => a.id !== current.id);
  const topic = topicForSlug(current.slug);
  const sameTopic = all.filter((a) => topicForSlug(a.slug) === topic);
  const others = all.filter((a) => topicForSlug(a.slug) !== topic);
  return [...sameTopic, ...others].slice(0, 3);
}

export default async function ArticlePage({ params }: PageParams) {
  const { slug } = await params;
  const headersList = await headers();
  const locale = resolveLocale(headersList.get("accept-language"));
  const t = getStrings(locale);

  const article = await getArticleBySlug(slug);
  if (!article) notFound();

  const display = localizeArticle(article, locale);
  const isSponsored = article.kind === "sponsored";
  const isGuide = article.kind === "evergreen";
  const sponsoredOffer = isSponsored ? offerForArticleSlug(article.slug) : undefined;
  const topic = isGuide ? TOPICS.find((tp) => tp.id === topicForSlug(article.slug)) : undefined;
  const related = await relatedGuides(article);

  const jsonLd = blogPostingJsonLd({
    headline: display.title,
    description: display.dek,
    imageUrl: display.coverImageUrl,
    datePublished: display.publishedAt,
    url: `${SITE_URL}/blog/${display.slug}`,
    authored: isGuide,
  });
  const breadcrumbs = breadcrumbJsonLd([
    { name: t.siteTitle, url: SITE_URL },
    { name: t.navBlog, url: `${SITE_URL}/blog` },
    { name: display.title, url: `${SITE_URL}/blog/${display.slug}` },
  ]);

  const dateLabel = new Date(display.publishedAt).toLocaleDateString(locale === "ru" ? "ru-RU" : "en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10 sm:py-14 flex flex-col gap-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }}
      />

      <div className="flex items-center gap-2 text-sm text-muted">
        <Link href="/blog" className="hover:text-accent transition-colors">
          {t.navBlog}
        </Link>
        {topic && (
          <>
            <span aria-hidden="true">/</span>
            <span>{topic.label[locale]}</span>
          </>
        )}
      </div>

      <div className="flex flex-col gap-4">
        {isSponsored &&
          (sponsoredOffer?.selfPromo ? (
            <div className="rounded-xl border border-accent/30 bg-accent-soft px-4 py-3 text-sm text-foreground/85">
              <span className="font-semibold">Материал о собственном сервисе.</span>{" "}
              {sponsoredOffer.title} — проект того же владельца, что и этот сайт (
              {sponsoredOffer.advertiser}). Комиссию от третьих лиц мы за него не получаем, но
              заинтересованы в том, чтобы вы им воспользовались, — учитывайте это при чтении.
            </div>
          ) : (
            <div className="rounded-xl border border-warning/40 bg-warning-soft px-4 py-3 text-sm text-foreground/85">
              <span className="font-semibold">Партнёрский материал · Реклама.</span> Мы получаем
              вознаграждение, если вы воспользуетесь предложением по ссылкам в этой статье.
              {sponsoredOffer ? ` Рекламодатель: ${sponsoredOffer.advertiser}.` : ""}
            </div>
          ))}
        <h1 className="font-serif text-3xl sm:text-[40px] font-semibold leading-[1.15] tracking-tight">
          {display.title}
        </h1>
        <p className="text-base sm:text-lg leading-relaxed text-foreground/75">{display.dek}</p>

        {isGuide && (
          <div className="flex flex-col gap-0.5 border-l-2 border-accent/40 pl-3">
            <div className="text-sm">
              <Link href="/about" className="font-semibold text-foreground hover:text-accent transition-colors">
                {AUTHOR_NAME}
              </Link>
              <span className="text-muted"> — {AUTHOR_BIO[locale].short}</span>
            </div>
            <div className="text-xs text-muted/80">{AUTHOR_BIO[locale].disclosure}</div>
          </div>
        )}

        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="text-xs text-muted">
            {t.publishedLabel}: {dateLabel}
          </div>
          <ShareButtons url={`${SITE_URL}/blog/${display.slug}`} title={display.title} label={t.shareLabel} />
        </div>
      </div>

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={display.coverImageUrl}
        alt={display.title}
        className="w-full rounded-2xl border border-border object-cover max-h-80"
      />

      {isGuide && <TableOfContents blocks={display.body} title={t.tocTitle} />}

      {sponsoredOffer && <SponsorCard offer={sponsoredOffer} />}
      {locale === "ru" && !isSponsored && <SponsorCard offer={offerForKey(article.id)} />}

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

      {isGuide && <AuthorCard locale={locale} compact />}

      {related.length > 0 && (
        <section className="flex flex-col gap-2 border-t border-border pt-6">
          <h2 className="font-serif text-2xl font-semibold tracking-tight">{t.relatedTitle}</h2>
          <ul className="flex flex-col">
            {related.map((a) => (
              <GuideRow key={a.id} article={localizeArticle(a, locale)} locale={locale} />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
