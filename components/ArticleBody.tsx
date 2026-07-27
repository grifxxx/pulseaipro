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
          default:
            return null;
        }
      })}
    </div>
  );
}
