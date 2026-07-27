import type { NoteSource } from "@/lib/types";

export function SourceList({ sources }: { sources: NoteSource[] }) {
  if (sources.length === 0) return null;
  return (
    <ul className="flex flex-col gap-1 text-xs text-muted min-w-0">
      {sources.map((s, i) => (
        <li key={i} className="truncate min-w-0">
          <a
            href={s.url}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="hover:text-accent hover:underline underline-offset-2 transition-colors"
          >
            <span className="font-medium">{s.publisher}</span>: {s.title}
          </a>
        </li>
      ))}
    </ul>
  );
}
