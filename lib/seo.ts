import type { ArticleKind } from "@/lib/types";
import { authorJsonLd } from "@/lib/author";

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(
  /\/$/,
  ""
);

export const SITE_NAME = "PulseAiPro";

/** Truncates to at most maxLength chars without cutting mid-word. */
export function truncateForDescription(text: string, maxLength = 155): string {
  if (text.length <= maxLength) return text;
  const cut = text.slice(0, maxLength);
  const lastSpace = cut.lastIndexOf(" ");
  return `${cut.slice(0, lastSpace > 0 ? lastSpace : maxLength).trimEnd()}…`;
}

/** Stable identifiers for the three entities this site keeps describing.
 *
 * Without them every page declared a fresh anonymous Organization and a fresh anonymous Person,
 * and a search engine had no way to tell that the "PulseAiPro" publishing one article is the
 * same one publishing the next, or that the author here is the person described on /about.
 * With @id it is one graph: the site, its publisher, and one named author. On a YMYL topic that
 * author entity is the part that has to be recognisable. */
export const WEBSITE_ID = `${SITE_URL}/#website`;
export const ORGANIZATION_ID = `${SITE_URL}/#organization`;
export const AUTHOR_ID = `${SITE_URL}/about#author`;

const SITE_DESCRIPTION =
  "Статьи и руководства по инвестициям, налогам и криптовалютам на понятном языке, плюс лента рыночных новостей — информационный контент, не инвестиционная рекомендация.";

/** Emitted once, in the root layout, so every page carries the site and publisher definitions
 * that the per-page schemas then reference by @id. */
export function siteGraphJsonLd() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": WEBSITE_ID,
        name: SITE_NAME,
        url: SITE_URL,
        description: SITE_DESCRIPTION,
        inLanguage: "ru-RU",
        publisher: { "@id": ORGANIZATION_ID },
      },
      {
        "@type": "Organization",
        "@id": ORGANIZATION_ID,
        name: SITE_NAME,
        url: SITE_URL,
        description: SITE_DESCRIPTION,
        logo: {
          "@type": "ImageObject",
          url: `${SITE_URL}/logo`,
          width: 512,
          height: 512,
        },
        founder: { "@id": AUTHOR_ID },
      },
    ],
  };
}

/** Which article kinds we let search engines index.
 *
 * Everything else — the daily market recaps, the satirical pieces, the periodic retrospectives —
 * is dated, near-identical in structure and obsolete within a day. Yandex crawled ~200 such pages
 * and kept 4, actively dropping the rest as low-value, which drags the whole domain down. They
 * stay on the site for readers and for the RSS/Zen feed, but they are no longer offered to search. */
export const INDEXABLE_ARTICLE_KINDS: ReadonlySet<ArticleKind> = new Set<ArticleKind>([
  "evergreen",
  "sponsored",
]);

export function isIndexableArticleKind(kind: ArticleKind): boolean {
  return INDEXABLE_ARTICLE_KINDS.has(kind);
}

/** Crawlable but not indexable: the crawler still follows the links out of the page (so it reaches
 * the evergreen guides), it just doesn't put the page itself in the index. Deliberately not a
 * robots.txt Disallow — a blocked page is never fetched, so the noindex would never be seen. */
export const NOINDEX_FOLLOW = { index: false, follow: true } as const;

export interface BreadcrumbItem {
  name: string;
  url: string;
}

/** BreadcrumbList structured data — lets search results (incl. Yandex) show a breadcrumb path
 * instead of a raw URL, and signals page hierarchy for indexing. */
export function breadcrumbJsonLd(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

interface AssetArticleInput {
  ticker: string;
  name: string;
  headline: string;
  description: string;
  datePublished: string;
  url: string;
}

export function faqPageJsonLd(qa: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: qa.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

interface BlogPostingInput {
  headline: string;
  description: string;
  imageUrl: string;
  datePublished: string;
  url: string;
  /** True for the evergreen guides, which carry the site author's byline and his Person markup.
   * Sponsored placements stay attributed to the organisation — signing an ad with a named
   * person's expertise would be a false signal. */
  authored?: boolean;
}

export function blogPostingJsonLd(input: BlogPostingInput) {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: input.headline,
    description: input.description,
    image: input.imageUrl,
    datePublished: input.datePublished,
    dateModified: input.datePublished,
    url: input.url,
    mainEntityOfPage: input.url,
    // By reference, not by value: the full Person lives on /about, the full Organization in the
    // root layout, and repeating either here would just create duplicate entities.
    author: input.authored ? { "@id": AUTHOR_ID } : { "@id": ORGANIZATION_ID },
    publisher: { "@id": ORGANIZATION_ID },
    isPartOf: { "@id": WEBSITE_ID },
  };
}

/** The full Person, emitted on /about — the page the author byline links to, and the one place
 * that should carry the whole description. Everything else points at it by @id. */
export function authorProfileJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    "@id": `${SITE_URL}/about`,
    isPartOf: { "@id": WEBSITE_ID },
    mainEntity: { ...authorJsonLd(SITE_URL), "@id": AUTHOR_ID },
  };
}

export function assetArticleJsonLd(input: AssetArticleInput) {
  return {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: input.headline,
    description: input.description,
    datePublished: input.datePublished,
    dateModified: input.datePublished,
    url: input.url,
    mainEntityOfPage: input.url,
    about: {
      "@type": "Thing",
      name: input.name,
      identifier: input.ticker,
    },
    author: { "@id": ORGANIZATION_ID },
    publisher: { "@id": ORGANIZATION_ID },
  };
}
