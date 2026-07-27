import Link from "next/link";
import type { Locale } from "@/lib/types";
import { getStrings } from "@/lib/i18n";

export function SiteFooter({ locale }: { locale: Locale }) {
  const t = getStrings(locale);
  return (
    <footer className="border-t border-border px-4 sm:px-6 py-8 text-xs text-muted">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <p className="max-w-md">{t.footerNote}</p>
        <div className="flex gap-4">
          <Link href="/" className="hover:text-foreground transition-colors">
            {t.navFeed}
          </Link>
          <Link href="/blog" className="hover:text-foreground transition-colors">
            {t.navBlog}
          </Link>
          <Link href="/about" className="hover:text-foreground transition-colors">
            {t.navAbout}
          </Link>
        </div>
      </div>
    </footer>
  );
}
