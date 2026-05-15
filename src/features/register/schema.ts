import { z } from "zod";
import {
  HONORIFICS,
  PROFESSIONS,
  QUALIFICATION_LEVELS,
} from "@/lib/constants";

/** Trim, then coerce empty strings to undefined so "optional" really is. */
const optionalText = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v && v.length > 0 ? v : undefined));

/**
 * Registration form schema. Mirrors the writable columns of `profiles`.
 * Moderation fields (status, approved_*) are intentionally absent — the DB
 * guard trigger forces status='pending' and strips them.
 */
export const registerSchema = z.object({
  honorific: z
    .enum([...HONORIFICS] as [string, ...string[]])
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined)),

  full_name_en: z
    .string()
    .trim()
    .min(2, { message: "validationName" }),

  father_name_en: z
    .string()
    .trim()
    .min(2, { message: "validationFather" }),

  grandfather_name_en: optionalText,

  date_of_birth: optionalText,

  profession: z.enum([...PROFESSIONS] as [string, ...string[]]),

  qualification: optionalText,
  qualification_level: z
    .enum([...QUALIFICATION_LEVELS] as [string, ...string[]])
    .default("none"),
  institute: optionalText,

  current_city: optionalText,
  house_area: optionalText,

  father_profile_id: z
    .string()
    .uuid()
    .optional()
    .or(z.literal("").transform(() => undefined)),

  bio_en: optionalText,

  phone: optionalText,
  email: z
    .string()
    .trim()
    .email()
    .optional()
    .or(z.literal("").transform(() => undefined)),

  hide_photo: z.boolean().default(false),
  photo_url: optionalText,

  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),

  consent: z.literal(true, {
    errorMap: () => ({ message: "validationConsent" }),
  }),
});

export type RegisterInput = z.infer<typeof registerSchema>;

/** The form's own field model (consent + all inputs, before submit). */
export type RegisterFormValues = z.input<typeof registerSchema>;
