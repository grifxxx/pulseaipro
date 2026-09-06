import { headers } from "next/headers";
import type { Metadata } from "next";
import { resolveLocale, getStrings } from "@/lib/i18n";
import { AUTHOR_PROJECTS } from "@/lib/author";

// SEO title/description pinned to Russian (see the comment in app/layout.tsx) and written
// separately from the on-page heading/intro so the search snippet can be clear and
// keyword-rich without cluttering the on-site copy.
export const metadata: Metadata = {
  title: "О проекте PulseAiPro — кто пишет статьи и на каких данных",
  description:
    "Автор проекта — Григорий Яцунов, около пяти лет торгует акциями, предприниматель и разработчик сервисов. Рассказываем, как готовятся разборы, откуда берутся данные и какую роль играет ИИ.",
  alternates: { canonical: "/about" },
};

export default async function AboutPage() {
  const headersList = await headers();
  const locale = resolveLocale(headersList.get("accept-language"));
  const t = getStrings(locale);

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10 sm:py-14 flex flex-col gap-4 text-sm leading-relaxed text-foreground/85">
      <h1 className="font-serif text-3xl sm:text-4xl font-semibold tracking-tight text-foreground">{t.aboutTitle}</h1>

      <p>{t.aboutIntro}</p>

      <div className="rounded-xl border border-warning/40 bg-warning-soft p-4 mt-2">
        <h2 className="text-base font-semibold text-foreground mb-1.5">
          {t.aboutNotAdviceTitle}
        </h2>
        <p>{t.aboutNotAdviceBody}</p>
      </div>

      <h2 className="font-serif text-xl font-semibold text-foreground mt-3">{t.aboutAuthorTitle}</h2>
      {t.aboutAuthorBody.map((paragraph, i) => (
        <p key={i}>{paragraph}</p>
      ))}

      <h3 className="text-base font-semibold text-foreground mt-3">{t.aboutProjectsTitle}</h3>
      <ul className="flex flex-col gap-1.5">
        {AUTHOR_PROJECTS.map((project) => (
          <li key={project.url} className="flex gap-2">
            <span className="text-accent select-none">•</span>
            <span>
              <a
                href={project.url}
                target="_blank"
                rel="noopener"
                className="font-medium text-foreground hover:text-accent transition-colors"
              >
                {project.name}
              </a>
              {" — "}
              {project.description[locale === "ru" ? "ru" : "en"]}
            </span>
          </li>
        ))}
      </ul>

      <h2 className="font-serif text-xl font-semibold text-foreground mt-3">{t.aboutSourcesTitle}</h2>
      <ul className="flex flex-col gap-1.5">
        {t.aboutSources.map((source, i) => (
          <li key={i} className="flex gap-2">
            <span className="text-accent select-none">•</span>
            <span>{source}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
