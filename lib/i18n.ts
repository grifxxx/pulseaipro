import type { Article, AttentionNoteRow, DisplayArticle, DisplayAttentionNote, Locale } from "@/lib/types";

/** Picks ru/en from an Accept-Language header value, defaulting to en. */
export function resolveLocale(acceptLanguage: string | null | undefined): Locale {
  if (!acceptLanguage) return "en";
  const first = acceptLanguage.split(",")[0]?.trim().toLowerCase() ?? "";
  return first.startsWith("ru") ? "ru" : "en";
}

export function localizeNote(note: AttentionNoteRow, locale: Locale): DisplayAttentionNote {
  return {
    id: note.id,
    ticker: note.ticker,
    name: note.name,
    category: note.category,
    market: note.market,
    logoUrl: note.logoUrl,
    sentiment: note.sentiment,
    sentimentScore: note.sentimentScore,
    summary: note.summary[locale],
    whyNotable: note.whyNotable[locale],
    keyFacts: note.keyFacts[locale],
    riskNotes: note.riskNotes[locale],
    sources: note.sources,
    generatedAt: note.generatedAt,
    priceSnapshot: note.priceSnapshot,
  };
}

export function localizeArticle(article: Article, locale: Locale): DisplayArticle {
  return {
    id: article.id,
    slug: article.slug,
    kind: article.kind,
    market: article.market,
    period: article.period,
    title: article.title[locale],
    dek: article.dek[locale],
    coverImageUrl: article.coverImageUrl,
    relatedTickers: article.relatedTickers,
    publishedAt: article.publishedAt,
    body: article.body.map((block) => {
      switch (block.type) {
        case "heading":
        case "paragraph":
          return { type: block.type, text: block.text[locale] };
        case "asset":
          return block;
        case "chart":
          return { type: "chart", src: block.src, caption: block.caption[locale] };
      }
    }),
  };
}

interface FaqItem {
  question: string;
  answer: string;
}

interface UIStrings {
  siteTitle: string;
  navFeed: string;
  navAbout: string;
  navFaq: string;
  navBlog: string;
  disclaimer: string;
  footerNote: string;
  liveBadge: string;
  homeTitle: string;
  homeSubtitle: string;
  loadErrorPrefix: string;
  loadErrorSuffix: string;
  emptyState: string;
  noResultsState: string;
  lookupCta: (query: string) => string;
  lookupButton: string;
  lookupLoading: string;
  lookupErrorNotFound: string;
  lookupErrorNoNews: string;
  lookupErrorRateLimited: string;
  whyNotableLabel: string;
  risksLabel: string;
  updatedLabel: string;
  stockLabel: string;
  cryptoLabel: string;
  usStockLabel: string;
  ruStockLabel: string;
  periodLabel: Record<"weekly" | "monthly" | "semiannual" | "yearly", string>;
  backToFeed: string;
  historySubtitle: string;
  sentiment: Record<"bullish" | "bearish" | "neutral" | "mixed", string>;
  searchPlaceholder: string;
  clearSearch: string;
  filterAll: string;
  filterUsStocks: string;
  filterRuStocks: string;
  filterCrypto: string;
  sentimentFilterLabel: string;
  sortLabel: string;
  sortNewest: string;
  sortChangeDesc: string;
  sortChangeAsc: string;
  sortAlpha: string;
  resultsCount: (n: number) => string;
  aboutTitle: string;
  aboutIntro: string;
  aboutNotAdviceTitle: string;
  aboutNotAdviceBody: string;
  aboutSourcesTitle: string;
  aboutSources: string[];
  faqTitle: string;
  faqSubtitle: string;
  faqItems: FaqItem[];
  blogTitle: string;
  blogSubtitle: string;
  blogEmptyState: string;
  readArticle: string;
  backToBlog: string;
  publishedLabel: string;
}

const STRINGS: Record<Locale, UIStrings> = {
  ru: {
    siteTitle: "PulseAiPro",
    navFeed: "Лента",
    navAbout: "О проекте",
    navFaq: "Вопросы",
    navBlog: "Блог",
    disclaimer:
      "Информационный контент, сгенерированный ИИ на основе новостей. Это не инвестиционная рекомендация и не призыв покупать или продавать активы. Всегда проводите собственный анализ.",
    footerNote: "PulseAiPro — информационный проект. Не инвестиционная рекомендация.",
    liveBadge: "Обновляется ежедневно",
    homeTitle: "Сегодня в центре внимания",
    homeSubtitle:
      "Активы, о которых сейчас пишут новости — с кратким разбором и ссылками на источники.",
    loadErrorPrefix: "Не удалось загрузить ленту",
    loadErrorSuffix:
      "Проверьте, что заданы переменные окружения Supabase и что миграция БД выполнена.",
    emptyState:
      "Пока нет ни одной записи — запустите пайплайн вручную или дождитесь планового запуска по расписанию.",
    noResultsState: "Ничего не найдено. Попробуйте изменить запрос или фильтры.",
    lookupCta: (query) => `«${query}» нет в ленте — поискать свежие новости по этому активу?`,
    lookupButton: "Искать актив",
    lookupLoading: "Ищем новости и котировки…",
    lookupErrorNotFound: "Не удалось найти такую акцию или монету. Проверьте написание.",
    lookupErrorNoNews: "Актив найден, но заметных новостей по нему сейчас нет.",
    lookupErrorRateLimited: "Слишком много запросов на поиск новых активов за последний час. Попробуйте позже.",
    whyNotableLabel: "Почему заметно",
    risksLabel: "Риски",
    updatedLabel: "Обновлено",
    stockLabel: "Акция",
    cryptoLabel: "Крипто",
    usStockLabel: "Акция США",
    ruStockLabel: "Акция РФ",
    periodLabel: {
      weekly: "Итоги недели",
      monthly: "Итоги месяца",
      semiannual: "Итоги полугодия",
      yearly: "Итоги года",
    },
    backToFeed: "← Назад к ленте",
    historySubtitle: "История записей за всё время, от новых к старым.",
    sentiment: {
      bullish: "Бычий настрой",
      bearish: "Медвежий настрой",
      neutral: "Нейтрально",
      mixed: "Смешанно",
    },
    searchPlaceholder: "Поиск по тикеру или названию…",
    clearSearch: "Очистить поиск",
    filterAll: "Все",
    filterUsStocks: "Акции США",
    filterRuStocks: "Акции РФ",
    filterCrypto: "Крипто",
    sentimentFilterLabel: "Настрой",
    sortLabel: "Сортировка",
    sortNewest: "Сначала новые",
    sortChangeDesc: "Сначала растущие",
    sortChangeAsc: "Сначала падающие",
    sortAlpha: "По алфавиту",
    resultsCount: (n) => `${n} ${n === 1 ? "актив" : n < 5 ? "актива" : "активов"}`,
    aboutTitle: "О проекте",
    aboutIntro:
      "Этот сайт раз в день автоматически собирает новости и рыночные данные по фиксированному списку акций (США и России) и криптовалют, после чего ИИ-модель формирует краткую сводку: что произошло, почему это может быть интересно, какие есть риски и на какие источники это опирается.",
    aboutNotAdviceTitle: "Это не инвестиционная рекомендация",
    aboutNotAdviceBody:
      "Материалы на сайте носят исключительно информационный и образовательный характер. Мы не являемся лицензированным инвестиционным советником и не даём указаний покупать, продавать или удерживать какие-либо активы. Модель прямо проинструктирована не формулировать такие призывы. Любые решения о сделках с активами — исключительно ваша ответственность; перед принятием решений проводите собственный анализ и при необходимости консультируйтесь с лицензированным специалистом.",
    aboutSourcesTitle: "Источники данных",
    aboutSources: [
      "Котировки акций США и новости по компаниям — Finnhub",
      "Котировки российских акций — Московская биржа (MOEX ISS API)",
      "Котировки и трендовые монеты крипторынка — CoinGecko",
      "Общие новости — RSS-ленты CoinDesk, Cointelegraph, Yahoo Finance, MarketWatch, Interfax, Smart-lab, Finam",
      "Синтез сводок — OpenAI, на основе только перечисленных источников",
    ],
    faqTitle: "Вопросы и ответы",
    faqSubtitle: "Коротко о том, как устроен PulseAiPro и как им пользоваться.",
    faqItems: [
      {
        question: "Что такое PulseAiPro?",
        answer:
          "PulseAiPro — сервис, который раз в день автоматически собирает новости и рыночные данные по акциям США, российским акциям и криптовалютам, а затем с помощью ИИ готовит краткую сводку по каждому заметному активу: что произошло и почему это важно.",
      },
      {
        question: "Это инвестиционная рекомендация?",
        answer:
          "Нет. Все материалы носят информационный и образовательный характер. Модель прямо проинструктирована не советовать покупать, продавать или удерживать активы. Любые решения — только на ваш собственный риск и после самостоятельного анализа.",
      },
      {
        question: "Откуда берутся данные?",
        answer:
          "Котировки акций США и новости по компаниям — из Finnhub. Котировки российских акций — с Московской биржи (MOEX). Крипта — из CoinGecko. Общие новости — из RSS-лент CoinDesk, Cointelegraph, Yahoo Finance, MarketWatch, Interfax, Smart-lab и Finam.",
      },
      {
        question: "Как часто обновляется лента?",
        answer:
          "Автоматически раз в день по расписанию. Владелец сервиса также может запустить обновление вручную в любой момент.",
      },
      {
        question: "Что значит «бычий», «медвежий», «смешанный» и «нейтральный» настрой?",
        answer:
          "Это оценка тональности новостного фона по активу за последний период, а не прогноз цены. «Бычий» — новости скорее позитивные, «медвежий» — скорее негативные, «смешанный» — присутствуют и те, и другие, «нейтральный» — существенного перекоса нет.",
      },
      {
        question: "Почему в карточках нет прямого совета «покупать» или «продавать»?",
        answer:
          "Потому что PulseAiPro — не инвестиционный советник. Мы намеренно ограничили модель формулировками уровня «что произошло» и «какие есть риски», без директив к действию.",
      },
      {
        question: "Как пользоваться поиском и фильтрами?",
        answer:
          "В строке поиска можно ввести тикер или название актива. Вкладками сверху лента делится на акции США, акции РФ и крипту. Чипсы настроения позволяют оставить только, например, «бычьи» активы, а сортировка — упорядочить по изменению цены, новизне или алфавиту.",
      },
      {
        question: "Планируется ли Telegram-бот?",
        answer:
          "Да, в планах — бот, который будет присылать те же сводки в Telegram на основе той же базы данных.",
      },
      {
        question: "Можно ли добавить новый актив в отслеживание?",
        answer:
          "Список активов сейчас фиксированный и настраивается владельцем сервиса на стороне сервера. Расширение списка — в планах.",
      },
    ],
    blogTitle: "Блог",
    blogSubtitle: "Ежедневные статьи по акциям США, российским акциям и крипте — с обложкой, графиком и разбором ключевых активов дня.",
    blogEmptyState: "Статей пока нет — они появляются по расписанию раз в день.",
    readArticle: "Читать статью",
    backToBlog: "← Назад к блогу",
    publishedLabel: "Опубликовано",
  },
  en: {
    siteTitle: "PulseAiPro",
    navFeed: "Feed",
    navAbout: "About",
    navFaq: "FAQ",
    navBlog: "Blog",
    disclaimer:
      "AI-generated informational content based on news coverage. This is not investment advice and not a recommendation to buy or sell any asset. Always do your own research.",
    footerNote: "PulseAiPro is an informational project. Not investment advice.",
    liveBadge: "Updated daily",
    homeTitle: "Notable today",
    homeSubtitle: "Assets currently in the news — with a short breakdown and source links.",
    loadErrorPrefix: "Couldn't load the feed",
    loadErrorSuffix: "Check that the Supabase env vars are set and the DB migration has run.",
    emptyState: "No entries yet — trigger the pipeline manually or wait for the next scheduled run.",
    noResultsState: "Nothing matches. Try a different search term or filters.",
    lookupCta: (query) => `"${query}" isn't in the feed yet — look up fresh news for it?`,
    lookupButton: "Look up asset",
    lookupLoading: "Fetching news and quotes…",
    lookupErrorNotFound: "Couldn't find a matching stock or coin. Check the spelling.",
    lookupErrorNoNews: "Found the asset, but there's no notable news for it right now.",
    lookupErrorRateLimited: "Too many new-asset lookups in the last hour. Try again later.",
    whyNotableLabel: "Why it's notable",
    risksLabel: "Risks",
    updatedLabel: "Updated",
    stockLabel: "Stock",
    cryptoLabel: "Crypto",
    usStockLabel: "US stock",
    ruStockLabel: "RU stock",
    periodLabel: {
      weekly: "Weekly review",
      monthly: "Monthly review",
      semiannual: "6-month review",
      yearly: "Yearly review",
    },
    backToFeed: "← Back to feed",
    historySubtitle: "Full history, newest first.",
    sentiment: {
      bullish: "Bullish",
      bearish: "Bearish",
      neutral: "Neutral",
      mixed: "Mixed",
    },
    searchPlaceholder: "Search by ticker or name…",
    clearSearch: "Clear search",
    filterAll: "All",
    filterUsStocks: "US stocks",
    filterRuStocks: "RU stocks",
    filterCrypto: "Crypto",
    sentimentFilterLabel: "Sentiment",
    sortLabel: "Sort",
    sortNewest: "Newest first",
    sortChangeDesc: "Top gainers",
    sortChangeAsc: "Top losers",
    sortAlpha: "Alphabetical",
    resultsCount: (n) => `${n} asset${n === 1 ? "" : "s"}`,
    aboutTitle: "About",
    aboutIntro:
      "This site automatically gathers news and market data once a day for a fixed watchlist of US stocks, Russian stocks, and cryptocurrencies, then an AI model produces a short note: what happened, why it might be interesting, what the risks are, and which sources it's based on.",
    aboutNotAdviceTitle: "This is not investment advice",
    aboutNotAdviceBody:
      "Content on this site is informational and educational only. We are not a licensed investment advisor and do not instruct anyone to buy, sell, or hold any asset. The model is explicitly instructed not to phrase things that way. Any decisions about trading assets are entirely your own responsibility — do your own research and consult a licensed professional where appropriate.",
    aboutSourcesTitle: "Data sources",
    aboutSources: [
      "US stock quotes and company news — Finnhub",
      "Russian stock quotes — Moscow Exchange (MOEX ISS API)",
      "Crypto prices and trending coins — CoinGecko",
      "General news — RSS feeds from CoinDesk, Cointelegraph, Yahoo Finance, MarketWatch, Interfax, Smart-lab, Finam",
      "Note synthesis — OpenAI, based only on the sources listed above",
    ],
    faqTitle: "Frequently asked questions",
    faqSubtitle: "A short explainer on how PulseAiPro works.",
    faqItems: [
      {
        question: "What is PulseAiPro?",
        answer:
          "PulseAiPro automatically gathers news and market data once a day for US stocks, Russian stocks, and cryptocurrencies, then uses AI to produce a short note per notable asset: what happened and why it matters.",
      },
      {
        question: "Is this investment advice?",
        answer:
          "No. All content is informational and educational only. The model is explicitly instructed never to recommend buying, selling, or holding any asset. Any decisions are entirely your own responsibility, made after your own research.",
      },
      {
        question: "Where does the data come from?",
        answer:
          "US stock quotes and company news come from Finnhub. Russian stock quotes come from the Moscow Exchange (MOEX). Crypto data comes from CoinGecko. General news comes from RSS feeds: CoinDesk, Cointelegraph, Yahoo Finance, MarketWatch, Interfax, Smart-lab, and Finam.",
      },
      {
        question: "How often does the feed update?",
        answer:
          "Automatically once a day on a schedule. The site owner can also trigger an update manually at any time.",
      },
      {
        question: "What do \"bullish\", \"bearish\", \"mixed\" and \"neutral\" mean?",
        answer:
          "It's an assessment of the news tone around an asset over the recent period, not a price prediction. \"Bullish\" means the coverage skews positive, \"bearish\" skews negative, \"mixed\" has both, and \"neutral\" has no strong skew.",
      },
      {
        question: "Why isn't there a direct \"buy\" or \"sell\" recommendation?",
        answer:
          "Because PulseAiPro is not an investment advisor. We deliberately constrain the model to \"what happened\" and \"what the risks are\" framing, without action directives.",
      },
      {
        question: "How do search and filters work?",
        answer:
          "The search box matches by ticker or asset name. Tabs at the top split the feed into US stocks, RU stocks, and crypto. Sentiment chips let you narrow down to, say, only \"bullish\" assets, and sort lets you order by price change, recency, or alphabetically.",
      },
      {
        question: "Is a Telegram bot planned?",
        answer: "Yes — a bot that sends the same notes to Telegram, reading from the same database, is planned.",
      },
      {
        question: "Can I add a new asset to track?",
        answer:
          "The watchlist is currently fixed and configured server-side by the site owner. Expanding it is on the roadmap.",
      },
    ],
    blogTitle: "Blog",
    blogSubtitle: "Daily articles on US stocks, Russian stocks, and crypto — with a cover image, a chart, and a rundown of the day's most notable assets.",
    blogEmptyState: "No articles yet — they're published once a day on a schedule.",
    readArticle: "Read article",
    backToBlog: "← Back to blog",
    publishedLabel: "Published",
  },
};

export function getStrings(locale: Locale): UIStrings {
  return STRINGS[locale];
}
