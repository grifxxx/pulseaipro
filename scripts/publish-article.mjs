/**
 * Publishes a hand-written article from a JSON file.
 *
 * The evergreen pipeline writes the guides, but a piece about our own service is not something
 * a model should be drafting from a brief — every claim in it has to match what the service
 * actually does. So the body is written by hand and this script just puts it in the database,
 * upserting on slug so re-running it replaces the article in place.
 *
 * Usage:
 *   node scripts/publish-article.mjs scripts/<file>.json <coverImageUrl>
 */
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const [, , articlePath, coverImageUrl] = process.argv;
if (!articlePath || !coverImageUrl) {
  console.error("usage: node scripts/publish-article.mjs <article.json> <coverImageUrl>");
  process.exit(1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set");
  process.exit(1);
}

const article = JSON.parse(readFileSync(articlePath, "utf8"));

// Guard against the shape mistakes that only surface as broken markup on the live page.
for (const [i, block] of article.body.entries()) {
  if (block.type !== "table") continue;
  const width = block.columns.ru.length;
  const ragged = [...block.rows.ru, ...block.rows.en].find((row) => row.length !== width);
  if (block.columns.en.length !== width || ragged) {
    console.error(`block ${i}: table rows do not match ${width} columns`);
    process.exit(1);
  }
  if (block.rows.ru.length !== block.rows.en.length) {
    console.error(`block ${i}: ru and en tables have different row counts`);
    process.exit(1);
  }
}

const db = createClient(url, key, { auth: { persistSession: false } });
const { error } = await db.from("articles").upsert(
  {
    kind: article.kind,
    market: article.market,
    period: article.period,
    slug: article.slug,
    title: article.title,
    dek: article.dek,
    body: article.body,
    cover_image_url: coverImageUrl,
    related_tickers: article.relatedTickers ?? [],
    published_at: new Date().toISOString(),
  },
  { onConflict: "slug" }
);

if (error) {
  console.error("upsert failed:", error.message);
  process.exit(1);
}
console.log(`published /blog/${article.slug}`);
