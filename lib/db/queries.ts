import { cache } from "react";
import { getPublicClient, getServiceClient } from "@/lib/db/supabase-client";
import { submitToIndexNow } from "@/lib/indexnow";
import {
  postNotableNotesToChannel,
  notifyWatchlistUsers,
  sendPriceAlerts,
  NOTABLE_SENTIMENT_THRESHOLD,
} from "@/lib/notify";
import { SITE_URL } from "@/lib/seo";
import type {
  AttentionNote,
  AttentionNoteRow,
  PipelineRunStatus,
  PriceSnapshot,
  WatchlistAsset,
} from "@/lib/types";

export interface WatchlistAssetRow extends WatchlistAsset {
  id: string;
  logoUrl: string | null;
}

/** Seeds/upserts the watchlist. Safe to call repeatedly (idempotent on symbol+asset_type). */
export async function upsertWatchlist(assets: WatchlistAsset[]): Promise<void> {
  const db = getServiceClient();
  const rows = assets.map((a) => ({
    symbol: a.symbol,
    name: a.name,
    asset_type: a.assetType,
    market: a.market,
  }));
  const { error } = await db.from("watchlist_assets").upsert(rows, { onConflict: "symbol,asset_type" });
  if (error) throw new Error(`upsertWatchlist failed: ${error.message}`);
}

export async function getActiveWatchlist(): Promise<WatchlistAssetRow[]> {
  const db = getServiceClient();
  const { data, error } = await db
    .from("watchlist_assets")
    .select("id, symbol, name, asset_type, market, logo_url")
    .eq("is_active", true);
  if (error) throw new Error(`getActiveWatchlist failed: ${error.message}`);
  return (data ?? []).map((r) => ({
    id: r.id,
    symbol: r.symbol,
    name: r.name,
    assetType: r.asset_type,
    market: r.market,
    logoUrl: r.logo_url,
  }));
}

/** Ensures a (possibly dynamically-discovered, e.g. trending/search) asset exists in the watchlist and returns its row. */
export async function ensureAsset(asset: WatchlistAsset): Promise<WatchlistAssetRow> {
  const db = getServiceClient();
  const { data, error } = await db
    .from("watchlist_assets")
    .upsert(
      {
        symbol: asset.symbol,
        name: asset.name,
        asset_type: asset.assetType,
        market: asset.market,
        ...(asset.source ? { source: asset.source } : {}),
      },
      { onConflict: "symbol,asset_type" }
    )
    .select("id, symbol, name, asset_type, market, logo_url, source")
    .single();
  if (error) throw new Error(`ensureAsset failed: ${error.message}`);
  return {
    id: data.id,
    symbol: data.symbol,
    name: data.name,
    assetType: data.asset_type,
    market: data.market,
    logoUrl: data.logo_url,
    source: data.source,
  };
}

/** Assets discovered via user search, for permanent inclusion in the daily pipeline. */
export async function getWatchlistBySource(source: "search"): Promise<WatchlistAssetRow[]> {
  const db = getServiceClient();
  const { data, error } = await db
    .from("watchlist_assets")
    .select("id, symbol, name, asset_type, market, logo_url, source")
    .eq("source", source)
    .eq("is_active", true);
  if (error) throw new Error(`getWatchlistBySource failed: ${error.message}`);
  return (data ?? []).map((r) => ({
    id: r.id,
    symbol: r.symbol,
    name: r.name,
    assetType: r.asset_type,
    market: r.market,
    logoUrl: r.logo_url,
    source: r.source,
  }));
}

/** Global rate-limit check for the on-demand lookup endpoint: counts lookups in the last hour. */
export async function countRecentLookups(sinceMinutesAgo: number): Promise<number> {
  const db = getServiceClient();
  const since = new Date(Date.now() - sinceMinutesAgo * 60_000).toISOString();
  const { count, error } = await db
    .from("lookup_log")
    .select("id", { count: "exact", head: true })
    .gte("created_at", since);
  if (error) throw new Error(`countRecentLookups failed: ${error.message}`);
  return count ?? 0;
}

export async function recordLookup(query: string): Promise<void> {
  const db = getServiceClient();
  const { error } = await db.from("lookup_log").insert({ query });
  if (error) throw new Error(`recordLookup failed: ${error.message}`);
}

/** Sets the cached logo URL for an asset (Finnhub profile logo, CoinGecko coin image, etc). */
export async function updateAssetLogo(assetId: string, logoUrl: string): Promise<void> {
  const db = getServiceClient();
  const { error } = await db.from("watchlist_assets").update({ logo_url: logoUrl }).eq("id", assetId);
  if (error) throw new Error(`updateAssetLogo failed: ${error.message}`);
}

export async function createPipelineRun(): Promise<string> {
  const db = getServiceClient();
  const { data, error } = await db
    .from("pipeline_runs")
    .insert({ status: "running" })
    .select("id")
    .single();
  if (error) throw new Error(`createPipelineRun failed: ${error.message}`);
  return data.id;
}

export async function finishPipelineRun(
  runId: string,
  patch: {
    status: PipelineRunStatus;
    assetsScanned: number;
    notesCreated: number;
    errorMessage?: string;
    rawLog?: Record<string, unknown>;
  }
): Promise<void> {
  const db = getServiceClient();
  const { error } = await db
    .from("pipeline_runs")
    .update({
      finished_at: new Date().toISOString(),
      status: patch.status,
      assets_scanned: patch.assetsScanned,
      notes_created: patch.notesCreated,
      error_message: patch.errorMessage ?? null,
      raw_log: patch.rawLog ?? null,
    })
    .eq("id", runId);
  if (error) throw new Error(`finishPipelineRun failed: ${error.message}`);
}

export async function insertAttentionNotes(
  runId: string,
  entries: { note: AttentionNote; assetId: string; priceSnapshot: PriceSnapshot | null }[]
): Promise<number> {
  if (entries.length === 0) return 0;
  const db = getServiceClient();
  const rows = entries.map(({ note, assetId, priceSnapshot }) => ({
    run_id: runId,
    asset_id: assetId,
    symbol: note.ticker,
    name: note.name,
    category: note.category,
    sentiment: note.sentiment,
    sentiment_score: note.sentimentScore,
    summary: note.summary,
    why_notable: note.whyNotable,
    key_facts: note.keyFacts,
    risk_notes: note.riskNotes,
    sources: note.sources,
    price_snapshot: priceSnapshot,
    generated_at: note.generatedAt,
  }));
  const { error } = await db.from("attention_notes").insert(rows);
  if (error) throw new Error(`insertAttentionNotes failed: ${error.message}`);

  const tickers = [...new Set(entries.map((e) => e.note.ticker))];
  // Awaited (not fire-and-forget): the serverless function returns as soon as its caller stops
  // awaiting, which can kill an in-flight request before it completes.
  await submitToIndexNow([
    SITE_URL,
    `${SITE_URL}/sitemap.xml`,
    ...tickers.map((t) => `${SITE_URL}/asset/${encodeURIComponent(t)}`),
  ]);

  await postNotableNotesToChannel(
    entries.map(({ note }) => ({
      ticker: note.ticker,
      name: note.name,
      sentiment: note.sentiment,
      sentimentScore: note.sentimentScore,
      summary: note.summary.ru,
      url: `${SITE_URL}/asset/${encodeURIComponent(note.ticker)}`,
    }))
  );

  const assetIds = [...new Set(entries.map((e) => e.assetId))];
  const chatIdsByAsset = await getWatchlistChatIdsByAsset(assetIds);
  if (chatIdsByAsset.size > 0) {
    await notifyWatchlistUsers(
      entries.flatMap(({ note, assetId }) =>
        (chatIdsByAsset.get(assetId) ?? []).map((chatId) => ({
          chatId,
          ticker: note.ticker,
          name: note.name,
          sentiment: note.sentiment,
          summary: note.summary.ru,
          url: `${SITE_URL}/asset/${encodeURIComponent(note.ticker)}`,
        }))
      )
    );
  }

  return rows.length;
}

interface WatchlistSubscriber {
  assetId: string;
  userId: string;
  chatId: number;
}

/** Users who have each asset in "Избранное" AND have linked Telegram — two queries rather than
 * a nested select, since user_watchlist and telegram_links both reference auth.users but
 * aren't FK-linked to each other. */
async function getWatchlistSubscribers(assetIds: string[]): Promise<WatchlistSubscriber[]> {
  if (assetIds.length === 0) return [];
  const db = getServiceClient();

  const { data: watchRows, error: watchError } = await db
    .from("user_watchlist")
    .select("asset_id, user_id")
    .in("asset_id", assetIds);
  if (watchError) throw new Error(`getWatchlistSubscribers failed: ${watchError.message}`);
  if (!watchRows || watchRows.length === 0) return [];

  const userIds = [...new Set(watchRows.map((r) => r.user_id as string))];
  const { data: linkRows, error: linkError } = await db
    .from("telegram_links")
    .select("user_id, chat_id")
    .in("user_id", userIds);
  if (linkError) throw new Error(`getWatchlistSubscribers failed: ${linkError.message}`);

  const chatIdByUser = new Map((linkRows ?? []).map((r) => [r.user_id as string, r.chat_id as number]));

  const subscribers: WatchlistSubscriber[] = [];
  for (const row of watchRows) {
    const chatId = chatIdByUser.get(row.user_id as string);
    if (chatId == null) continue;
    subscribers.push({ assetId: row.asset_id as string, userId: row.user_id as string, chatId });
  }
  return subscribers;
}

async function getWatchlistChatIdsByAsset(assetIds: string[]): Promise<Map<string, number[]>> {
  const subscribers = await getWatchlistSubscribers(assetIds);
  const map = new Map<string, number[]>();
  for (const s of subscribers) {
    map.set(s.assetId, [...(map.get(s.assetId) ?? []), s.chatId]);
  }
  return map;
}

// A 24h move of at least this magnitude is worth a DM. Cooldown keeps a price that stays
// elevated across many pipeline runs (3x/day) from re-alerting every single run.
const PRICE_ALERT_THRESHOLD_PCT = 5;
const PRICE_ALERT_COOLDOWN_HOURS = 20;

export interface PriceAlertCandidate {
  assetId: string;
  ticker: string;
  name: string;
  price: PriceSnapshot;
}

/** Checks every watchlisted asset's fresh price snapshot against PRICE_ALERT_THRESHOLD_PCT and
 * DMs subscribed, Telegram-linked users — independent of whether the asset got a note this run,
 * since price data is fetched for the whole watchlist every run regardless. */
export async function checkPriceAlerts(candidates: PriceAlertCandidate[]): Promise<void> {
  const triggered = candidates.filter(
    (c) => c.price.changePct24h != null && Math.abs(c.price.changePct24h) >= PRICE_ALERT_THRESHOLD_PCT
  );
  if (triggered.length === 0) return;

  const assetIds = [...new Set(triggered.map((c) => c.assetId))];
  const subscribers = await getWatchlistSubscribers(assetIds);
  if (subscribers.length === 0) return;

  const db = getServiceClient();
  const { data: stateRows, error: stateError } = await db
    .from("price_alert_state")
    .select("user_id, asset_id, last_alert_at")
    .in("asset_id", assetIds);
  if (stateError) throw new Error(`checkPriceAlerts failed: ${stateError.message}`);

  const lastAlertByPair = new Map(
    (stateRows ?? []).map((r) => [`${r.user_id}:${r.asset_id}`, new Date(r.last_alert_at as string).getTime()])
  );
  const cooldownMs = PRICE_ALERT_COOLDOWN_HOURS * 60 * 60 * 1000;
  const now = Date.now();
  const candidateByAsset = new Map(triggered.map((c) => [c.assetId, c]));

  const toSend = subscribers.flatMap((sub) => {
    const candidate = candidateByAsset.get(sub.assetId);
    if (!candidate) return [];
    const lastAlert = lastAlertByPair.get(`${sub.userId}:${sub.assetId}`);
    if (lastAlert != null && now - lastAlert < cooldownMs) return [];
    return [
      {
        userId: sub.userId,
        assetId: sub.assetId,
        chatId: sub.chatId,
        ticker: candidate.ticker,
        name: candidate.name,
        changePct: candidate.price.changePct24h as number,
        price: candidate.price.price,
        currency: candidate.price.currency,
        url: `${SITE_URL}/asset/${encodeURIComponent(candidate.ticker)}`,
      },
    ];
  });
  if (toSend.length === 0) return;

  await sendPriceAlerts(toSend);

  const upserts = toSend.map((n) => ({
    user_id: n.userId,
    asset_id: n.assetId,
    last_alert_at: new Date().toISOString(),
  }));
  const { error: upsertError } = await db
    .from("price_alert_state")
    .upsert(upserts, { onConflict: "user_id,asset_id" });
  if (upsertError) throw new Error(`checkPriceAlerts failed: ${upsertError.message}`);
}

interface AssetJoin {
  market: AttentionNoteRow["market"];
  logo_url: string | null;
}

function rowToAttentionNote(r: Record<string, unknown>): AttentionNoteRow {
  const asset = (Array.isArray(r.watchlist_assets) ? r.watchlist_assets[0] : r.watchlist_assets) as
    | AssetJoin
    | undefined;
  return {
    id: r.id as string,
    runId: r.run_id as string,
    assetId: r.asset_id as string,
    ticker: r.symbol as string,
    name: r.name as string,
    category: r.category as AttentionNote["category"],
    market: asset?.market ?? "us_stock",
    logoUrl: asset?.logo_url ?? null,
    sentiment: r.sentiment as AttentionNote["sentiment"],
    sentimentScore: Number(r.sentiment_score),
    summary: r.summary as AttentionNote["summary"],
    whyNotable: r.why_notable as AttentionNote["whyNotable"],
    keyFacts: r.key_facts as AttentionNote["keyFacts"],
    riskNotes: r.risk_notes as AttentionNote["riskNotes"],
    sources: (r.sources as AttentionNote["sources"]) ?? [],
    notFinancialAdvice: true,
    generatedAt: r.generated_at as string,
    priceSnapshot: (r.price_snapshot as PriceSnapshot | null) ?? null,
    createdAt: r.created_at as string,
  };
}

const NOTE_SELECT_WITH_ASSET = "*, watchlist_assets(market, logo_url)";

/** Latest note per symbol, newest first — the homepage feed. Cached per-request (also reused by the sitemap). */
export const getLatestFeed = cache(async (): Promise<AttentionNoteRow[]> => {
  const db = getPublicClient();
  const { data, error } = await db
    .from("attention_notes")
    .select(NOTE_SELECT_WITH_ASSET)
    .order("generated_at", { ascending: false });
  if (error) throw new Error(`getLatestFeed failed: ${error.message}`);

  const seen = new Set<string>();
  const latest: AttentionNoteRow[] = [];
  for (const row of data ?? []) {
    if (seen.has(row.symbol)) continue;
    seen.add(row.symbol);
    latest.push(rowToAttentionNote(row));
  }
  return latest;
});

/** Latest note per symbol, restricted to a given set of asset ids — powers the "Избранное" page. */
export async function getLatestFeedForAssetIds(assetIds: string[]): Promise<AttentionNoteRow[]> {
  if (assetIds.length === 0) return [];
  const db = getPublicClient();
  const { data, error } = await db
    .from("attention_notes")
    .select(NOTE_SELECT_WITH_ASSET)
    .in("asset_id", assetIds)
    .order("generated_at", { ascending: false });
  if (error) throw new Error(`getLatestFeedForAssetIds failed: ${error.message}`);

  const seen = new Set<string>();
  const latest: AttentionNoteRow[] = [];
  for (const row of data ?? []) {
    if (seen.has(row.symbol)) continue;
    seen.add(row.symbol);
    latest.push(rowToAttentionNote(row));
  }
  return latest;
}

/** Cached per-request so generateMetadata and the page body share one DB call. */
export const getAssetHistory = cache(async (symbol: string): Promise<AttentionNoteRow[]> => {
  const db = getPublicClient();
  const { data, error } = await db
    .from("attention_notes")
    .select(NOTE_SELECT_WITH_ASSET)
    .eq("symbol", symbol)
    .order("generated_at", { ascending: false });
  if (error) throw new Error(`getAssetHistory failed: ${error.message}`);
  return (data ?? []).map(rowToAttentionNote);
});

/** All notes (every market, every symbol — not deduped) published within a date range, for retrospectives. */
export async function getNotesInRange(fromISO: string, toISO: string): Promise<AttentionNoteRow[]> {
  const db = getServiceClient();
  const { data, error } = await db
    .from("attention_notes")
    .select(NOTE_SELECT_WITH_ASSET)
    .gte("generated_at", fromISO)
    .lte("generated_at", toISO)
    .order("generated_at", { ascending: true });
  if (error) throw new Error(`getNotesInRange failed: ${error.message}`);
  return (data ?? []).map(rowToAttentionNote);
}

/** Significant notes (|sentimentScore| >= NOTABLE_SENTIMENT_THRESHOLD — same bar as the Telegram
 * channel posts) from the last `days` days, capped at `perDayLimit` per calendar day and ranked
 * by sentiment strength within each day. Used for the Zen RSS feed, which should read like a
 * curated highlights list, not every note the pipeline ever generates. */
export async function getSignificantNotesForFeed(
  days: number,
  perDayLimit: number
): Promise<AttentionNoteRow[]> {
  const to = new Date();
  const from = new Date(to.getTime() - days * 24 * 60 * 60 * 1000);
  const notes = await getNotesInRange(from.toISOString(), to.toISOString());
  const significant = notes.filter((n) => Math.abs(n.sentimentScore) >= NOTABLE_SENTIMENT_THRESHOLD);

  const byDay = new Map<string, AttentionNoteRow[]>();
  for (const note of significant) {
    const day = note.generatedAt.slice(0, 10);
    const list = byDay.get(day) ?? [];
    list.push(note);
    byDay.set(day, list);
  }

  const capped: AttentionNoteRow[] = [];
  for (const dayNotes of byDay.values()) {
    dayNotes.sort((a, b) => Math.abs(b.sentimentScore) - Math.abs(a.sentimentScore));
    capped.push(...dayNotes.slice(0, perDayLimit));
  }
  return capped;
}
