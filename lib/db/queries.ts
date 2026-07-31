import { cache } from "react";
import { getPublicClient, getServiceClient } from "@/lib/db/supabase-client";
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
  return rows.length;
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

/** Most recent notes, newest first — not deduped by symbol (unlike getLatestFeed). Used for the RSS feed. */
export const getRecentNotesForFeed = cache(async (limit: number): Promise<AttentionNoteRow[]> => {
  const db = getPublicClient();
  const { data, error } = await db
    .from("attention_notes")
    .select(NOTE_SELECT_WITH_ASSET)
    .order("generated_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(`getRecentNotesForFeed failed: ${error.message}`);
  return (data ?? []).map(rowToAttentionNote);
});
