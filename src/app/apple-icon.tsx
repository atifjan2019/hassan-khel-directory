import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#1B4332",
          color: "#D7B25E",
          fontSize: 92,
          fontWeight: 700,
          letterSpacing: -3,
        }}
      >
        HK
      </div>
    ),
    { ...size },
  );
}
