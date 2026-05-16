import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Newspaper, CalendarDays, Moon } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { SectionHeading } from "@/components/shared/section-heading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Separator } from "@/components/ui/separator";
import { getNews, getNewsPost } from "@/lib/queries";
import { localized, formatDate, storageUrl } from "@/lib/utils";
import { formatHijri } from "@/lib/hijri";
import { bodyToPlainTextWithBreaks, excerpt } from "@/features/news/news-utils";
import { JsonLd } from "@/components/shared/json-ld";
import { pageMetadata, newsArticleJsonLd, breadcrumbJsonLd } from "@/lib/seo";

export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id?: string }>;
}): Promise<Metadata> {
  const { locale, id } = await params;
  const t = await getTranslations({ locale, namespace: "metadata" });
  const post = id ? await getNewsPost(id) : null;
  if (!post)
    return pageMetadata({
      title: t("newsTitle"),
      path: "/news",
      noindex: true,
    });
  const title = localized(locale, post.title_en);
  return pageMetadata({
    title,
    description: excerpt(localized(locale, post.body_en), 155),
    path: `/news/${post.id}`,
    type: "article",
    image: storageUrl(post.cover_image_url) ?? undefined,
    publishedTime: post.published_at,
    modifiedTime: post.updated_at,
  });
}

export default async function NewsPostPage({
  params,
}: {
  params: Promise<{ locale: string; id?: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("news");
  const tCat = await getTranslations("options.newsCategory");

  const post = id ? await getNewsPost(id) : null;

  if (!post) {
    return (
      <div className="container-page">
        <div className="mx-auto max-w-xl">
          <EmptyState
            icon={Newspaper}
            title="Announcement not found"
            description="This announcement may have been removed or moved."
            action={
              <Button variant="outline" asChild>
                <Link href="/news">{t("backToNews")}</Link>
              </Button>
            }
          />
        </div>
      </div>
    );
  }

  const title = localized(locale, post.title_en);
  const body = bodyToPlainTextWithBreaks(
    localized(locale, post.body_en),
  );
  const cover = storageUrl(post.cover_image_url);
  const gregorian = formatDate(post.published_at, locale);
  const hijri = formatHijri(post.published_at, locale);

  const recent = await getNews({ limit: 5 });
  const related = recent.filter((p) => p.id !== post.id).slice(0, 4);

  const jsonLd = [
    newsArticleJsonLd({
      title,
      description: excerpt(localized(locale, post.body_en), 200),
      path: `/news/${post.id}`,
      image: cover,
      publishedAt: post.published_at,
    }),
    breadcrumbJsonLd([
      { name: "Home", path: "/" },
      { name: t("backToNews"), path: "/news" },
      { name: title, path: `/news/${post.id}` },
    ]),
  ];

  return (
    <div className="container-page">
      <JsonLd data={jsonLd} />
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/news">
            <span aria-hidden="true" className="rtl:hidden">
              ←
            </span>
            <span aria-hidden="true" className="hidden rtl:inline">
              →
            </span>
            {t("backToNews")}
          </Link>
        </Button>
      </div>

      <article className="mx-auto max-w-3xl">
        <header>
          <Badge variant="secondary">{tCat(post.category as never)}</Badge>
          <h1 className="mt-3 font-display text-3xl leading-tight text-forest-700 sm:text-4xl">
            {title}
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="size-4" aria-hidden="true" />
              <span className="font-medium">{t("postedOn")}:</span>
              {gregorian}
            </span>
            {hijri && (
              <span className="inline-flex items-center gap-1.5">
                <Moon className="size-4" aria-hidden="true" />
                <span className="font-medium">{t("hijriOn")}:</span>
                {hijri}
              </span>
            )}
          </div>
        </header>

        {cover && (
          <div className="relative mt-6 aspect-video w-full overflow-hidden rounded-lg bg-cream-200 ring-1 ring-border">
            <Image
              src={cover}
              alt={title}
              fill
              priority
              sizes="(max-width: 768px) 100vw, 768px"
              className="object-cover"
            />
          </div>
        )}

        <div className="geo-rule my-8">
          <span className="text-xs text-gold-600">✦</span>
        </div>

        {body ? (
          <div className="prose-village whitespace-pre-line text-base leading-relaxed text-foreground/90">
            {body}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No details available.
          </p>
        )}
      </article>

      {related.length > 0 && (
        <section className="mt-14" aria-labelledby="related-heading">
          <Separator className="mb-10" />
          <div className="mx-auto max-w-5xl">
            <SectionHeading title={t("related")} />
            <ul className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {related.map((p) => {
                const rTitle = localized(locale, p.title_en);
                const rCover = storageUrl(p.cover_image_url);
                return (
                  <li key={p.id}>
                    <Link
                      href={`/news/${p.id}`}
                      className="card-paper group flex items-center gap-4 p-3 transition-colors hover:bg-primary/5"
                    >
                      <span className="relative size-20 shrink-0 overflow-hidden rounded-md bg-cream-200">
                        {rCover ? (
                          <Image
                            src={rCover}
                            alt={rTitle}
                            fill
                            loading="lazy"
                            sizes="80px"
                            className="object-cover"
                          />
                        ) : (
                          <span className="flex h-full w-full items-center justify-center bg-gradient-to-br from-forest-100 to-gold-400/30">
                            <Newspaper
                              className="size-6 text-forest-700/30"
                              aria-hidden="true"
                            />
                          </span>
                        )}
                      </span>
                      <span className="min-w-0">
                        <span className="block text-xs text-muted-foreground">
                          {tCat(p.category as never)} ·{" "}
                          {formatDate(p.published_at, locale)}
                        </span>
                        <span className="mt-0.5 line-clamp-2 font-display text-base leading-snug text-forest-700 group-hover:text-forest-600">
                          {rTitle}
                        </span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>
      )}
    </div>
  );
}
