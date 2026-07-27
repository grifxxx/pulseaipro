import { ImageResponse } from "next/og";
import { headers } from "next/headers";
import { resolveLocale } from "@/lib/i18n";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const COPY = {
  ru: {
    tag: "ИИ · Акции · Крипто",
    headline: "Ежедневный ИИ-дайджест новостей по акциям и крипте",
    subtitle: "Информационный контент. Не является инвестиционной рекомендацией.",
  },
  en: {
    tag: "AI · Stocks · Crypto",
    headline: "Daily AI digest of stock & crypto news",
    subtitle: "Informational only — not investment advice.",
  },
};

export default async function OpengraphImage() {
  const headersList = await headers();
  const locale = resolveLocale(headersList.get("accept-language"));
  const copy = COPY[locale];

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          position: "relative",
          padding: 80,
          background: "#0a0a0c",
          color: "#f2f2f5",
          fontFamily: "sans-serif",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -220,
            right: -160,
            width: 620,
            height: 620,
            borderRadius: 9999,
            background: "radial-gradient(circle, rgba(129,140,248,0.55) 0%, rgba(79,70,229,0) 70%)",
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -260,
            left: -180,
            width: 560,
            height: 560,
            borderRadius: 9999,
            background: "radial-gradient(circle, rgba(16,185,129,0.28) 0%, rgba(16,185,129,0) 70%)",
            display: "flex",
          }}
        />

        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 36 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              background: "linear-gradient(135deg, #4f46e5, #818cf8)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg viewBox="0 0 24 24" width="30" height="30" fill="none">
              <polyline
                points="1,13 7,13 9.5,6 13,20 15.5,13 23,13"
                stroke="#ffffff"
                strokeWidth="2.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div style={{ fontSize: 28, fontWeight: 600 }}>PulseAiPro</div>
        </div>

        <div
          style={{
            display: "flex",
            width: "fit-content",
            fontSize: 20,
            fontWeight: 600,
            color: "#a5b4fc",
            background: "rgba(129,140,248,0.12)",
            border: "1px solid rgba(129,140,248,0.35)",
            borderRadius: 9999,
            padding: "8px 20px",
            marginBottom: 28,
          }}
        >
          {copy.tag}
        </div>

        <div style={{ display: "flex", fontSize: 56, fontWeight: 700, lineHeight: 1.15, maxWidth: 980 }}>
          {copy.headline}
        </div>
        <div style={{ display: "flex", fontSize: 27, color: "#a3a3ad", marginTop: 26, maxWidth: 820 }}>
          {copy.subtitle}
        </div>
      </div>
    ),
    { ...size }
  );
}
