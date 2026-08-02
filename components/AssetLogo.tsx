const MONOGRAM_STYLES = [
  "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400",
  "bg-sky-500/15 text-sky-600 dark:text-sky-400",
  "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  "bg-rose-500/15 text-rose-600 dark:text-rose-400",
  "bg-violet-500/15 text-violet-600 dark:text-violet-400",
  "bg-cyan-500/15 text-cyan-600 dark:text-cyan-400",
  "bg-orange-500/15 text-orange-600 dark:text-orange-400",
];

function monogramStyle(ticker: string): string {
  let hash = 0;
  for (let i = 0; i < ticker.length; i++) hash = (hash * 31 + ticker.charCodeAt(i)) >>> 0;
  return MONOGRAM_STYLES[hash % MONOGRAM_STYLES.length];
}

export function AssetLogo({
  ticker,
  name,
  logoUrl,
}: {
  ticker: string;
  name?: string;
  logoUrl: string | null;
}) {
  if (logoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={logoUrl}
        alt={`${name ?? ticker} — логотип`}
        width={36}
        height={36}
        className="h-9 w-9 shrink-0 rounded-full bg-white object-contain p-1 ring-1 ring-border"
      />
    );
  }

  return (
    <span
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${monogramStyle(
        ticker
      )}`}
    >
      {ticker.slice(0, 2).toUpperCase()}
    </span>
  );
}
