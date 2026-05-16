import { ImageResponse } from "next/og";
import { SITE_NAME } from "@/lib/seo";
import { VILLAGE } from "@/lib/constants";

export const alt = SITE_NAME;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Default social-share card used across the site (overridable per page).
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
          padding: "80px",
          background: "linear-gradient(135deg, #143427 0%, #1B4332 60%, #22543D 100%)",
          color: "#F5EFE6",
          fontFamily: "Georgia, serif",
        }}
      >
        <div
          style={{
            fontSize: 30,
            letterSpacing: 6,
            textTransform: "uppercase",
            color: "#D7B25E",
          }}
        >
          Village Directory
        </div>
        <div
          style={{
            fontSize: 104,
            fontWeight: 700,
            marginTop: 16,
            lineHeight: 1.05,
          }}
        >
          {VILLAGE.nameEn}
        </div>
        <div style={{ fontSize: 36, marginTop: 20, color: "#EAE0CF" }}>
          {VILLAGE.districtEn}
        </div>
        <div
          style={{
            marginTop: 48,
            width: 160,
            height: 8,
            background: "#D7B25E",
            borderRadius: 4,
          }}
        />
      </div>
    ),
    { ...size },
  );
}
