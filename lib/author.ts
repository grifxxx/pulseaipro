import { LEGAL_EMAIL } from "@/lib/legal";

/** The site's author.
 *
 * Finance is a YMYL topic, so a named person with real, checkable experience standing behind the
 * material is worth more than any amount of on-page optimisation. He is the author in the sense
 * that matters: he sets each guide's topic, outline and requirements, and answers for what goes
 * live under his name.
 *
 * The AI disclosure below stays regardless. Drafts are produced by the pipeline he built, and
 * saying so costs nothing — search engines penalise *undisclosed* machine-written content far
 * more heavily than disclosed content, and a reader who discovers it themselves trusts the site
 * less than one who was told up front. */
export const AUTHOR_NAME = "Григорий Яцунов";
export const AUTHOR_EMAIL = LEGAL_EMAIL;
export const AUTHOR_URL = "/about";

/** Author portrait, served from /public. Square, so every crop of it stays centred. */
export const AUTHOR_AVATAR = "/author.jpg";

export const AUTHOR_BIO = {
  ru: {
    jobTitle: "предприниматель, разработчик веб-сервисов",
    short: "Около пяти лет торгует акциями на бирже. Предприниматель, разрабатывает веб-сервисы.",
    disclosure:
      "Статьи готовит ИИ-система проекта — тема, план и требования к материалу задаются автором.",
  },
  en: {
    jobTitle: "entrepreneur, web services developer",
    short: "Around five years of trading stocks. Entrepreneur, builds web services.",
    disclosure:
      "Guides are drafted by the project's own AI system — the topic, outline and requirements are set by the author.",
  },
} as const;

/** Public profiles. These go into sameAs, which is how a search engine ties the Person on this
 * site to the same person elsewhere — the single most useful thing a small site can do to make
 * an author entity recognisable. */
export const AUTHOR_SOCIALS = [{ url: "https://vk.ru/grigorijyatc", name: "ВКонтакте" }] as const;

/** Other projects by the same person, linked from the author block and emitted as sameAs.
 *
 * Deliberately only the two that support the claim a reader is weighing here — one is literally
 * about crypto and broker taxes, the other is a working analytics service. The rest of his sites
 * (esoterica, a pet encyclopedia, a lingerie shop) are real but off-topic, and linking them from
 * the author block of a YMYL finance page dilutes the signal rather than adding to it. */
export const AUTHOR_PROJECTS = [
  {
    url: "https://deklarium.ru/",
    name: "Деклариум",
    description: { ru: "декларация 3-НДФЛ по криптовалюте и брокерским счетам", en: "Russian tax filing for crypto and brokerage accounts" },
  },
  {
    url: "https://sellops.ru/",
    name: "Sellops",
    description: { ru: "сервис аналитики Ozon: юнит-экономика и продажи", en: "Ozon marketplace analytics: unit economics and sales" },
  },
] as const;

export function authorJsonLd(siteUrl: string) {
  return {
    "@type": "Person",
    name: AUTHOR_NAME,
    email: AUTHOR_EMAIL,
    url: `${siteUrl}${AUTHOR_URL}`,
    image: `${siteUrl}${AUTHOR_AVATAR}`,
    jobTitle: AUTHOR_BIO.ru.jobTitle,
    description: AUTHOR_BIO.ru.short,
    knowsAbout: ["Инвестиции", "Фондовый рынок", "Криптовалюты", "Налогообложение инвестиций"],
    sameAs: [...AUTHOR_SOCIALS.map((s) => s.url), ...AUTHOR_PROJECTS.map((p) => p.url)],
  };
}
