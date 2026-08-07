interface ShareButtonsProps {
  url: string;
  title: string;
  label: string;
}

const badgeClass =
  "flex h-8 w-8 items-center justify-center rounded-full text-white shadow-sm transition-transform hover:scale-105";

/** Share links for the platforms this RU-market audience actually uses — Telegram, VK, and MAX
 * (the RU messenger that largely replaced WhatsApp locally in 2025-2026). Plain share-intent
 * URLs, no SDK/app registration needed. */
export function ShareButtons({ url, title, label }: ShareButtonsProps) {
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  // MAX's share intent only takes one "text" field (no separate url param), so the caption has
  // to be composed with the link at the end ourselves — otherwise it shares a bare link with no
  // caption at all, which just falls back to MAX's own auto-preview sitting above nothing.
  const encodedMaxText = encodeURIComponent(`${title}\n\n${url}`);

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted">{label}</span>
      <a
        href={`https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Telegram"
        className={badgeClass}
        style={{ background: "linear-gradient(135deg, #37AEE2, #1E96C8)" }}
      >
        <svg width="16" height="16" viewBox="0 0 240 240" fill="white">
          <path d="M187 63 155 197c-2.4 10.5-8.7 13-17.7 8.1l-49-36.1-23.6 22.7c-2.6 2.6-4.8 4.8-9.8 4.8l3.5-49.7L152 63.6c4.5-4-1-6.2-6.9-2.2L67 111.5l-48.5-15.2c-10.5-3.3-10.7-10.5 2.2-15.5l189.8-73.1c8.8-3.2 16.4 2.1 13.5 15.3Z" />
        </svg>
      </a>
      <a
        href={`https://vk.com/share.php?url=${encodedUrl}&title=${encodedTitle}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="VK"
        className={badgeClass}
        style={{ background: "#0077FF" }}
      >
        <span className="text-[11px] font-bold tracking-tight">VK</span>
      </a>
      <a
        href={`https://max.ru/:share?text=${encodedMaxText}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="MAX"
        className={badgeClass}
        style={{ background: "linear-gradient(135deg, #4A90E2, #9B59D6)" }}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="white">
          <path d="M12 2C6.48 2 2 6.03 2 11c0 2.55 1.19 4.85 3.11 6.5-.11 1.2-.44 2.61-1.11 3.5 1.53.1 3.03-.4 4.24-1.2A11.6 11.6 0 0 0 12 20c5.52 0 10-4.03 10-9s-4.48-9-10-9Z" />
        </svg>
      </a>
    </div>
  );
}
