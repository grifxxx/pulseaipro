import type { Metadata } from "next";
import { Geist, Geist_Mono, Source_Serif_4 } from "next/font/google";
import { headers } from "next/headers";
import Link from "next/link";
import "./globals.css";
import { SiteFooter } from "@/components/SiteFooter";
import { PulseLogo } from "@/components/PulseLogo";
import { AuthNav } from "@/components/AuthNav";
import { YandexMetrika } from "@/components/YandexMetrika";
import { GoogleAnalytics } from "@/components/GoogleAnalytics";
import { resolveLocale, getStrings } from "@/lib/i18n";
import { SITE_NAME, SITE_URL, siteGraphJsonLd } from "@/lib/seo";

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

// Title and description are budgeted to what a search result actually shows: roughly 60
// characters of title and 160 of description. Anything past that is truncated with an ellipsis,
// so the words that matter have to come first.
const ROOT_COPY = {
  ru: {
    title: "Налоги, ИИС, ОФЗ и криптовалюты — простыми словами",
    description:
      "Статьи для частного инвестора: ИИС и налоговые вычеты, ОФЗ, биржевые заявки, налог на криптовалюту. С расчётами, таблицами и без советов покупать.",
  },
  en: {
    title: "Plain-language guides for private investors",
    description:
      "Guides on taxes, brokerage accounts, bonds, market mechanics and crypto, with worked examples. Informational only, not investment advice.",
  },
};

/** Terms the site as a whole is about. Google has ignored the keywords meta tag since 2009;
 * Yandex's documentation says only that it "may be taken into account". It is here because it
 * costs nothing and Yandex leaves the door open — kept short and honest for the same reason a
 * stuffed one would hurt: long keyword lists are a classic doorway signal. */
export const SITE_KEYWORDS = [
  "инвестиции для начинающих",
  "ИИС",
  "налоговый вычет",
  "ОФЗ",
  "налог на криптовалюту",
  "фондовый рынок",
];

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
  keywords: SITE_KEYWORDS,
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: COPY.title,
    description: COPY.description,
    locale: "ru_RU",
  },
  // Search Console and Webmaster both accept a meta tag as proof of ownership. Keeping the
  // tokens in env vars means verifying a new property is a variable and a restart, not a commit.
  verification: {
    ...(process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
      ? { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION }
      : {}),
    ...(process.env.NEXT_PUBLIC_YANDEX_SITE_VERIFICATION
      ? { yandex: process.env.NEXT_PUBLIC_YANDEX_SITE_VERIFICATION }
      : {}),
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
        <GoogleAnalytics />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(siteGraphJsonLd()) }}
        />
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
