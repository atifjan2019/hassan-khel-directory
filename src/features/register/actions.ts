"use server";

import { createClient } from "@/lib/supabase/server";
import { notifyAdminNewRegistration } from "@/lib/email";
import { registerSchema } from "./schema";

export type SubmitResult = { ok: true } | { ok: false; error: string };

/**
 * Insert a new (pending) profile. RLS allows anon INSERT; the DB guard
 * trigger forces status='pending' and strips moderation fields, so we only
 * send the user-supplied data columns. Photo is uploaded client-side first;
 * we receive only the storage object path.
 */
export async function submitRegistration(
  input: unknown,
): Promise<SubmitResult> {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return {
      ok: false,
      error: first?.message ?? "validation",
    };
  }

  const v = parsed.data;

  try {
    const supabase = await createClient();

    const { error } = await supabase.from("profiles").insert({
      honorific: v.honorific ?? null,
      full_name_en: v.full_name_en,
      full_name_ur: v.full_name_ur ?? null,
      father_name_en: v.father_name_en,
      father_name_ur: v.father_name_ur ?? null,
      grandfather_name_en: v.grandfather_name_en ?? null,
      grandfather_name_ur: v.grandfather_name_ur ?? null,
      date_of_birth: v.date_of_birth ?? null,
      profession: v.profession,
      qualification: v.qualification ?? null,
      qualification_level: v.qualification_level ?? null,
      institute: v.institute ?? null,
      current_city: v.current_city ?? null,
      house_area: v.house_area ?? null,
      father_profile_id: v.father_profile_id ?? null,
      bio_en: v.bio_en ?? null,
      bio_ur: v.bio_ur ?? null,
      phone: v.phone ?? null,
      email: v.email ?? null,
      photo_url: v.photo_url ?? null,
      hide_photo: v.hide_photo,
      latitude: v.latitude ?? null,
      longitude: v.longitude ?? null,
    });

    if (error) {
      console.error("[register] insert failed:", error.message);
      return { ok: false, error: error.message };
    }
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unexpected error";
    console.error("[register] unexpected error:", message);
    return { ok: false, error: message };
  }

  // Best-effort admin notification — never block / fail the registration.
  try {
    await notifyAdminNewRegistration({
      full_name_en: v.full_name_en,
      father_name_en: v.father_name_en,
      profession: v.profession,
      current_city: v.current_city ?? null,
    });
  } catch (err) {
    console.error("[register] notify failed (ignored):", err);
  }

  return { ok: true };
}
