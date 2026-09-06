import Link from "next/link";
import type { DisplayArticle, Locale } from "@/lib/types";
import { TOPICS, topicForSlug, type TopicId } from "@/lib/content/evergreen-topics";

/** One guide as an editorial list row: serif title, one-line dek, date. No cover image and no
 * coloured badge — the guides are meant to read like entries in a reference book, and the
 * title carries the search query, so it is the thing that should dominate. */
export function GuideRow({ article, locale }: { article: DisplayArticle; locale: Locale }) {
  return (
    <li className="group border-t border-border first:border-t-0">
      <Link href={`/blog/${article.slug}`} className="flex flex-col gap-1.5 py-5">
        <span className="font-serif text-xl sm:text-[22px] font-semibold leading-snug tracking-tight text-foreground group-hover:text-accent transition-colors">
          {article.title}
        </span>
        <span className="text-[15px] leading-relaxed text-foreground/75">{article.dek}</span>
        <span className="text-xs text-muted">
          {new Date(article.publishedAt).toLocaleDateString(locale === "ru" ? "ru-RU" : "en-US", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </span>
      </Link>
    </li>
  );
}

export function groupGuidesByTopic(articles: DisplayArticle[]): Map<TopicId, DisplayArticle[]> {
  const groups = new Map<TopicId, DisplayArticle[]>();
  for (const topic of TOPICS) groups.set(topic.id, []);
  for (const article of articles) {
    groups.get(topicForSlug(article.slug))!.push(article);
  }
  return groups;
}

/** Guides grouped under the three topic headings. Empty topics are skipped rather than shown
 * as "coming soon" — a heading with nothing under it just advertises what the site lacks. */
export function GuideSections({
  articles,
  locale,
  limitPerTopic,
}: {
  articles: DisplayArticle[];
  locale: Locale;
  limitPerTopic?: number;
}) {
  const groups = groupGuidesByTopic(articles);

  return (
    <div className="flex flex-col gap-10">
      {TOPICS.map((topic) => {
        const items = groups.get(topic.id) ?? [];
        if (items.length === 0) return null;
        const shown = limitPerTopic ? items.slice(0, limitPerTopic) : items;
        return (
          <section key={topic.id} className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,2.2fr)] md:gap-10">
            <div className="flex flex-col gap-1.5 md:sticky md:top-20 md:self-start">
              <h2 className="font-serif text-2xl font-semibold tracking-tight">{topic.label[locale]}</h2>
              <p className="text-sm leading-relaxed text-muted">{topic.description[locale]}</p>
            </div>
            <ul className="flex flex-col">
              {shown.map((article) => (
                <GuideRow key={article.id} article={article} locale={locale} />
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
