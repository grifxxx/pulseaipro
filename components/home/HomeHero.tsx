import Link from "next/link";
import type { Locale } from "@/lib/types";
import { getStrings } from "@/lib/i18n";
import { AUTHOR_BIO, AUTHOR_NAME, AUTHOR_PROJECTS, AUTHOR_SOCIALS } from "@/lib/author";
import { AuthorAvatar } from "@/components/AuthorAvatar";

/** The hero carries the author rather than burying them at the bottom of the page.
 *
 * On a YMYL topic the first question a reader has is "who is telling me this", and the answer
 * being visible above the fold is worth more than any amount of copy underneath. On desktop the
 * author sits in a panel beside the headline; on mobile it follows it. */
export function HomeHero({
  locale,
  guideCount,
  assetCount,
}: {
  locale: Locale;
  guideCount: number;
  assetCount: number;
}) {
  const t = getStrings(locale);
  const bio = AUTHOR_BIO[locale];

  const stats = [
    guideCount > 0 ? t.homeStatGuides(guideCount) : null,
    assetCount > 0 ? t.homeStatAssets(assetCount) : null,
    t.homeStatUpdates,
    t.homeStatFree,
  ].filter((v): v is string => v !== null);

  return (
    <section className="grid gap-10 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] lg:gap-14 lg:items-start">
      <div className="flex flex-col gap-5 animate-rise">
        <span className="inline-flex w-fit items-center gap-2 rounded-full border border-accent/30 bg-accent-soft px-3 py-1 text-xs font-medium text-accent">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" />
          {t.homeKicker}
        </span>
        <h1 className="font-serif text-4xl sm:text-5xl lg:text-[56px] font-semibold leading-[1.05] tracking-tight">
          {t.homeHeroTitle}
        </h1>
        <p className="text-base sm:text-lg leading-relaxed text-foreground/75 max-w-xl">
          {t.homeHeroSubtitle}
        </p>
        <div className="flex flex-wrap gap-3 pt-1">
          <Link
            href="/blog"
            className="rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-accent-foreground hover:opacity-90 transition-opacity"
          >
            {t.homeCtaGuides}
          </Link>
          <Link
            href="/feed"
            className="rounded-full border border-border bg-surface px-5 py-2.5 text-sm font-medium hover:border-accent hover:text-accent transition-colors"
          >
            {t.homeCtaFeed}
          </Link>
        </div>
        <ul className="flex flex-wrap gap-x-5 gap-y-1.5 pt-2 text-xs text-muted">
          {stats.map((stat, i) => (
            <li key={stat} className="flex items-center gap-2 animate-rise" style={{ animationDelay: `${120 + i * 70}ms` }}>
              {i > 0 && <span aria-hidden="true" className="text-border">·</span>}
              {stat}
            </li>
          ))}
        </ul>
      </div>

      <aside
        className="rounded-2xl border border-border bg-surface p-6 flex flex-col gap-4 animate-rise lg:sticky lg:top-20"
        style={{ animationDelay: "160ms" }}
      >
        <div className="text-xs font-semibold uppercase tracking-wide text-muted">{t.homeAuthorTitle}</div>
        <div className="flex items-center gap-4">
          <AuthorAvatar size={64} />
          <div className="min-w-0">
            <Link
              href="/about"
              className="font-serif text-xl font-semibold tracking-tight hover:text-accent transition-colors"
            >
              {AUTHOR_NAME}
            </Link>
            <div className="text-sm text-muted">{bio.jobTitle}</div>
          </div>
        </div>
        <p className="text-[15px] leading-relaxed text-foreground/85">{bio.short}</p>
        <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
          {AUTHOR_SOCIALS.map((social) => (
            <li key={social.url}>
              <a
                href={social.url}
                target="_blank"
                rel="noopener"
                className="font-medium text-accent hover:opacity-80 transition-opacity"
              >
                {social.name}
              </a>
            </li>
          ))}
        </ul>
        <ul className="flex flex-col gap-1.5 border-t border-border pt-4 text-sm">
          {AUTHOR_PROJECTS.map((project) => (
            <li key={project.url}>
              <a
                href={project.url}
                target="_blank"
                rel="noopener"
                className="font-medium text-accent hover:opacity-80 transition-opacity"
              >
                {project.name}
              </a>
              <span className="text-muted"> — {project.description[locale]}</span>
            </li>
          ))}
        </ul>
        <p className="text-xs text-muted/80">{bio.disclosure}</p>
      </aside>
    </section>
  );
}
