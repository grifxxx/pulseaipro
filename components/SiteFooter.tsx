import Link from "next/link";
import type { Locale } from "@/lib/types";
import { getStrings } from "@/lib/i18n";
import { LEGAL_ENTITY_NAME, LEGAL_INN, LEGAL_OGRNIP } from "@/lib/legal";

export function SiteFooter({ locale }: { locale: Locale }) {
  const t = getStrings(locale);
  return (
    <footer className="border-t border-border px-4 sm:px-6 py-8 text-xs text-muted flex flex-col gap-4">
      <div className="max-w-5xl mx-auto w-full flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
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
      <div className="max-w-5xl mx-auto w-full flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-t border-border/60 pt-4">
        <p className="max-w-md text-muted/70">
          {LEGAL_ENTITY_NAME} · ОГРНИП {LEGAL_OGRNIP} · ИНН {LEGAL_INN}
        </p>
        <div className="flex gap-4">
          <Link href="/privacy" className="hover:text-foreground transition-colors">
            Политика конфиденциальности
          </Link>
          <Link href="/terms" className="hover:text-foreground transition-colors">
            Пользовательское соглашение
          </Link>
          <Link href="/cookies" className="hover:text-foreground transition-colors">
            Cookie
          </Link>
        </div>
      </div>
    </footer>
  );
}
