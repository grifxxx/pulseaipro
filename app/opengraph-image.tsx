import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 80,
          background: "#0a0a0c",
          color: "#f2f2f5",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 40 }}>
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
        <div style={{ display: "flex", fontSize: 54, fontWeight: 700, lineHeight: 1.15, maxWidth: 950 }}>
          Daily AI digest of stock &amp; crypto news
        </div>
        <div style={{ display: "flex", fontSize: 26, color: "#93939f", marginTop: 24, maxWidth: 800 }}>
          Informational only — not investment advice.
        </div>
      </div>
    ),
    { ...size }
  );
}
