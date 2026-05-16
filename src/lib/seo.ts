/**
 * Centralised SEO helpers: canonical URLs, per-page metadata, and JSON-LD
 * structured-data builders. Keeping this in one place keeps titles,
 * descriptions, canonicals and Open Graph/Twitter tags consistent.
 */
import type { Metadata } from "next";
import { VILLAGE } from "@/lib/constants";

/** Public origin, no trailing slash. Set NEXT_PUBLIC_SITE_URL in production. */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
).replace(/\/+$/, "");

export const SITE_NAME = `${VILLAGE.nameEn} Village Directory`;

/** Absolute URL for a path, resolved against the public origin. */
export function absoluteUrl(path = "/"): string {
  return new URL(path || "/", SITE_URL).toString();
}

interface PageMetaInput {
  /** Page title (fills the `%s · …` template). Omit on the home page. */
  title?: string;
  description?: string;
  /** Canonical path, e.g. "/news" or `/news/${id}`. */
  path: string;
  /** Absolute image URL; falls back to the generated opengraph-image. */
  image?: string;
  type?: "website" | "article" | "profile";
  noindex?: boolean;
  publishedTime?: string;
  modifiedTime?: string;
}

/**
 * Build a consistent Metadata object with a correct per-page canonical plus
 * Open Graph / Twitter tags. The file-based opengraph-image is used as the
 * social image unless `image` is provided.
 */
export function pageMetadata(input: PageMetaInput): Metadata {
  const url = absoluteUrl(input.path);
  const images = input.image ? [{ url: input.image }] : undefined;
  const ogType =
    input.type === "article"
      ? "article"
      : input.type === "profile"
        ? "profile"
        : "website";

  return {
    ...(input.title ? { title: input.title } : {}),
    ...(input.description ? { description: input.description } : {}),
    alternates: { canonical: input.path },
    ...(input.noindex
      ? { robots: { index: false, follow: false } }
      : {}),
    openGraph: {
      type: ogType,
      url,
      siteName: SITE_NAME,
      ...(input.title ? { title: input.title } : {}),
      ...(input.description ? { description: input.description } : {}),
      ...(images ? { images } : {}),
      ...(ogType === "article" && input.publishedTime
        ? {
            publishedTime: input.publishedTime,
            ...(input.modifiedTime
              ? { modifiedTime: input.modifiedTime }
              : {}),
          }
        : {}),
    },
    twitter: {
      card: "summary_large_image",
      ...(input.title ? { title: input.title } : {}),
      ...(input.description ? { description: input.description } : {}),
      ...(images ? { images } : {}),
    },
  };
}

/* ── JSON-LD structured data ─────────────────────────────────────────── */

type Json = Record<string, unknown>;

const villageAddress = {
  "@type": "PostalAddress",
  addressLocality: VILLAGE.nameEn,
  addressRegion: "Khyber Pakhtunkhwa",
  addressCountry: "PK",
};

/** Site-wide WebSite + Organization graph (rendered once in the layout). */
export function siteJsonLd(): Json {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        url: SITE_URL,
        name: SITE_NAME,
        description:
          "A public directory of the people, families, professions and news of Hassan Khel village, Charsadda, Khyber Pakhtunkhwa, Pakistan.",
        inLanguage: "en",
        publisher: { "@id": `${SITE_URL}/#organization` },
      },
      {
        "@type": "Organization",
        "@id": `${SITE_URL}/#organization`,
        name: SITE_NAME,
        url: SITE_URL,
        logo: absoluteUrl("/icon"),
        address: villageAddress,
        areaServed: {
          "@type": "Place",
          name: `${VILLAGE.nameEn}, ${VILLAGE.districtEn}`,
          geo: {
            "@type": "GeoCoordinates",
            latitude: VILLAGE.lat,
            longitude: VILLAGE.lng,
          },
        },
      },
    ],
  };
}

export function breadcrumbJsonLd(
  items: { name: string; path: string }[],
): Json {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: absoluteUrl(it.path),
    })),
  };
}

export function newsArticleJsonLd(input: {
  title: string;
  description: string;
  path: string;
  image?: string | null;
  publishedAt: string;
}): Json {
  return {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: input.title,
    description: input.description,
    datePublished: input.publishedAt,
    dateModified: input.publishedAt,
    inLanguage: "en",
    mainEntityOfPage: absoluteUrl(input.path),
    ...(input.image ? { image: [input.image] } : {}),
    author: { "@type": "Organization", name: SITE_NAME },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      logo: { "@type": "ImageObject", url: absoluteUrl("/icon") },
    },
  };
}

export function personJsonLd(input: {
  name: string;
  path: string;
  jobTitle?: string;
  image?: string | null;
  deceased?: boolean;
}): Json {
  return {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    mainEntity: {
      "@type": "Person",
      name: input.name,
      url: absoluteUrl(input.path),
      ...(input.jobTitle ? { jobTitle: input.jobTitle } : {}),
      ...(input.image ? { image: input.image } : {}),
      homeLocation: {
        "@type": "Place",
        name: `${VILLAGE.nameEn}, ${VILLAGE.districtEn}`,
      },
    },
  };
}
