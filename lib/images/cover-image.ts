import { getOpenAIClient } from "@/lib/llm/openai-client";

const COVER_IMAGE_MODEL = process.env.OPENAI_IMAGE_MODEL ?? "gpt-image-2";

/** Generates an article cover image and returns the raw bytes (webp). GPT image models always return base64. */
export async function generateCoverImage(prompt: string): Promise<Buffer> {
  const client = getOpenAIClient();
  const response = await client.images.generate({
    model: COVER_IMAGE_MODEL,
    prompt,
    size: "1536x1024",
    quality: "medium",
    output_format: "webp",
    n: 1,
  });

  const b64 = response.data?.[0]?.b64_json;
  if (!b64) throw new Error("Image generation returned no data");
  return Buffer.from(b64, "base64");
}
