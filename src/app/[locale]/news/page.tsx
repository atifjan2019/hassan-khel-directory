import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Newspaper, Pin } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { SectionHeading } from "@/components/shared/section-heading";
import { EmptyState } from "@/components/ui/empty-state";
import { Separator } from "@/components/ui/separator";
import { NewsCard } from "@/features/news/news-card";
import { getNews } from "@/lib/queries";
import { NEWS_CATEGORIES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { pageMetadata } from "@/lib/seo";

export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata" });
  return pageMetadata({
    title: t("newsTitle"),
    description:
      "Latest announcements from Hassan Khel village — deaths, weddings, jirga decisions, meetings, fundraisers, school and government scheme updates.",
    path: "/news",
  });
}

export default async function NewsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const sp = await searchParams;
  const t = await getTranslations("news");
  const tCat = await getTranslations("options.newsCategory");

  const rawCategory = sp.category?.trim();
  const activeCategory =
    rawCategory && NEWS_CATEGORIES.includes(rawCategory as never)
      ? rawCategory
      : undefined;

  const posts = await getNews(
    activeCategory ? { category: activeCategory } : undefined,
  );

  const pinned = posts.filter((p) => p.is_pinned);
  const regular = posts.filter((p) => !p.is_pinned);

  const allLabel = "All";

  return (
    <div className="container-page">
      <SectionHeading title={t("title")} subtitle={t("subtitle")} centered />

      {/* Category filter chips */}
      <nav
        className="mt-8 flex flex-wrap justify-center gap-2"
        aria-label={t("category")}
      >
        <Link
          href="/news"
          aria-current={!activeCategory ? "page" : undefined}
          className={cn(
            "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
            !activeCategory
              ? "border-transparent bg-primary text-primary-foreground"
              : "border-border bg-card text-foreground hover:bg-primary/5",
          )}
        >
          {allLabel}
        </Link>
        {NEWS_CATEGORIES.map((c) => {
          const isActive = activeCategory === c;
          return (
            <Link
              key={c}
              href={`/news?category=${c}`}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
                isActive
                  ? "border-transparent bg-primary text-primary-foreground"
                  : "border-border bg-card text-foreground hover:bg-primary/5",
              )}
            >
              {tCat(c as never)}
            </Link>
          );
        })}
      </nav>

      <div className="mt-8">
        {posts.length === 0 ? (
          <EmptyState
            icon={Newspaper}
            title={t("empty")}
            description={
              activeCategory
                ? "No announcements in this category."
                : undefined
            }
            action={
              activeCategory ? (
                <Link
                  href="/news"
                  className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                >
                  {allLabel}
                </Link>
              ) : undefined
            }
          />
        ) : (
          <div className="space-y-10">
            {pinned.length > 0 && (
              <section aria-labelledby="pinned-heading">
                <div className="mb-4 flex items-center gap-2">
                  <Pin
                    className="size-4 text-gold-600"
                    aria-hidden="true"
                  />
                  <h2
                    id="pinned-heading"
                    className="font-display text-lg text-forest-700"
                  >
                    {t("pinned")}
                  </h2>
                </div>
                <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {pinned.map((post) => (
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
              </section>
            )}

            {pinned.length > 0 && regular.length > 0 && <Separator />}

            {regular.length > 0 && (
              <section>
                <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {regular.map((post) => (
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
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
