import { NextRequest, NextResponse } from "next/server";
import { getArticleBySlug } from "@/lib/db/articles-queries";
import { postArticleToChannel } from "@/lib/notify";
import { SITE_URL } from "@/lib/seo";

// Temporary: verifies postArticleToChannel against a real, already-published article (no new
// LLM/image generation) without needing a fresh pipeline run. Remove after verification.

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const slug = req.nextUrl.searchParams.get("slug");
  if (!slug) return NextResponse.json({ error: "missing slug" }, { status: 400 });

  const article = await getArticleBySlug(slug);
  if (!article) return NextResponse.json({ error: "not found" }, { status: 404 });

  await postArticleToChannel({
    market: article.market,
    title: article.title.ru,
    dek: article.dek.ru,
    url: `${SITE_URL}/blog/${article.slug}`,
    coverImageUrl: article.coverImageUrl,
  });

  return NextResponse.json({ ok: true, slug: article.slug });
}
