interface ShareButtonsProps {
  url: string;
  title: string;
  label: string;
}

const buttonClass =
  "flex h-8 w-8 items-center justify-center rounded-full border border-border bg-surface text-muted transition-colors hover:text-accent hover:border-accent/40";

/** Share links for the two platforms this RU-market audience actually uses — Telegram and VK.
 * Plain share-intent URLs, no SDK/app registration needed. */
export function ShareButtons({ url, title, label }: ShareButtonsProps) {
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted">{label}</span>
      <a
        href={`https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Telegram"
        className={buttonClass}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M22 2 11 13" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M22 2 15 22 11 13 2 9Z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </a>
      <a
        href={`https://vk.com/share.php?url=${encodedUrl}&title=${encodedTitle}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="VK"
        className={buttonClass}
      >
        <span className="text-[11px] font-bold tracking-tight">VK</span>
      </a>
    </div>
  );
}
