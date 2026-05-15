"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import type { AlbumPhotoRow } from "@/lib/database.types";
import { localized, storageUrl } from "@/lib/utils";

interface LightboxPhoto {
  id: string;
  url: string;
  caption: string;
}

/**
 * Accessible, dependency-free photo gallery + modal lightbox.
 * - Keyboard: ←/→ navigate, Esc closes.
 * - Touch: swipe left/right on mobile.
 * - Renders the overlay via a portal to document.body (SSR-guarded).
 */
export function GalleryGrid({
  photos,
  locale,
  albumTitle,
  openLabel,
  closeLabel,
  prevLabel,
  nextLabel,
  swipeHint,
}: {
  photos: AlbumPhotoRow[];
  locale: string;
  albumTitle: string;
  openLabel: string;
  closeLabel: string;
  prevLabel: string;
  nextLabel: string;
  swipeHint: string;
}) {
  const items = React.useMemo<LightboxPhoto[]>(
    () =>
      photos
        .map((p) => {
          const url = storageUrl(p.image_url);
          if (!url) return null;
          return {
            id: p.id,
            url,
            caption: localized(locale, p.caption_en, p.caption_ur),
          };
        })
        .filter((p): p is LightboxPhoto => p !== null),
    [photos, locale],
  );

  const [mounted, setMounted] = React.useState(false);
  const [index, setIndex] = React.useState<number | null>(null);
  const touchStartX = React.useRef<number | null>(null);
  const touchStartY = React.useRef<number | null>(null);

  React.useEffect(() => setMounted(true), []);

  const isOpen = index !== null;

  const close = React.useCallback(() => setIndex(null), []);
  const next = React.useCallback(
    () => setIndex((i) => (i === null ? i : (i + 1) % items.length)),
    [items.length],
  );
  const prev = React.useCallback(
    () =>
      setIndex((i) =>
        i === null ? i : (i - 1 + items.length) % items.length,
      ),
    [items.length],
  );

  // Lock body scroll while the lightbox is open.
  React.useEffect(() => {
    if (!isOpen) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [isOpen]);

  // Keyboard navigation.
  React.useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowRight") next();
      else if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, close, next, prev]);

  const onTouchStart = (e: React.TouchEvent) => {
    const tch = e.changedTouches[0];
    touchStartX.current = tch.clientX;
    touchStartY.current = tch.clientY;
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const tch = e.changedTouches[0];
    const dx = tch.clientX - touchStartX.current;
    const dy = tch.clientY - touchStartY.current;
    touchStartX.current = null;
    touchStartY.current = null;
    // Horizontal swipe only (ignore mostly-vertical gestures).
    if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy)) return;
    // Swipe right -> previous, swipe left -> next (works in RTL too).
    if (dx < 0) next();
    else prev();
  };

  const active = index !== null ? items[index] : null;

  return (
    <>
      <ul className="columns-2 gap-3 sm:columns-3 lg:columns-4 [&>li]:mb-3">
        {items.map((photo, i) => (
          <li key={photo.id} className="break-inside-avoid">
            <button
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`${openLabel} — ${i + 1} / ${items.length}`}
              aria-haspopup="dialog"
              className="group block w-full overflow-hidden rounded-lg bg-cream-200 ring-1 ring-border transition-shadow hover:shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Image
                src={photo.url}
                alt={photo.caption || albumTitle}
                width={600}
                height={450}
                loading="lazy"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                className="h-auto w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
              />
            </button>
          </li>
        ))}
      </ul>

      {mounted && active
        ? createPortal(
            <div
              role="dialog"
              aria-modal="true"
              aria-label={albumTitle}
              className="fixed inset-0 z-[100] flex flex-col bg-charcoal/95 backdrop-blur-sm animate-fade-in"
              onClick={close}
              onTouchStart={onTouchStart}
              onTouchEnd={onTouchEnd}
            >
              {/* Top bar */}
              <div className="flex items-center justify-between gap-4 p-4 text-cream-50">
                <span
                  className="text-sm font-medium tabular-nums"
                  aria-live="polite"
                >
                  {(index ?? 0) + 1} / {items.length}
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    close();
                  }}
                  aria-label={closeLabel}
                  className="rounded-full p-2 transition-colors hover:bg-cream-50/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cream-50"
                >
                  <X className="size-6" />
                </button>
              </div>

              {/* Image stage */}
              <div
                className="relative flex flex-1 items-center justify-center px-4 pb-2"
                onClick={(e) => e.stopPropagation()}
              >
                {items.length > 1 && (
                  <button
                    type="button"
                    onClick={prev}
                    aria-label={prevLabel}
                    className="absolute start-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-cream-50/10 p-2.5 text-cream-50 transition-colors hover:bg-cream-50/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cream-50 sm:start-4"
                  >
                    <ChevronLeft className="size-7 rtl:rotate-180" />
                  </button>
                )}

                <div className="relative h-full max-h-[78vh] w-full max-w-5xl">
                  <Image
                    key={active.id}
                    src={active.url}
                    alt={active.caption || albumTitle}
                    fill
                    priority
                    sizes="100vw"
                    className="object-contain"
                  />
                </div>

                {items.length > 1 && (
                  <button
                    type="button"
                    onClick={next}
                    aria-label={nextLabel}
                    className="absolute end-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-cream-50/10 p-2.5 text-cream-50 transition-colors hover:bg-cream-50/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cream-50 sm:end-4"
                  >
                    <ChevronRight className="size-7 rtl:rotate-180" />
                  </button>
                )}
              </div>

              {/* Caption + swipe hint */}
              <div
                className="px-6 pb-6 pt-2 text-center"
                onClick={(e) => e.stopPropagation()}
              >
                {active.caption && (
                  <p className="mx-auto max-w-2xl text-sm leading-relaxed text-cream-100">
                    {active.caption}
                  </p>
                )}
                {items.length > 1 && (
                  <p className="mt-2 text-xs text-cream-50/50 sm:hidden">
                    {swipeHint}
                  </p>
                )}
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
