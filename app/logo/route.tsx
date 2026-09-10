import { ImageResponse } from "next/og";

export const runtime = "edge";

/** A square 512×512 mark, served so the Organization in our structured data can point at a real
 * logo. The favicon is 32×32 and search engines want at least 112px on a side for this, so it
 * cannot be reused. Same geometry as components/PulseLogo. */
export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0f6e68",
        }}
      >
        <svg viewBox="0 0 24 24" width="320" height="320" fill="none">
          <polyline
            points="1,13 7,13 9.5,6 13,20 15.5,13 23,13"
            stroke="#ffffff"
            strokeWidth="2.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    ),
    { width: 512, height: 512 }
  );
}
