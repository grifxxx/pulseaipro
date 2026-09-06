import type { DisplayArticleBlock } from "@/lib/types";

/** Anchor id for the heading at position `index` in the article body. ArticleBody stamps the same
 * id on the rendered <h2>, so this is the single place the scheme lives. */
export function headingAnchor(index: number): string {
  return `h-${index}`;
}

/** Table of contents built from the body's heading blocks. Eight sections is too many to read
 * without a map, and Yandex uses in-page anchors for its quick links in the snippet. */
export function TableOfContents({ blocks, title }: { blocks: DisplayArticleBlock[]; title: string }) {
  const headings = blocks
    .map((block, index) => ({ block, index }))
    .filter((entry): entry is { block: { type: "heading"; text: string }; index: number } => entry.block.type === "heading");

  if (headings.length < 3) return null;

  return (
    <nav aria-label={title} className="rounded-2xl border border-border bg-surface p-5">
      <div className="text-xs font-semibold uppercase tracking-wide text-muted mb-3">{title}</div>
      <ol className="flex flex-col gap-1.5 list-decimal pl-5 marker:text-muted/70 marker:font-mono marker:text-xs">
        {headings.map(({ block, index }) => (
          <li key={index} className="pl-1">
            <a href={`#${headingAnchor(index)}`} className="text-sm leading-snug text-foreground/85 hover:text-accent transition-colors">
              {block.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
