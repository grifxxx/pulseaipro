import type { SponsorOffer } from "@/lib/sponsors";

/** A disclosed native-ad card — visually close to the surrounding content cards, but always
 * carries the "Реклама" label, advertiser name, and (once issued) the erid marking token, as
 * required by RU ad-marking law. Never render sponsor content without this wrapper. */
export function SponsorCard({ offer }: { offer: SponsorOffer }) {
  return (
    <a
      href={offer.url}
      target="_blank"
      rel="sponsored noopener noreferrer"
      className="group flex min-w-0 flex-col gap-3 rounded-2xl border border-amber-500/25 bg-amber-500/[0.04] p-5 transition-all hover:border-amber-500/45 hover:shadow-lg hover:shadow-black/[0.03] dark:hover:shadow-black/20"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="rounded-full bg-amber-500/15 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400">
          Реклама
        </span>
        <span className="text-xs font-medium text-muted group-hover:text-accent transition-colors">
          {offer.ctaLabel} →
        </span>
      </div>

      <div className="flex flex-col gap-1">
        <h3 className="font-semibold tracking-tight text-foreground">{offer.title}</h3>
        <p className="text-sm text-foreground/80 leading-relaxed">{offer.description}</p>
      </div>

      <div className="text-[10px] text-muted/70 border-t border-amber-500/15 pt-2.5">
        Рекламодатель: {offer.advertiser}
        {offer.erid ? ` · erid: ${offer.erid}` : ""}
      </div>
    </a>
  );
}
