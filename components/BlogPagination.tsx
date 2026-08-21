import Link from "next/link";

function getPageNumbers(current: number, total: number): (number | "ellipsis")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const keep = new Set<number>([1, total, current - 1, current, current + 1]);
  const sorted = [...keep].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);

  const result: (number | "ellipsis")[] = [];
  let prev = 0;
  for (const p of sorted) {
    if (prev && p - prev > 1) result.push("ellipsis");
    result.push(p);
    prev = p;
  }
  return result;
}

function pageHref(basePath: string, page: number): string {
  return page <= 1 ? basePath : `${basePath}?page=${page}`;
}

export function BlogPagination({
  currentPage,
  totalPages,
  basePath = "/blog",
}: {
  currentPage: number;
  totalPages: number;
  basePath?: string;
}) {
  if (totalPages <= 1) return null;
  const pages = getPageNumbers(currentPage, totalPages);

  return (
    <nav className="flex items-center justify-center gap-1.5 pt-2">
      {currentPage > 1 ? (
        <Link
          href={pageHref(basePath, currentPage - 1)}
          className="rounded-full px-3 py-1.5 text-sm text-muted transition-colors hover:bg-surface hover:text-foreground"
        >
          ←
        </Link>
      ) : (
        <span className="rounded-full px-3 py-1.5 text-sm text-muted opacity-40">←</span>
      )}
      {pages.map((p, i) =>
        p === "ellipsis" ? (
          <span key={`e${i}`} className="px-1 text-sm text-muted">
            …
          </span>
        ) : (
          <Link
            key={p}
            href={pageHref(basePath, p)}
            className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors ${
              p === currentPage
                ? "bg-accent text-white"
                : "text-muted hover:bg-surface hover:text-foreground"
            }`}
          >
            {p}
          </Link>
        )
      )}
      {currentPage < totalPages ? (
        <Link
          href={pageHref(basePath, currentPage + 1)}
          className="rounded-full px-3 py-1.5 text-sm text-muted transition-colors hover:bg-surface hover:text-foreground"
        >
          →
        </Link>
      ) : (
        <span className="rounded-full px-3 py-1.5 text-sm text-muted opacity-40">→</span>
      )}
    </nav>
  );
}
