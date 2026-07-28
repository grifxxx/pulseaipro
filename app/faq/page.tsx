import { headers } from "next/headers";
import type { Metadata } from "next";
import { resolveLocale, getStrings } from "@/lib/i18n";
import { faqPageJsonLd } from "@/lib/seo";

// title/description pinned to Russian — see the comment in app/layout.tsx.
export const metadata: Metadata = {
  title: getStrings("ru").faqTitle,
  description: getStrings("ru").faqSubtitle,
  alternates: { canonical: "/faq" },
};

export default async function FaqPage() {
  const headersList = await headers();
  const locale = resolveLocale(headersList.get("accept-language"));
  const t = getStrings(locale);
  const jsonLd = faqPageJsonLd(t.faqItems);

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10 sm:py-14 flex flex-col gap-4">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <h1 className="text-3xl font-bold tracking-tight text-foreground">{t.faqTitle}</h1>
      <p className="text-sm text-muted">{t.faqSubtitle}</p>

      <div className="flex flex-col gap-2 mt-2">
        {t.faqItems.map((item, i) => (
          <details
            key={i}
            className="group rounded-xl border border-border bg-surface px-4 py-3 open:pb-4"
          >
            <summary className="cursor-pointer list-none font-medium text-foreground flex items-center justify-between gap-3">
              {item.question}
              <span className="text-muted transition-transform group-open:rotate-45 text-lg leading-none shrink-0">
                +
              </span>
            </summary>
            <p className="text-sm text-foreground/85 leading-relaxed mt-2">{item.answer}</p>
          </details>
        ))}
      </div>
    </div>
  );
}
