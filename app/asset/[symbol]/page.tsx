import { Fragment } from "react";
import { headers } from "next/headers";
import type { Metadata } from "next";
import { getAssetHistoryPage, getSentimentHistory } from "@/lib/db/queries";
import { AssetCard } from "@/components/AssetCard";
import { BlogPagination } from "@/components/BlogPagination";
import { PriceChart } from "@/components/PriceChart";
import { SentimentTrendChart } from "@/components/SentimentTrendChart";
import { SponsorCard } from "@/components/SponsorCard";
import { resolveLocale, getStrings, localizeNote } from "@/lib/i18n";
import { assetArticleJsonLd, breadcrumbJsonLd, SITE_URL, truncateForDescription } from "@/lib/seo";
import { offerForKey } from "@/lib/sponsors";
import Link from "next/link";
import { notFound } from "next/navigation";

export const revalidate = 0;

const PAGE_SIZE = 10;

type PageParams = {
  params: Promise<{ symbol: string }>;
  searchParams: Promise<{ page?: string }>;
};

export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  const { symbol } = await params;
  const { notes } = await getAssetHistoryPage(symbol, 1, 1);
  if (notes.length === 0) return {};

  const latest = notes[0];
  // description (incl. og:/twitter:) pinned to Russian — see the comment in app/layout.tsx.
  const title = `${latest.name} (${latest.ticker})`;
  const description = truncateForDescription(latest.summary.ru);

  return {
    title,
    description,
    alternates: { canonical: `/asset/${encodeURIComponent(latest.ticker)}` },
    openGraph: { title, description },
  };
}

export default async function AssetHistoryPage({ params, searchParams }: PageParams) {
  const { symbol } = await params;
  const { page: pageParam } = await searchParams;
  const requestedPage = Math.max(1, Number(pageParam) || 1);

  const headersList = await headers();
  const locale = resolveLocale(headersList.get("accept-language"));
  const t = getStrings(locale);

  // Separate from the page's own notes: the chart/JSON-LD/breadcrumbs must always reflect the
  // single most recent note, regardless of which history page is being viewed.
  const { notes: latestNotes } = await getAssetHistoryPage(symbol, 1, 1);
  if (latestNotes.length === 0) notFound();
  const latest = latestNotes[0];

  const { notes, totalCount, page } = await getAssetHistoryPage(symbol, requestedPage, PAGE_SIZE);
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const sentimentHistory = await getSentimentHistory(symbol);
  const jsonLd = assetArticleJsonLd({
    ticker: latest.ticker,
    name: latest.name,
    headline: `${latest.name} (${latest.ticker})`,
    description: latest.summary[locale],
    datePublished: latest.generatedAt,
    url: `${SITE_URL}/asset/${encodeURIComponent(latest.ticker)}`,
  });
  const breadcrumbs = breadcrumbJsonLd([
    { name: t.navFeed, url: SITE_URL },
    { name: `${latest.name} (${latest.ticker})`, url: `${SITE_URL}/asset/${encodeURIComponent(latest.ticker)}` },
  ]);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14 flex flex-col gap-4">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }}
      />
      <Link href="/" className="text-sm text-muted hover:text-accent transition-colors w-fit">
        {t.backToFeed}
      </Link>
      <h1 className="text-3xl font-bold tracking-tight">
        {latest.name} <span className="text-muted font-normal">({latest.ticker})</span>
      </h1>
      <p className="text-sm text-muted">{t.historySubtitle}</p>
      <PriceChart ticker={latest.ticker} market={latest.market} locale={locale} />
      <SentimentTrendChart points={sentimentHistory} locale={locale} />
      <div className="flex flex-col gap-4 mt-2">
        {notes.map((note, i) => (
          <Fragment key={note.id}>
            <AssetCard note={localizeNote(note, locale)} locale={locale} />
            {page === 1 && i === 0 && locale === "ru" && <SponsorCard offer={offerForKey(latest.ticker)} />}
          </Fragment>
        ))}
      </div>
      <BlogPagination currentPage={page} totalPages={totalPages} basePath={`/asset/${symbol}`} />
    </div>
  );
}
