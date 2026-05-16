import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Images, CalendarDays } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { GalleryGrid } from "@/features/gallery/lightbox";
import { getAlbum } from "@/lib/queries";
import { localized, formatDate, storageUrl } from "@/lib/utils";
import { JsonLd } from "@/components/shared/json-ld";
import {
  pageMetadata,
  breadcrumbJsonLd,
  absoluteUrl,
} from "@/lib/seo";

export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; albumId?: string }>;
}): Promise<Metadata> {
  const { locale, albumId } = await params;
  const t = await getTranslations({ locale, namespace: "metadata" });
  const result = albumId ? await getAlbum(albumId) : null;
  if (!result)
    return pageMetadata({
      title: t("galleryTitle"),
      path: "/gallery",
      noindex: true,
    });
  const title = localized(locale, result.album.title_en);
  return pageMetadata({
    title,
    description:
      localized(locale, result.album.description_en) ||
      `Photo album "${title}" from Hassan Khel village.`,
    path: `/gallery/${result.album.id}`,
    image: storageUrl(result.album.cover_image_url) ?? undefined,
  });
}

export default async function AlbumPage({
  params,
}: {
  params: Promise<{ locale: string; albumId?: string }>;
}) {
  const { locale, albumId } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("gallery");
  const tCommon = await getTranslations("common");

  const result = albumId ? await getAlbum(albumId) : null;

  if (!result) {
    return (
      <div className="container-page">
        <div className="mx-auto max-w-xl">
          <EmptyState
            icon={Images}
            title="Album not found"
            description="This album may have been removed."
            action={
              <Button variant="outline" asChild>
                <Link href="/gallery">{t("backToGallery")}</Link>
              </Button>
            }
          />
        </div>
      </div>
    );
  }

  const { album, photos } = result;
  const title = localized(locale, album.title_en);
  const description = localized(locale, album.description_en);

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "ImageGallery",
      name: title,
      ...(description ? { description } : {}),
      url: absoluteUrl(`/gallery/${album.id}`),
      datePublished: album.event_date,
      image: photos
        .slice(0, 30)
        .map((p) => storageUrl(p.image_url))
        .filter((u): u is string => Boolean(u)),
    },
    breadcrumbJsonLd([
      { name: "Home", path: "/" },
      { name: t("backToGallery"), path: "/gallery" },
      { name: title, path: `/gallery/${album.id}` },
    ]),
  ];

  return (
    <div className="container-page">
      <JsonLd data={jsonLd} />
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/gallery">
            <span aria-hidden="true" className="rtl:hidden">
              ←
            </span>
            <span aria-hidden="true" className="hidden rtl:inline">
              →
            </span>
            {t("backToGallery")}
          </Link>
        </Button>
      </div>

      <header className="mx-auto max-w-3xl text-center">
        <div className="geo-rule mb-3">
          <span className="text-xs text-gold-600">✦</span>
        </div>
        <h1 className="font-display text-3xl leading-tight text-forest-700 sm:text-4xl">
          {title}
        </h1>
        <div className="mt-3 flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays className="size-4" aria-hidden="true" />
            {formatDate(album.event_date, locale)}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Images className="size-4" aria-hidden="true" />
            {t("photos", { count: photos.length })}
          </span>
        </div>
        {description && (
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-foreground/80">
            {description}
          </p>
        )}
      </header>

      <div className="mt-10">
        {photos.length === 0 ? (
          <EmptyState
            icon={Images}
            title="This album has no photos yet."
          />
        ) : (
          <GalleryGrid
            photos={photos}
            locale={locale}
            albumTitle={title}
            openLabel={t("openLightbox")}
            closeLabel={tCommon("close")}
            prevLabel={tCommon("previous")}
            nextLabel={tCommon("next")}
            swipeHint={t("swipeHint")}
          />
        )}
      </div>
    </div>
  );
}
