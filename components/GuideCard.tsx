import Image from "next/image";
import Link from "next/link";
import type { DisplayArticle, Locale } from "@/lib/types";
import { TOPICS, topicForSlug } from "@/lib/content/evergreen-topics";

/** A guide as a card with its cover.
 *
 * The cover is the article's own generated image, so it costs nothing extra to show and gives
 * the listing something to align to — a column of bare titles reads as a stub while there are
 * only a few of them. The title stays in the display serif and stays the largest thing on the
 * card: it carries the search query, and that is what a reader scans for. */
export function GuideCard({
  article,
  locale,
  showTopic = true,
  priority = false,
}: {
  article: DisplayArticle;
  locale: Locale;
  showTopic?: boolean;
  priority?: boolean;
}) {
  const topic = TOPICS.find((t) => t.id === topicForSlug(article.slug));

  return (
    <article className="group flex flex-col gap-3">
      <Link
        href={`/blog/${article.slug}`}
        className="relative block aspect-[16/10] overflow-hidden rounded-xl border border-border bg-surface-hover"
        tabIndex={-1}
        aria-hidden="true"
      >
        <Image
          src={article.coverImageUrl}
          alt=""
          fill
          sizes="(min-width: 1024px) 320px, (min-width: 640px) 45vw, 92vw"
          priority={priority}
          className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />
      </Link>
      <div className="flex flex-col gap-1.5">
        {showTopic && topic && (
          <span className="text-[11px] font-semibold uppercase tracking-wide text-accent">
            {topic.label[locale]}
          </span>
        )}
        <Link
          href={`/blog/${article.slug}`}
          className="font-serif text-lg sm:text-xl font-semibold leading-snug tracking-tight text-foreground group-hover:text-accent transition-colors"
        >
          {article.title}
        </Link>
        <p className="text-sm leading-relaxed text-foreground/75">{article.dek}</p>
        <time
          dateTime={article.publishedAt}
          className="text-xs text-muted"
        >
          {new Date(article.publishedAt).toLocaleDateString(locale === "ru" ? "ru-RU" : "en-US", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </time>
      </div>
    </article>
  );
}
