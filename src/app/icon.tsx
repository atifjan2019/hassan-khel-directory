import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

// Brand monogram favicon — forest green field, gold initials.
export default function Icon() {
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
          fontSize: 17,
          fontWeight: 700,
          letterSpacing: -1,
        }}
      >
        HK
      </div>
    ),
    { ...size },
  );
}
