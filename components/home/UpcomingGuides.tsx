import type { Locale } from "@/lib/types";
import { getStrings } from "@/lib/i18n";
import { EVERGREEN_TOPICS, TOPICS } from "@/lib/content/evergreen-topics";

/** The publishing queue, shown openly.
 *
 * With only a handful of guides out, a page that lists just those looks abandoned. This block
 * fills the gap with something true rather than filler: the next topics, in publication order,
 * with the measured search demand that put them in that order. It sets expectations for a
 * returning reader and doubles as a public commitment to a schedule. */
export function UpcomingGuides({
  publishedSlugs,
  locale,
  limit = 6,
}: {
  publishedSlugs: Set<string>;
  locale: Locale;
  limit?: number;
}) {
  const t = getStrings(locale);
  const upcoming = EVERGREEN_TOPICS.filter((topic) => !publishedSlugs.has(topic.slug)).slice(0, limit);
  if (upcoming.length === 0) return null;

  return (
    <section className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <h2 className="font-serif text-2xl font-semibold tracking-tight">{t.homeUpcomingTitle}</h2>
        <p className="text-sm text-muted max-w-2xl">{t.homeUpcomingHint}</p>
      </div>
      <ol className="grid gap-x-8 sm:grid-cols-2">
        {upcoming.map((topic, i) => {
          const section = TOPICS.find((s) => s.id === topic.topic);
          return (
            <li
              key={topic.slug}
              className="flex items-baseline gap-3 border-t border-border py-3.5"
            >
              <span className="font-mono text-xs text-muted/60 tabular-nums w-5 shrink-0">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] leading-snug text-foreground/85">
                  {topic.workingTitle}
                </span>
                <span className="mt-0.5 block text-xs text-muted">
                  {section?.label[locale]}
                  {i === 0 && (
                    <>
                      <span aria-hidden="true"> · </span>
                      <span className="text-accent font-medium">{t.homeUpcomingSoon}</span>
                    </>
                  )}
                </span>
              </span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
