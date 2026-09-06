import type { ArticleKind } from "@/lib/types";
import { creatorJsonLd } from "@/lib/author";

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

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    description:
      "Разборы и руководства по инвестициям, налогам и криптовалютам на понятном языке, плюс лента рыночных новостей — информационный контент, не инвестиционная рекомендация.",
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
  /** True for the model-written evergreen guides. They credit the organisation as author —
   * the text is machine-written, so a human name in that slot would be false — and name the
   * person who built and runs the pipeline as creator. */
  machineWritten?: boolean;
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
    author: {
      "@type": "Organization",
      name: SITE_NAME,
    },
    ...(input.machineWritten ? { creator: creatorJsonLd(SITE_URL) } : {}),
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
    },
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
    author: {
      "@type": "Organization",
      name: SITE_NAME,
    },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
    },
  };
}
