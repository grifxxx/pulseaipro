"use client";

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

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;
  const pages = getPageNumbers(currentPage, totalPages);

  return (
    <nav className="flex items-center justify-center gap-1.5 pt-2">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        aria-label="Previous page"
        className="rounded-full px-3 py-1.5 text-sm text-muted transition-colors hover:bg-surface hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
      >
        ←
      </button>
      {pages.map((p, i) =>
        p === "ellipsis" ? (
          <span key={`e${i}`} className="px-1 text-sm text-muted">
            …
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`h-8 w-8 rounded-full text-sm font-medium transition-colors ${
              p === currentPage
                ? "bg-accent text-white"
                : "text-muted hover:bg-surface hover:text-foreground"
            }`}
          >
            {p}
          </button>
        )
      )}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        aria-label="Next page"
        className="rounded-full px-3 py-1.5 text-sm text-muted transition-colors hover:bg-surface hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
      >
        →
      </button>
    </nav>
  );
}
