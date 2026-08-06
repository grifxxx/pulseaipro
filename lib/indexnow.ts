import { SITE_URL } from "@/lib/seo";

/** Must match the filename of the key file in /public — that file is how search engines verify
 * we own the domain before accepting pings. Not a secret: it's published in that file and sent
 * in plain text on every request, so there's no need to keep it in an env var. */
const INDEXNOW_KEY = "c7ce17859e92cb584434e28e68d1da20";

/** Submitting to any one participating endpoint (here: Yandex's) fans the URLs out to the other
 * IndexNow-participating search engines (Bing, Seznam, Naver, …) per the shared protocol — no
 * need to ping each one separately. Best-effort: a failed ping just means the site falls back to
 * normal crawling, so it must never fail the pipeline run that triggered it. */
export async function submitToIndexNow(urls: string[]): Promise<void> {
  const urlList = [...new Set(urls)];
  if (urlList.length === 0) return;

  try {
    const res = await fetch("https://yandex.com/indexnow", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        host: new URL(SITE_URL).host,
        key: INDEXNOW_KEY,
        keyLocation: `${SITE_URL}/${INDEXNOW_KEY}.txt`,
        urlList,
      }),
    });
    if (!res.ok) {
      console.error(`submitToIndexNow: ${res.status} ${await res.text().catch(() => "")}`);
    }
  } catch (err) {
    console.error("submitToIndexNow failed:", err instanceof Error ? err.message : err);
  }
}
