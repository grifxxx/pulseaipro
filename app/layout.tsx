import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { headers } from "next/headers";
import Link from "next/link";
import "./globals.css";
import { DisclaimerBanner } from "@/components/DisclaimerBanner";
import { SiteFooter } from "@/components/SiteFooter";
import { PulseLogo } from "@/components/PulseLogo";
import { YandexMetrika } from "@/components/YandexMetrika";
import { resolveLocale, getStrings } from "@/lib/i18n";
import { SITE_NAME, SITE_URL, websiteJsonLd } from "@/lib/seo";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — daily AI stock & crypto news digest`,
    template: `%s · ${SITE_NAME}`,
  },
  description:
    "Daily AI-generated summaries of what's moving US stocks, Russian stocks and crypto in the news — informational only, not investment advice.",
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
  },
  twitter: {
    card: "summary_large_image",
  },
};

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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <YandexMetrika />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd()) }}
        />
        <DisclaimerBanner locale={locale} />
        <header className="sticky top-0 z-10 border-b border-border/80 bg-background/80 backdrop-blur-md px-4 sm:px-6 py-3.5 flex items-center justify-between gap-2">
          <Link href="/" className="flex items-center gap-2 shrink-0 font-semibold tracking-tight">
            <PulseLogo />
            <span className="hidden sm:inline text-base">{t.siteTitle}</span>
          </Link>
          <nav className="text-xs sm:text-sm flex gap-0.5 sm:gap-1 text-muted min-w-0">
            <Link
              href="/"
              className="rounded-full px-1.5 sm:px-3 py-1.5 hover:bg-surface hover:text-foreground transition-colors"
            >
              {t.navFeed}
            </Link>
            <Link
              href="/blog"
              className="rounded-full px-1.5 sm:px-3 py-1.5 hover:bg-surface hover:text-foreground transition-colors"
            >
              {t.navBlog}
            </Link>
            <Link
              href="/faq"
              className="rounded-full px-1.5 sm:px-3 py-1.5 hover:bg-surface hover:text-foreground transition-colors"
            >
              {t.navFaq}
            </Link>
            <Link
              href="/about"
              className="rounded-full px-1.5 sm:px-3 py-1.5 hover:bg-surface hover:text-foreground transition-colors"
            >
              {t.navAbout}
            </Link>
          </nav>
        </header>
        <main className="flex-1">{children}</main>
        <SiteFooter locale={locale} />
      </body>
    </html>
  );
}
