import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Images, ImageOff } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { SectionHeading } from "@/components/shared/section-heading";
import { EmptyState } from "@/components/ui/empty-state";
import { getAlbums } from "@/lib/queries";
import { localized, formatDate, storageUrl } from "@/lib/utils";
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
    title: t("galleryTitle"),
    description:
      "Photo albums from events, gatherings and occasions in Hassan Khel village.",
    path: "/gallery",
  });
}

export default async function GalleryPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("gallery");
  const albums = await getAlbums();

  return (
    <div className="container-page">
      <SectionHeading title={t("title")} subtitle={t("subtitle")} centered />

      <div className="mt-8">
        {albums.length === 0 ? (
          <EmptyState icon={Images} title={t("empty")} />
        ) : (
          <ul className="grid grid-cols-2 gap-4 md:grid-cols-3">
            {albums.map((album) => {
              const title = localized(locale, album.title_en);
              const cover = storageUrl(album.cover_image_url);
              return (
                <li key={album.id}>
                  <Link
                    href={`/gallery/${album.id}`}
                    className="card-paper group flex h-full flex-col overflow-hidden transition-shadow hover:shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <div className="relative aspect-square w-full overflow-hidden bg-cream-200">
                      {cover ? (
                        <Image
                          src={cover}
                          alt={title}
                          fill
                          loading="lazy"
                          sizes="(max-width: 768px) 50vw, 33vw"
                          className="object-cover transition-transform duration-300 group-hover:scale-[1.04]"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-forest-100 via-cream-200 to-gold-400/30">
                          <ImageOff
                            className="size-9 text-forest-700/30"
                            aria-hidden="true"
                          />
                        </div>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col gap-1 p-4">
                      <h3 className="font-display text-base leading-tight text-forest-700 group-hover:text-forest-600 sm:text-lg">
                        {title}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(album.event_date, locale)}
                      </p>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
