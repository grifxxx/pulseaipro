import Link from "next/link";
import type { Locale } from "@/lib/types";
import { getStrings } from "@/lib/i18n";

/** A few of the FAQ entries, on the homepage. Deliberately without FAQPage structured data —
 * /faq already carries that, and emitting the same questions twice on one domain competes with
 * itself for the same rich result. These are links into the page that owns them. */
export function FaqTeaser({ locale, limit = 4 }: { locale: Locale; limit?: number }) {
  const t = getStrings(locale);
  const items = t.faqItems.slice(0, limit);
  if (items.length === 0) return null;

  return (
    <section className="flex flex-col gap-5">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <h2 className="font-serif text-2xl font-semibold tracking-tight">{t.homeFaqTitle}</h2>
        <Link href="/faq" className="text-sm font-medium text-accent hover:opacity-80 transition-opacity">
          {t.homeFaqAll} →
        </Link>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {items.map((item, i) => (
          <details
            key={i}
            className="group rounded-xl border border-border bg-surface px-4 py-3 open:pb-4"
          >
            <summary className="cursor-pointer list-none text-[15px] font-medium text-foreground flex items-start justify-between gap-3">
              {item.question}
              <span className="text-muted transition-transform group-open:rotate-45 text-lg leading-none shrink-0">
                +
              </span>
            </summary>
            <p className="text-sm text-foreground/85 leading-relaxed mt-2">{item.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

/** The Telegram channel, as a plain invitation. The channel has two subscribers, so the card
 * deliberately promises what it delivers — new guides and notable moves — rather than dressing
 * up an empty room as a community. */
export function TelegramCta({ locale }: { locale: Locale }) {
  const t = getStrings(locale);
  return (
    <section className="rounded-2xl border border-accent/30 bg-accent-soft p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center gap-5 justify-between">
      <div className="flex flex-col gap-1.5">
        <h2 className="font-serif text-xl font-semibold tracking-tight">{t.homeTelegramTitle}</h2>
        <p className="text-[15px] leading-relaxed text-foreground/80 max-w-xl">{t.homeTelegramText}</p>
      </div>
      <a
        href="https://t.me/pulsaipro"
        target="_blank"
        rel="noopener"
        className="shrink-0 rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-accent-foreground hover:opacity-90 transition-opacity w-fit"
      >
        {t.homeTelegramCta}
      </a>
    </section>
  );
}
