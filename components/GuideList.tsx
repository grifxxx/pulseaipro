import Link from "next/link";
import type { DisplayArticle, Locale } from "@/lib/types";
import { GuideCard } from "@/components/GuideCard";
import { TOPICS, topicForSlug, type TopicId } from "@/lib/content/evergreen-topics";

/** A guide as a compact list row — no cover. Used where a card would be too heavy: the "read
 * next" block at the foot of an article and the sponsored group, both of which are asides to
 * whatever the reader actually came for. */
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

/** A plain grid of guide cards, newest first, each labelled with its topic. This is what the
 * homepage shows: with a handful of guides published, splitting them into three topic columns
 * left one article stranded beside a heading and a paragraph of empty space. */
export function GuideGrid({ articles, locale }: { articles: DisplayArticle[]; locale: Locale }) {
  return (
    <div className="grid gap-x-6 gap-y-9 sm:grid-cols-2 lg:grid-cols-3">
      {articles.map((article, i) => (
        <GuideCard key={article.id} article={article} locale={locale} priority={i < 3} />
      ))}
    </div>
  );
}

/** Guides grouped under the three topic headings, for the full listing at /blog.
 *
 * The heading runs full width above its cards rather than sitting in a narrow column beside
 * them: a two-column split only looks deliberate once each topic has enough articles to fill
 * the taller side, and until then it reads as a layout bug. Empty topics are skipped — a
 * heading with nothing under it just advertises what the site lacks. */
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
    <div className="flex flex-col gap-14">
      {TOPICS.map((topic) => {
        const items = groups.get(topic.id) ?? [];
        if (items.length === 0) return null;
        const shown = limitPerTopic ? items.slice(0, limitPerTopic) : items;
        return (
          <section key={topic.id} className="flex flex-col gap-6">
            <div className="flex flex-col gap-1.5 border-b border-border pb-4">
              <h2 className="font-serif text-2xl font-semibold tracking-tight">{topic.label[locale]}</h2>
              <p className="text-sm leading-relaxed text-muted max-w-2xl">{topic.description[locale]}</p>
            </div>
            <div className="grid gap-x-6 gap-y-9 sm:grid-cols-2 lg:grid-cols-3">
              {shown.map((article) => (
                <GuideCard key={article.id} article={article} locale={locale} showTopic={false} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
