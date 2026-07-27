/** Minimal RSS 2.0 + content:encoded builder — no external deps, tuned for Yandex Zen's feed requirements. */

export function escapeXml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** CDATA-wraps content so raw HTML tags survive without per-tag escaping. */
function cdata(html: string): string {
  return `<![CDATA[${html.replace(/]]>/g, "]]]]><![CDATA[>")}]]>`;
}

export function toRfc822(iso: string): string {
  return new Date(iso).toUTCString();
}

export interface RssItem {
  title: string;
  link: string;
  guid: string;
  pubDate: string;
  contentHtml: string;
}

export interface RssChannel {
  title: string;
  link: string;
  description: string;
  language: string;
  items: RssItem[];
}

export function buildRssFeed(channel: RssChannel): string {
  const itemsXml = channel.items
    .map(
      (item) => `  <item>
    <title>${escapeXml(item.title)}</title>
    <link>${escapeXml(item.link)}</link>
    <guid isPermaLink="false">${escapeXml(item.guid)}</guid>
    <pubDate>${item.pubDate}</pubDate>
    <content:encoded>${cdata(item.contentHtml)}</content:encoded>
  </item>`
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/">
<channel>
  <title>${escapeXml(channel.title)}</title>
  <link>${escapeXml(channel.link)}</link>
  <description>${escapeXml(channel.description)}</description>
  <language>${channel.language}</language>
${itemsXml}
</channel>
</rss>
`;
}
