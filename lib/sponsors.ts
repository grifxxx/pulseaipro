/** Disclosed native-ad placements. Russian-only (`ru` locale) — the offers are RU financial
 * products a non-RU visitor couldn't use, and RU ad law requires the "Реклама" label + erid
 * marking token shown here, which only makes sense for a Russian-reading audience. */

export interface SponsorOffer {
  id: string;
  title: string;
  description: string;
  ctaLabel: string;
  url: string;
  advertiser: string;
  /** ORD marking token (erid). Required by RU ad-marking law for every placement — add it here
   * as soon as it's issued for an offer; until then the card simply omits that line. */
  erid?: string;
  /** The site owner's own service rather than a paid third-party placement. Changes what the
   * disclosure says: there is no advertiser paying us and no commission, but the reader is
   * still owed the fact that the site and the service belong to the same person. Self-promotion
   * of one's own services on one's own site is also not "реклама" under RU ad law, so these
   * carry no erid. */
  selfPromo?: boolean;
}

/** Offers that back a full sponsored article, keyed by that article's slug. Without this every
 * sponsored post showed the same hardcoded advertiser in its disclosure banner. */
export const OFFER_BY_ARTICLE_SLUG: Record<string, string> = {
  "avtosledovanie-tbank-obzor": "tbank-autofollow",
  "deklarium-nalog-s-kriptovalyuty": "deklarium",
};

export function offerForArticleSlug(slug: string): SponsorOffer | undefined {
  const id = OFFER_BY_ARTICLE_SLUG[slug];
  return id ? SPONSOR_OFFERS.find((o) => o.id === id) : undefined;
}

export const SPONSOR_OFFERS: SponsorOffer[] = [
  {
    id: "deklarium",
    title: "Деклариум",
    description:
      "Считает НДФЛ по криптовалюте и зарубежному брокерскому счёту и собирает готовую 3-НДФЛ. Расчёт бесплатный, платно только документы.",
    ctaLabel: "Посчитать налог",
    url: "https://deklarium.ru/",
    advertiser: "ИП Яцунов Григорий Владимирович",
    selfPromo: true,
  },
  {
    id: "tbank-invest",
    title: "Т-Инвестиции",
    description: "Брокерский счёт для торговли акциями, облигациями и валютой с приложением Т-Банка.",
    ctaLabel: "Открыть счёт",
    url: "https://tbank.ru/baf/5HWIWSMdUV9",
    advertiser: "АО «Т-Банк»",
  },
  {
    id: "tbank-autofollow",
    title: "Автоследование Т-Банк",
    description: "Автоматическое повторение сделок отобранных стратегий — без самостоятельного трейдинга.",
    ctaLabel: "Подключить",
    url: "https://tbank.ru/baf/41MFvtYcYmG",
    advertiser: "АО «Т-Банк»",
  },
  {
    id: "tbank-black-card",
    title: "Дебетовая карта Т-Банк Black МИР",
    description: "Кэшбэк до 30% у партнёров и бесплатное обслуживание при выполнении условий.",
    ctaLabel: "Оформить карту",
    url: "https://trk.ppdu.ru/click?uid=345433&oid=2203&erid=Kra23xCCG",
    advertiser: "АО «Т-Банк»",
    erid: "Kra23xCCG",
  },
  {
    id: "ozon-bank-card",
    title: "Дебетовая карта Ozon Банк",
    description: "Кэшбэк Ozon-баллами на покупки и бесплатное обслуживание карты.",
    ctaLabel: "Оформить карту",
    url: "https://trk.ppdu.ru/click/FRxXKpQc?erid=2SDnjcSQqFP",
    advertiser: "ООО «Озон Банк»",
    erid: "2SDnjcSQqFP",
  },
];

export type FeedCell<T> = { kind: "item"; item: T } | { kind: "sponsor"; offer: SponsorOffer };

/** Deterministic pick from a string key (ticker, article id, …) so the same page always shows
 * the same offer on reload, while different pages/articles rotate across the three offers. */
export function offerForKey(key: string): SponsorOffer {
  let sum = 0;
  for (let i = 0; i < key.length; i++) sum += key.charCodeAt(i);
  return SPONSOR_OFFERS[sum % SPONSOR_OFFERS.length];
}

/** Interleaves a labeled sponsor card every `everyN` items in a card grid. `rotationOffset`
 * (e.g. the page number) shifts which offer appears first so pagination doesn't repeat the
 * same ad in the same slot every time. */
export function interleaveSponsors<T>(items: T[], everyN: number, rotationOffset = 0): FeedCell<T>[] {
  const cells: FeedCell<T>[] = [];
  let sponsorCount = 0;
  items.forEach((item, i) => {
    cells.push({ kind: "item", item });
    if ((i + 1) % everyN === 0) {
      cells.push({ kind: "sponsor", offer: SPONSOR_OFFERS[(rotationOffset + sponsorCount) % SPONSOR_OFFERS.length] });
      sponsorCount++;
    }
  });
  return cells;
}
