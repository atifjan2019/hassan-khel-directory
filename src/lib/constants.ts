/**
 * Shared, framework-agnostic constants for the Hassan Khel directory.
 * Profession / category / city values are stored verbatim in the DB so the
 * keys here are the source of truth — translate via i18n `options.*` keys.
 */

export const PROFESSIONS = [
  "doctor",
  "engineer",
  "teacher",
  "farmer",
  "religious_scholar",
  "government_officer",
  "student",
  "businessman",
  "laborer",
  "other",
] as const;
export type Profession = (typeof PROFESSIONS)[number];

export const QUALIFICATION_LEVELS = [
  "none",
  "primary",
  "matric",
  "intermediate",
  "bachelor",
  "master",
  "mphil_phd",
  "religious",
] as const;
export type QualificationLevel = (typeof QUALIFICATION_LEVELS)[number];

export const NEWS_CATEGORIES = [
  "death",
  "wedding",
  "jirga",
  "meeting",
  "fundraiser",
  "govt_scheme",
  "school",
  "general",
] as const;
export type NewsCategory = (typeof NEWS_CATEGORIES)[number];

export const PROFILE_STATUSES = [
  "pending",
  "approved",
  "rejected",
  "disabled",
] as const;
export type ProfileStatus = (typeof PROFILE_STATUSES)[number];

/** Honorific titles common in the village; optional, prepended to names. */
// NOTE: values must NOT contain "." — next-intl treats dots as key paths.
export const HONORIFICS = [
  "",
  "Haji",
  "Maulana",
  "Mufti",
  "Qari",
  "Dr",
  "Engr",
  "Master",
  "Subedar",
] as const;
export type Honorific = (typeof HONORIFICS)[number];

/** Common destination cities for villagers working abroad / in-country. */
export const COMMON_CITIES = [
  "Hassan Khel",
  "Charsadda",
  "Peshawar",
  "Mardan",
  "Nowshera",
  "Islamabad",
  "Rawalpindi",
  "Karachi",
  "Lahore",
  "Dubai",
  "Abu Dhabi",
  "Riyadh",
  "Jeddah",
  "Dammam",
  "Doha",
  "Kuwait City",
  "Muscat",
] as const;

export const LOCALES = ["ur", "en"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "ur";
export const RTL_LOCALES: Locale[] = ["ur"];

export const VILLAGE = {
  nameEn: "Hassan Khel",
  nameUr: "حسن خیل",
  districtEn: "Charsadda, Khyber Pakhtunkhwa, Pakistan",
  districtUr: "چارسدہ، خیبر پختونخوا، پاکستان",
  lat: Number(process.env.NEXT_PUBLIC_VILLAGE_LAT ?? 34.1453),
  lng: Number(process.env.NEXT_PUBLIC_VILLAGE_LNG ?? 71.7308),
  zoom: Number(process.env.NEXT_PUBLIC_VILLAGE_ZOOM ?? 15),
} as const;

export const STORAGE_BUCKET =
  process.env.NEXT_PUBLIC_SUPABASE_BUCKET ?? "village-media";

export const PAGE_SIZE = 24;
