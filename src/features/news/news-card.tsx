import Image from "next/image";
import { Pin, Newspaper } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/ui/badge";
import type { NewsRow } from "@/lib/database.types";
import { localized, formatDate, storageUrl } from "@/lib/utils";
import { formatHijri } from "@/lib/hijri";
import { excerpt } from "@/features/news/news-utils";

/** A single announcement card used in the news list. */
export function NewsCard({
  post,
  locale,
  categoryLabel,
  pinnedLabel,
  postedOnLabel,
  hijriLabel,
}: {
  post: NewsRow;
  locale: string;
  categoryLabel: string;
  pinnedLabel: string;
  postedOnLabel: string;
  hijriLabel: string;
}) {
  const title = localized(locale, post.title_en);
  const summary = excerpt(localized(locale, post.body_en), 160);
  const cover = storageUrl(post.cover_image_url);
  const gregorian = formatDate(post.published_at, locale);
  const hijri = formatHijri(post.published_at, locale);

  return (
    <Link
      href={`/news/${post.id}`}
      className="card-paper group flex h-full flex-col overflow-hidden transition-shadow hover:shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="relative aspect-video w-full overflow-hidden bg-cream-200">
        {cover ? (
          <Image
            src={cover}
            alt={title}
            fill
            loading="lazy"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-forest-100 via-cream-200 to-gold-400/30">
            <Newspaper className="size-10 text-forest-700/30" aria-hidden="true" />
          </div>
        )}
        {post.is_pinned && (
          <span className="absolute start-3 top-3">
            <Badge variant="accent" className="shadow-soft">
              <Pin className="size-3" aria-hidden="true" />
              {pinnedLabel}
            </Badge>
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-5">
        <div>
          <Badge variant="secondary">{categoryLabel}</Badge>
        </div>
        <h3 className="font-display text-xl leading-tight text-forest-700 group-hover:text-forest-600">
          {title}
        </h3>
        <p className="text-xs text-muted-foreground">
          <span className="font-medium">{postedOnLabel}:</span> {gregorian}
          {hijri && (
            <>
              {" · "}
              <span className="font-medium">{hijriLabel}:</span> {hijri}
            </>
          )}
        </p>
        {summary && (
          <p className="mt-1 line-clamp-3 text-sm leading-relaxed text-foreground/80">
            {summary}
          </p>
        )}
      </div>
    </Link>
  );
}
