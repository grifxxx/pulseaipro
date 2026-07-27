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
      "Daily AI-generated summaries of what's moving stocks and crypto in the news — informational only, not investment advice.",
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
