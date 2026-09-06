import Link from "next/link";
import type { Locale } from "@/lib/types";
import { AUTHOR_BIO, AUTHOR_NAME, AUTHOR_PROJECTS } from "@/lib/author";

/** The author, in one block that can sit on the homepage and under every guide. Says who he is,
 * what he has done, and — in smaller type — that the drafting is done by his system. The same
 * facts as the About page and the JSON-LD Person, never a different version of them. */
export function AuthorCard({
  locale,
  title,
  compact = false,
}: {
  locale: Locale;
  title?: string;
  compact?: boolean;
}) {
  const bio = AUTHOR_BIO[locale];
  const initials = AUTHOR_NAME.split(" ")
    .map((w) => w[0])
    .join("");

  return (
    <aside className={`rounded-2xl border border-border bg-surface ${compact ? "p-5" : "p-6 sm:p-8"}`}>
      {title && <div className="text-xs font-semibold uppercase tracking-wide text-muted mb-4">{title}</div>}
      <div className="flex gap-4 sm:gap-5">
        <div
          aria-hidden="true"
          className="flex h-12 w-12 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-full bg-accent-soft font-serif text-lg font-semibold text-accent"
        >
          {initials}
        </div>
        <div className="flex min-w-0 flex-col gap-2">
          <div>
            <Link href="/about" className="font-serif text-lg sm:text-xl font-semibold tracking-tight hover:text-accent transition-colors">
              {AUTHOR_NAME}
            </Link>
            <div className="text-sm text-muted">{bio.jobTitle}</div>
          </div>
          <p className="text-[15px] leading-relaxed text-foreground/85">{bio.short}</p>
          {!compact && (
            <ul className="flex flex-wrap gap-x-5 gap-y-1 text-sm">
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
          )}
          <p className="text-xs text-muted/80">{bio.disclosure}</p>
        </div>
      </div>
    </aside>
  );
}
