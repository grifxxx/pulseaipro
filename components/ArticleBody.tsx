import type { DisplayArticleBlock } from "@/lib/types";
import { AssetWidget } from "@/components/AssetWidget";

export function ArticleBody({ blocks }: { blocks: DisplayArticleBlock[] }) {
  return (
    <div className="flex flex-col gap-5">
      {blocks.map((block, i) => {
        switch (block.type) {
          case "heading":
            return (
              <h2 key={i} className="text-xl font-semibold tracking-tight text-foreground mt-2">
                {block.text}
              </h2>
            );
          case "paragraph":
            return (
              <p key={i} className="text-[15px] leading-relaxed text-foreground/85">
                {block.text}
              </p>
            );
          case "asset":
            return <AssetWidget key={i} {...block} />;
          case "chart":
            return (
              <figure key={i} className="flex flex-col gap-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={block.src}
                  alt={block.caption}
                  className="w-full rounded-xl border border-border bg-white"
                />
                <figcaption className="text-xs text-muted text-center">{block.caption}</figcaption>
              </figure>
            );
          case "list":
            return block.ordered ? (
              <ol key={i} className="flex flex-col gap-2 pl-5 list-decimal marker:text-accent marker:font-semibold">
                {block.items.map((item, j) => (
                  <li key={j} className="text-[15px] leading-relaxed text-foreground/85 pl-1">
                    {item}
                  </li>
                ))}
              </ol>
            ) : (
              <ul key={i} className="flex flex-col gap-2">
                {block.items.map((item, j) => (
                  <li key={j} className="flex gap-2.5 text-[15px] leading-relaxed text-foreground/85">
                    <span className="text-accent select-none mt-0.5">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            );
          case "table":
            return (
              <figure key={i} className="flex flex-col gap-2">
                {/* Wide tables scroll inside their own box — the page itself must never scroll
                    sideways on a phone, which is where most of this traffic will land. */}
                <div className="overflow-x-auto rounded-xl border border-border">
                  <table className="w-full border-collapse text-[14px]">
                    <thead>
                      <tr className="bg-surface">
                        {block.columns.map((column, j) => (
                          <th
                            key={j}
                            scope="col"
                            className="border-b border-border px-3 py-2.5 text-left font-semibold text-foreground whitespace-nowrap"
                          >
                            {column}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {block.rows.map((row, j) => (
                        <tr key={j} className="even:bg-surface/40">
                          {row.map((cell, k) => (
                            <td
                              key={k}
                              className="border-b border-border/60 px-3 py-2.5 align-top text-foreground/85"
                            >
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {block.caption && (
                  <figcaption className="text-xs text-muted">{block.caption}</figcaption>
                )}
              </figure>
            );
          case "callout": {
            const tone =
              block.variant === "warning"
                ? "border-amber-500/30 bg-amber-500/5"
                : block.variant === "example"
                  ? "border-accent/30 bg-accent/5"
                  : "border-border bg-surface/60";
            return (
              <aside key={i} className={`rounded-xl border p-4 flex flex-col gap-1.5 ${tone}`}>
                <h3 className="text-sm font-semibold text-foreground">{block.title}</h3>
                <p className="text-[15px] leading-relaxed text-foreground/85 whitespace-pre-line">
                  {block.text}
                </p>
              </aside>
            );
          }
          default:
            return null;
        }
      })}
    </div>
  );
}
