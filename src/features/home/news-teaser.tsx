import { getTranslations } from "next-intl/server";
import { NewsCard } from "@/features/news/news-card";
import type { NewsRow } from "@/lib/database.types";

/**
 * Home-page news strip — reuses the shared NewsCard so styling, cover/gradient
 * handling, localized titles and Gregorian + Hijri dates stay consistent.
 */
export async function NewsTeaser({
  posts,
  locale,
}: {
  posts: NewsRow[];
  locale: string;
}) {
  const t = await getTranslations("news");
  const tCat = await getTranslations("options.newsCategory");

  return (
    <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {posts.map((post) => (
        <li key={post.id}>
          <NewsCard
            post={post}
            locale={locale}
            categoryLabel={tCat(post.category as never)}
            pinnedLabel={t("pinned")}
            postedOnLabel={t("postedOn")}
            hijriLabel={t("hijriOn")}
          />
        </li>
      ))}
    </ul>
  );
}
