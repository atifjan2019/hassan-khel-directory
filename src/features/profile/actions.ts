"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { STORAGE_BUCKET } from "@/lib/constants";
import type { ProfileRow } from "@/lib/database.types";

export type ActionResult = { ok: boolean; error?: string };

function str(fd: FormData, key: string): string | null {
  const v = fd.get(key);
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t === "" ? null : t;
}

function bool(fd: FormData, key: string): boolean {
  const v = fd.get(key);
  return v === "true" || v === "on" || v === "1";
}

function num(fd: FormData, key: string): number | null {
  const v = str(fd, key);
  if (v === null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function slugifyName(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9.]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48) || "file"
  );
}

/**
 * Update the logged-in user's OWN profile via the RLS client. The DB guard
 * trigger prevents changes to status / user_id, so only safe columns are
 * sent. Photo upload uses the RLS storage path users/<uid>/<uuid>-name.
 */
export async function updateOwnProfile(
  fd: FormData,
): Promise<ActionResult> {
  const { user } = await getSession();
  if (!user) return { ok: false, error: "unauthorized" };

  const supabase = await createClient();

  let photoPath: string | null = null;
  try {
    const file = fd.get("photo");
    if (file instanceof File && file.size > 0) {
      const ext = (file.name.split(".").pop() ?? "jpg").toLowerCase();
      const base = slugifyName(file.name.replace(/\.[^.]+$/, ""));
      const path = `users/${user.id}/${randomUUID()}-${base}.${ext}`;
      const buffer = Buffer.from(await file.arrayBuffer());
      const { error: upErr } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(path, buffer, {
          contentType: file.type || "image/jpeg",
          upsert: false,
        });
      if (upErr) return { ok: false, error: upErr.message };
      photoPath = path;
    }
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "upload_failed",
    };
  }

  const update: Partial<ProfileRow> = {
    full_name_en: str(fd, "full_name_en") ?? "",
    full_name_ur: str(fd, "full_name_ur"),
    date_of_birth: str(fd, "date_of_birth"),
    profession: str(fd, "profession") ?? "other",
    qualification: str(fd, "qualification"),
    qualification_level: str(fd, "qualification_level"),
    institute: str(fd, "institute"),
    current_city: str(fd, "current_city"),
    house_area: str(fd, "house_area"),
    bio_en: str(fd, "bio_en"),
    bio_ur: str(fd, "bio_ur"),
    phone: str(fd, "phone"),
    email: str(fd, "email"),
    hide_photo: bool(fd, "hide_photo"),
    latitude: num(fd, "latitude"),
    longitude: num(fd, "longitude"),
  };
  if (photoPath) update.photo_url = photoPath;

  const { error } = await supabase
    .from("profiles")
    .update(update)
    .eq("user_id", user.id);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/profile");
  return { ok: true };
}
