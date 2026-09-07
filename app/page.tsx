import { headers } from "next/headers";
import type { Metadata } from "next";
import Link from "next/link";
import { getLatestFeed } from "@/lib/db/queries";
import { getArticlesByKinds } from "@/lib/db/articles-queries";
import { TickerTape } from "@/components/TickerTape";
import { GuideGrid } from "@/components/GuideList";
import { HomeHero } from "@/components/home/HomeHero";
import { MarketPulse } from "@/components/home/MarketPulse";
import { UpcomingGuides } from "@/components/home/UpcomingGuides";
import { FaqTeaser, TelegramCta } from "@/components/home/HomeExtras";
import { resolveLocale, getStrings, localizeArticle, localizeNote } from "@/lib/i18n";
import type { Article, AttentionNoteRow } from "@/lib/types";

export const revalidate = 0;

export async function generateMetadata(): Promise<Metadata> {
  return {
    alternates: { canonical: "/" },
    // No title/description override: the homepage inherits the branded, keyword-rich default
    // from app/layout.tsx, which now describes the guides rather than the news feed.
  };
}

/** The homepage is a hub, not the feed. Search visitors land on the guides directly, so the job
 * of "/" is to say what the site is and who is behind it, put every guide one click away under
 * an anchor that is its own search query, and give a returning reader a reason to come back. It
 * is also the most authoritative URL on the domain — a link from here is worth more than a link
 * from anywhere else on the site, and until recently every one of them went to a ticker page we
 * have asked search engines to ignore. */
export default async function Home() {
  const headersList = await headers();
  const locale = resolveLocale(headersList.get("accept-language"));
  const t = getStrings(locale);

  let notes: AttentionNoteRow[] = [];
  let guides: Article[] = [];
  try {
    [notes, guides] = await Promise.all([getLatestFeed(), getArticlesByKinds(["evergreen"])]);
  } catch {
    // Either query failing leaves that section empty; the page still renders.
  }

  const localizedNotes = notes.map((n) => localizeNote(n, locale));
  const localizedGuides = guides.map((a) => localizeArticle(a, locale));
  const publishedSlugs = new Set(guides.map((a) => a.slug));

  return (
    <>
      <TickerTape notes={localizedNotes} />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-16 flex flex-col gap-16 sm:gap-20">
        <HomeHero locale={locale} guideCount={guides.length} assetCount={notes.length} />

        {localizedGuides.length > 0 && (
          <section className="flex flex-col gap-7">
            <div className="flex items-end justify-between gap-4 flex-wrap border-b border-border pb-4">
              <h2 className="font-serif text-2xl font-semibold tracking-tight">{t.blogTitle}</h2>
              <Link
                href="/blog"
                className="text-sm font-medium text-accent hover:opacity-80 transition-opacity"
              >
                {t.homeGuidesAll} →
              </Link>
            </div>
            <GuideGrid articles={localizedGuides.slice(0, 6)} locale={locale} />
          </section>
        )}

        <UpcomingGuides publishedSlugs={publishedSlugs} locale={locale} />

        <MarketPulse notes={localizedNotes} locale={locale} />

        <FaqTeaser locale={locale} />

        <TelegramCta locale={locale} />
      </div>
    </>
  );
}
