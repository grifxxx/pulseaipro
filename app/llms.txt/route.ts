import { getArticlesByKinds } from "@/lib/db/articles-queries";
import { AUTHOR_BIO, AUTHOR_NAME } from "@/lib/author";
import { TOPICS, topicForSlug } from "@/lib/content/evergreen-topics";
import { SITE_NAME, SITE_URL } from "@/lib/seo";
import type { Article } from "@/lib/types";

export const revalidate = 3600;

/** /llms.txt — a Markdown index of the site for language models, per llmstxt.org.
 *
 * Worth being honest in the code about what this is: a proposal, not a standard anybody has
 * committed to. No major model provider has said it reads the file, and Google has publicly
 * likened it to the old keywords meta tag. It is here because it costs one query and stays
 * current on its own — not because it moves anything today.
 *
 * What it does earn: a crawler or a person who fetches it gets the whole guide catalogue with
 * one request instead of walking the HTML, and the AI-disclosure line travels with it. */
export async function GET() {
  let guides: Article[] = [];
  try {
    guides = await getArticlesByKinds(["evergreen"]);
  } catch {
    // Database unreachable — still serve the static part rather than a 500.
  }

  const lines: string[] = [
    `# ${SITE_NAME}`,
    "",
    `> Разборы для частного инвестора на русском языке: налоги и вычеты, ИИС, облигации, биржевые инструменты, криптовалюты. С расчётами и таблицами, без инвестиционных рекомендаций.`,
    "",
    `Автор — ${AUTHOR_NAME}, ${AUTHOR_BIO.ru.jobTitle}. ${AUTHOR_BIO.ru.short}`,
    `${AUTHOR_BIO.ru.disclosure}`,
    "",
  ];

  for (const topic of TOPICS) {
    const inTopic = guides.filter((g) => topicForSlug(g.slug) === topic.id);
    if (inTopic.length === 0) continue;
    lines.push(`## ${topic.label.ru}`, "");
    for (const g of inTopic) {
      lines.push(`- [${g.title.ru}](${SITE_URL}/blog/${g.slug}): ${g.dek.ru}`);
    }
    lines.push("");
  }

  lines.push(
    "## О проекте",
    "",
    `- [О проекте](${SITE_URL}/about): кто пишет статьи, на каких данных и какую роль играет ИИ`,
    `- [Вопросы и ответы](${SITE_URL}/faq): как устроен сервис`,
    `- [Лента рынка](${SITE_URL}/feed): ежедневные заметки по акциям США, России и криптовалютам`,
    "",
    "## Optional",
    "",
    `- [Архив ежедневных заметок](${SITE_URL}/blog/archive): автоматические обзоры рынка до перехода на статьи, не обновляются`,
    ""
  );

  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
