import { getServiceClient } from "@/lib/db/supabase-client";

const BUCKET = "article-images";

/** Uploads image bytes to the public article-images bucket and returns a permanent public URL. */
export async function uploadArticleImage(
  path: string,
  bytes: Buffer,
  contentType = "image/jpeg"
): Promise<string> {
  const db = getServiceClient();
  const { error } = await db.storage.from(BUCKET).upload(path, bytes, {
    contentType,
    upsert: true,
  });
  if (error) throw new Error(`uploadArticleImage failed: ${error.message}`);

  const { data } = db.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
