/**
 * Generates a cover image for a hand-written article and uploads it to the public bucket.
 *
 * Mirrors lib/images/cover-image.ts and lib/storage/article-images.ts, which the automated
 * pipeline uses — same model, size and bucket, so a hand-published piece is indistinguishable
 * from a generated one on the page.
 *
 * Usage:
 *   node scripts/generate-cover.mjs <slug> "<english image prompt>"
 */
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

const [, , slug, prompt] = process.argv;
if (!slug || !prompt) {
  console.error('usage: node scripts/generate-cover.mjs <slug> "<prompt>"');
  process.exit(1);
}

const { OPENAI_API_KEY, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
if (!OPENAI_API_KEY || !NEXT_PUBLIC_SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("OPENAI_API_KEY, NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set");
  process.exit(1);
}

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });
const response = await openai.images.generate({
  model: process.env.OPENAI_IMAGE_MODEL ?? "gpt-image-2",
  prompt,
  size: "1536x1024",
  quality: "medium",
  output_format: "jpeg",
  n: 1,
});

const b64 = response.data?.[0]?.b64_json;
if (!b64) {
  console.error("image generation returned no data");
  process.exit(1);
}
const bytes = Buffer.from(b64, "base64");

const db = createClient(NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});
const path = `covers/${slug}.jpg`;
const { error } = await db.storage.from("article-images").upload(path, bytes, {
  contentType: "image/jpeg",
  upsert: true,
});
if (error) {
  console.error("upload failed:", error.message);
  process.exit(1);
}

console.log(db.storage.from("article-images").getPublicUrl(path).data.publicUrl);
