import Script from "next/script";

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

/** GA4, off until NEXT_PUBLIC_GA_ID is set — so the tag ships with the build but sends nothing
 * until somebody deliberately turns it on.
 *
 * Worth knowing what it adds: Yandex Metrika already covers this site's audience better, and GA
 * sends visitor data to Google, which for a Russian-facing site is a cross-border transfer of
 * personal data under 152-ФЗ. Its real use here is not the reports — it is that Search Console
 * accepts an installed GA tag as proof of ownership, which makes verification one click. */
export function GoogleAnalytics() {
  if (!GA_ID) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_ID}');
        `}
      </Script>
    </>
  );
}
