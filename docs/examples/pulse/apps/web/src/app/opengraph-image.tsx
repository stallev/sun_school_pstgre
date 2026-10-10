import { ImageResponse } from "next/og";

import { getMessages } from "@/lib/messages/server";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpenGraphImage() {
  const messages = await getMessages();
  const { title, description } = messages.landing.meta;

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          width: "100%",
          height: "100%",
          padding: "72px 80px",
          background: "linear-gradient(145deg, #1A3028 0%, #2D5A40 55%, #3D7A58 100%)",
          color: "#F5F0E8",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            fontSize: 28,
            fontWeight: 700,
            letterSpacing: "-0.02em",
          }}
        >
          <span style={{ color: "#E8C070" }}>P</span>
          <span style={{ color: "#F5F0E8" }}>ulse</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 920 }}>
          <div
            style={{
              fontSize: 64,
              fontWeight: 700,
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
            }}
          >
            {title.replace(`${messages.site.logoLabel} — `, "")}
          </div>
          <div
            style={{
              fontSize: 30,
              lineHeight: 1.45,
              color: "#EDE5D4",
              maxWidth: 880,
            }}
          >
            {description}
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
