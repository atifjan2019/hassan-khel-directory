import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo";
import { getDirectory, getNews, getAlbums } from "@/lib/queries";

// Regenerate hourly so new members / news appear without a redeploy.
export const revalidate = 3600;

const STATIC_PATHS = [
  "/",
  "/about",
  "/directory",
  "/news",
  "/gallery",
  "/map",
  "/family-tree",
  "/register",
] as const;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const entries: MetadataRoute.Sitemap = STATIC_PATHS.map((path) => ({
    url: absoluteUrl(path),
    lastModified: now,
    changeFrequency: path === "/" ? "daily" : "weekly",
    priority: path === "/" ? 1 : 0.7,
  }));

  try {
    const profiles: MetadataRoute.Sitemap = [];
    // public_profiles is paginated; walk pages (cap as a safety bound).
    for (let page = 1; page <= 100; page++) {
      const { profiles: rows, hasMore } = await getDirectory({ page });
      for (const p of rows) {
        profiles.push({
          url: absoluteUrl(`/directory/${p.id}`),
          lastModified: new Date(p.approved_at ?? p.created_at),
          changeFrequency: "monthly",
          priority: 0.5,
        });
      }
      if (!hasMore) break;
    }

    const news = (await getNews()).map((n) => ({
      url: absoluteUrl(`/news/${n.id}`),
      lastModified: new Date(n.updated_at ?? n.published_at),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    }));

    const albums = (await getAlbums()).map((a) => ({
      url: absoluteUrl(`/gallery/${a.id}`),
      lastModified: new Date(a.updated_at ?? a.created_at),
      changeFrequency: "monthly" as const,
      priority: 0.5,
    }));

    return [...entries, ...profiles, ...news, ...albums];
  } catch {
    // Never let a transient DB hiccup break the sitemap entirely.
    return entries;
  }
}
