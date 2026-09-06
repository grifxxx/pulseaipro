import { headers } from "next/headers";
import type { Metadata } from "next";
import Link from "next/link";
import { getLatestFeed } from "@/lib/db/queries";
import { getArticlesByKinds } from "@/lib/db/articles-queries";
import { TickerTape } from "@/components/TickerTape";
import { GuideSections } from "@/components/GuideList";
import { FocusStrip } from "@/components/FocusStrip";
import { AuthorCard } from "@/components/AuthorCard";
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
 * of "/" is to say what the site is, put every guide one click away under an anchor that is its
 * own search query, show the live feed as a reason to come back, and put the author's name on
 * the front page. It is also the most authoritative URL on the domain — a link from here is
 * worth more than a link from anywhere else on the site, and until now every one of them went
 * to a ticker page we have asked search engines to ignore. */
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

  return (
    <>
      <TickerTape notes={localizedNotes} />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-16 flex flex-col gap-14 sm:gap-16">
        <section className="flex flex-col gap-4 max-w-3xl">
          <h1 className="font-serif text-4xl sm:text-5xl font-semibold leading-[1.1] tracking-tight">
            {t.homeHeroTitle}
          </h1>
          <p className="text-base sm:text-lg leading-relaxed text-foreground/75 max-w-2xl">
            {t.homeHeroSubtitle}
          </p>
        </section>

        {localizedGuides.length > 0 && (
          <section className="flex flex-col gap-8">
            <GuideSections articles={localizedGuides} locale={locale} limitPerTopic={4} />
            <div>
              <Link
                href="/blog"
                className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium hover:border-accent hover:text-accent transition-colors"
              >
                {t.homeGuidesAll} →
              </Link>
            </div>
          </section>
        )}

        <FocusStrip notes={localizedNotes} locale={locale} />

        <AuthorCard locale={locale} title={t.homeAuthorTitle} />
      </div>
    </>
  );
}
