export type AssetType = "stock" | "crypto";

export type Market = "us_stock" | "ru_stock" | "crypto";

export type Sentiment = "bullish" | "bearish" | "neutral" | "mixed";

export type Locale = "ru" | "en";

export interface Localized<T> {
  ru: T;
  en: T;
}

export type WatchlistSource = "seed" | "trending" | "search";

export interface WatchlistAsset {
  symbol: string;
  name: string;
  assetType: AssetType;
  market: Market;
  /** How this asset entered the watchlist. Omit to leave the DB default ('seed') on upsert. */
  source?: WatchlistSource;
}

export interface PriceSnapshot {
  price: number;
  changePct24h: number | null;
  volume: number | null;
  marketCap: number | null;
  currency: string;
}

export interface RawNewsItem {
  title: string;
  url: string;
  publisher: string;
  publishedAt: string;
  summary?: string;
  relatedSymbols?: string[];
}

export interface AssetBundle {
  asset: WatchlistAsset;
  price: PriceSnapshot | null;
  news: RawNewsItem[];
}

export interface NoteSource {
  title: string;
  url: string;
  publisher: string;
  publishedAt: string;
}

export interface AttentionNote {
  ticker: string;
  name: string;
  category: AssetType;
  sentiment: Sentiment;
  sentimentScore: number;
  summary: Localized<string>;
  whyNotable: Localized<string>;
  keyFacts: Localized<string[]>;
  riskNotes: Localized<string>;
  sources: NoteSource[];
  notFinancialAdvice: true;
  generatedAt: string;
}

/** A note with all Localized<T> fields resolved to a single display language. */
export interface DisplayAttentionNote {
  id: string;
  ticker: string;
  name: string;
  category: AssetType;
  market: Market;
  logoUrl: string | null;
  sentiment: Sentiment;
  sentimentScore: number;
  summary: string;
  whyNotable: string;
  keyFacts: string[];
  riskNotes: string;
  sources: NoteSource[];
  generatedAt: string;
  priceSnapshot: PriceSnapshot | null;
}

export interface AttentionNoteRow extends AttentionNote {
  id: string;
  runId: string;
  assetId: string;
  market: Market;
  logoUrl: string | null;
  priceSnapshot: PriceSnapshot | null;
  createdAt: string;
}

export interface ArticleAssetWidget {
  ticker: string;
  name: string;
  market: Market;
  logoUrl: string | null;
  price: number | null;
  changePct: number | null;
  currency: string;
}

export type ArticleBlock =
  | { type: "heading"; text: Localized<string> }
  | { type: "paragraph"; text: Localized<string> }
  | ({ type: "asset" } & ArticleAssetWidget)
  | { type: "chart"; src: string; caption: Localized<string> };

export type ArticleKind = "daily" | "retrospective";
export type RetrospectivePeriod = "weekly" | "monthly" | "semiannual" | "yearly";

export interface Article {
  id: string;
  slug: string;
  kind: ArticleKind;
  market: Market | null;
  period: RetrospectivePeriod | null;
  title: Localized<string>;
  dek: Localized<string>;
  coverImageUrl: string;
  body: ArticleBlock[];
  relatedTickers: string[];
  publishedAt: string;
}

export type DisplayArticleBlock =
  | { type: "heading"; text: string }
  | { type: "paragraph"; text: string }
  | ({ type: "asset" } & ArticleAssetWidget)
  | { type: "chart"; src: string; caption: string };

export interface DisplayArticle {
  id: string;
  slug: string;
  kind: ArticleKind;
  market: Market | null;
  period: RetrospectivePeriod | null;
  title: string;
  dek: string;
  coverImageUrl: string;
  body: DisplayArticleBlock[];
  relatedTickers: string[];
  publishedAt: string;
}

export type PipelineRunStatus = "running" | "success" | "partial_failure" | "failed";

export interface PipelineRun {
  id: string;
  startedAt: string;
  finishedAt: string | null;
  status: PipelineRunStatus;
  assetsScanned: number | null;
  notesCreated: number | null;
  errorMessage: string | null;
  rawLog: Record<string, unknown> | null;
}
