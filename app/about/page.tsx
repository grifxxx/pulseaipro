import { headers } from "next/headers";
import type { Metadata } from "next";
import { resolveLocale, getStrings } from "@/lib/i18n";

// SEO title/description pinned to Russian (see the comment in app/layout.tsx) and written
// separately from the on-page heading/intro so the search snippet can be clear and
// keyword-rich without cluttering the on-site copy.
export const metadata: Metadata = {
  title: "Как работает PulseAiPro — сервис новостей акций и крипты",
  description:
    "PulseAiPro три раза в день собирает новости и рыночные данные по акциям США, российским акциям и криптовалютам, а ИИ готовит короткую сводку: что произошло, почему это важно и какие есть риски.",
  alternates: { canonical: "/about" },
};

export default async function AboutPage() {
  const headersList = await headers();
  const locale = resolveLocale(headersList.get("accept-language"));
  const t = getStrings(locale);

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10 sm:py-14 flex flex-col gap-4 text-sm leading-relaxed text-foreground/85">
      <h1 className="text-3xl font-bold tracking-tight text-foreground">{t.aboutTitle}</h1>

      <p>{t.aboutIntro}</p>

      <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 mt-2">
        <h2 className="text-base font-semibold text-foreground mb-1.5">
          {t.aboutNotAdviceTitle}
        </h2>
        <p>{t.aboutNotAdviceBody}</p>
      </div>

      <h2 className="text-lg font-semibold text-foreground mt-2">{t.aboutSourcesTitle}</h2>
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
