import type { MetadataRoute } from "next";
import { SITE_NAME } from "@/lib/seo";
import { VILLAGE } from "@/lib/constants";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE_NAME,
    short_name: VILLAGE.nameEn,
    description:
      "Public directory of the people, families, professions and news of Hassan Khel village.",
    start_url: "/",
    display: "standalone",
    background_color: "#F5EFE6",
    theme_color: "#1B4332",
    icons: [
      { src: "/icon", sizes: "32x32", type: "image/png" },
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
