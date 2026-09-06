import type { Metadata } from "next";
import { Geist, Geist_Mono, Source_Serif_4 } from "next/font/google";
import { headers } from "next/headers";
import Link from "next/link";
import "./globals.css";
import { DisclaimerBanner } from "@/components/DisclaimerBanner";
import { SiteFooter } from "@/components/SiteFooter";
import { PulseLogo } from "@/components/PulseLogo";
import { AuthNav } from "@/components/AuthNav";
import { YandexMetrika } from "@/components/YandexMetrika";
import { resolveLocale, getStrings } from "@/lib/i18n";
import { SITE_NAME, SITE_URL, websiteJsonLd } from "@/lib/seo";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "cyrillic"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Display face for headings and the wordmark. A serif with real Cyrillic is what separates
// "reference publication with a named author" from "another crypto dashboard".
const sourceSerif = Source_Serif_4({
  variable: "--font-source-serif",
  subsets: ["latin", "cyrillic"],
  weight: ["500", "600", "700"],
});

const ROOT_COPY = {
  ru: {
    title: `${SITE_NAME} — разборы для частного инвестора: налоги, ИИС, биржа, крипта`,
    description:
      "Понятные разборы для частного инвестора: налоги и вычеты, ИИС, облигации, биржевые инструменты, криптовалюты — с расчётами и таблицами. Плюс лента рыночных новостей. Информационный контент, не инвестиционная рекомендация.",
  },
  en: {
    title: `${SITE_NAME} — plain-language guides for private investors`,
    description:
      "Guides on taxes, brokerage accounts, bonds, market mechanics and crypto, with worked examples — plus a live market news feed. Informational only, not investment advice.",
  },
};

// Crawlers (Yandex, Google, Telegram, VK, WhatsApp, …) don't reliably send an Accept-Language
// header matching a real visitor's browser, so <title>/meta-description/og:/twitter: are all
// pinned to Russian (the primary audience) unconditionally rather than following the
// visitor-resolved locale — this is the text search engines index and crawlers preview.
// Every page's own generateMetadata follows the same rule for its title/description.
const COPY = ROOT_COPY.ru;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: COPY.title,
    template: `%s · ${SITE_NAME}`,
  },
  description: COPY.description,
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: COPY.title,
    description: COPY.description,
    locale: "ru_RU",
  },
  twitter: {
    card: "summary_large_image",
    title: COPY.title,
    description: COPY.description,
  },
};

const navLinkClass =
  "rounded-full px-2 sm:px-3 py-1.5 hover:bg-surface-hover hover:text-foreground transition-colors";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersList = await headers();
  const locale = resolveLocale(headersList.get("accept-language"));
  const t = getStrings(locale);

  return (
    <html
      lang={locale}
      className={`${geistSans.variable} ${geistMono.variable} ${sourceSerif.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <YandexMetrika />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd()) }}
        />
        <DisclaimerBanner locale={locale} />
        <header className="sticky top-0 z-10 border-b border-border/80 bg-background/85 backdrop-blur-md px-4 sm:px-6 py-3 flex items-center justify-between gap-2">
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <PulseLogo />
            <span className="hidden sm:inline font-serif text-lg font-semibold tracking-tight">
              {t.siteTitle}
            </span>
          </Link>
          <nav className="text-xs sm:text-sm flex gap-0.5 sm:gap-1 text-muted min-w-0">
            <Link href="/blog" className={navLinkClass}>
              {t.navBlog}
            </Link>
            <Link href="/feed" className={navLinkClass}>
              {t.navFeed}
            </Link>
            <Link href="/faq" className={navLinkClass}>
              {t.navFaq}
            </Link>
            <Link href="/about" className={navLinkClass}>
              {t.navAbout}
            </Link>
            <AuthNav locale={locale} />
          </nav>
        </header>
        <main className="flex-1">{children}</main>
        <SiteFooter locale={locale} />
      </body>
    </html>
  );
}
