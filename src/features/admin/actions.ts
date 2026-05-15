"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { STORAGE_BUCKET } from "@/lib/constants";
import type {
  ProfileStatus,
  ProfileRow,
  NewsRow,
  AlbumRow,
} from "@/lib/database.types";

export type ActionResult = { ok: boolean; error?: string };

/** Defense in depth: re-verify the caller is an admin before any write. */
async function assertAdmin(): Promise<string | null> {
  const { user, isAdmin } = await getSession();
  if (!user || !isAdmin) return "unauthorized";
  return null;
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
 * Upload a single image (from a FormData File) via the SERVICE-ROLE client to
 * the admin storage prefix. Returns the stored object path or null.
 */
async function uploadAdminImage(
  file: File | null,
  prefix = "admin",
): Promise<string | null> {
  if (!file || file.size === 0) return null;
  const admin = createAdminClient();
  const ext = (file.name.split(".").pop() ?? "jpg").toLowerCase();
  const base = slugifyName(file.name.replace(/\.[^.]+$/, ""));
  const path = `${prefix}/${randomUUID()}-${base}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const { error } = await admin.storage
    .from(STORAGE_BUCKET)
    .upload(path, buffer, {
      contentType: file.type || "image/jpeg",
      upsert: false,
    });
  if (error) throw new Error(error.message);
  return path;
}

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

function revalidateAdmin(...paths: string[]) {
  for (const p of paths) revalidatePath(p);
}

/* ───────────────────────── Profiles ───────────────────────── */

export async function approveProfile(id: string): Promise<ActionResult> {
  const denied = await assertAdmin();
  if (denied) return { ok: false, error: denied };
  const supabase = await createClient();
  const { error } = await supabase.rpc("approve_profile", { p_id: id });
  if (error) return { ok: false, error: error.message };
  revalidateAdmin("/admin", "/admin/pending", "/admin/members");
  return { ok: true };
}

export async function rejectProfile(
  id: string,
  reason: string,
): Promise<ActionResult> {
  const denied = await assertAdmin();
  if (denied) return { ok: false, error: denied };
  const r = reason.trim();
  if (!r) return { ok: false, error: "reason_required" };
  const supabase = await createClient();
  const { error } = await supabase.rpc("reject_profile", {
    p_id: id,
    reason: r,
  });
  if (error) return { ok: false, error: error.message };
  revalidateAdmin("/admin", "/admin/pending", "/admin/members");
  return { ok: true };
}

export async function setProfileStatus(
  id: string,
  status: ProfileStatus,
): Promise<ActionResult> {
  const denied = await assertAdmin();
  if (denied) return { ok: false, error: denied };
  const supabase = await createClient();
  const { error } = await supabase.rpc("set_profile_status", {
    p_id: id,
    p_status: status,
  });
  if (error) return { ok: false, error: error.message };
  revalidateAdmin("/admin", "/admin/pending", "/admin/members");
  return { ok: true };
}

export async function deleteProfile(id: string): Promise<ActionResult> {
  const denied = await assertAdmin();
  if (denied) return { ok: false, error: denied };
  const admin = createAdminClient();
  const { error } = await admin.from("profiles").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidateAdmin("/admin", "/admin/members", "/admin/pending");
  return { ok: true };
}

/** Full profile edit (any field) — service-role to bypass RLS. */
export async function updateProfile(
  id: string,
  fd: FormData,
): Promise<ActionResult> {
  const denied = await assertAdmin();
  if (denied) return { ok: false, error: denied };

  try {
    const photoPath = await uploadAdminImage(
      fd.get("photo") as File | null,
      "profiles",
    );

    const status = (str(fd, "status") ?? "pending") as ProfileStatus;

    const update: Partial<ProfileRow> = {
      honorific: str(fd, "honorific"),
      full_name_en: str(fd, "full_name_en") ?? "",
      full_name_ur: str(fd, "full_name_ur"),
      father_name_en: str(fd, "father_name_en") ?? "",
      father_name_ur: str(fd, "father_name_ur"),
      grandfather_name_en: str(fd, "grandfather_name_en"),
      grandfather_name_ur: str(fd, "grandfather_name_ur"),
      date_of_birth: str(fd, "date_of_birth"),
      profession: str(fd, "profession") ?? "other",
      qualification: str(fd, "qualification"),
      qualification_level: str(fd, "qualification_level"),
      institute: str(fd, "institute"),
      current_city: str(fd, "current_city"),
      house_area: str(fd, "house_area"),
      phone: str(fd, "phone"),
      email: str(fd, "email"),
      bio_en: str(fd, "bio_en"),
      bio_ur: str(fd, "bio_ur"),
      hide_photo: bool(fd, "hide_photo"),
      is_deceased: bool(fd, "is_deceased"),
      latitude: num(fd, "latitude"),
      longitude: num(fd, "longitude"),
      status,
    };
    if (photoPath) update.photo_url = photoPath;

    const admin = createAdminClient();
    const { error } = await admin
      .from("profiles")
      .update(update)
      .eq("id", id);
    if (error) return { ok: false, error: error.message };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "unexpected",
    };
  }

  revalidateAdmin("/admin", "/admin/members", "/admin/pending");
  return { ok: true };
}

/* ───────────────────────── News ───────────────────────── */

export async function createNews(fd: FormData): Promise<ActionResult> {
  const denied = await assertAdmin();
  if (denied) return { ok: false, error: denied };
  try {
    const cover = await uploadAdminImage(
      fd.get("cover") as File | null,
      "admin",
    );
    const supabase = await createClient();
    const { error } = await supabase.from("news_posts").insert({
      title_en: str(fd, "title_en") ?? "",
      title_ur: str(fd, "title_ur"),
      body_en: str(fd, "body_en") ?? "",
      body_ur: str(fd, "body_ur"),
      category: str(fd, "category") ?? "general",
      is_pinned: bool(fd, "is_pinned"),
      cover_image_url: cover,
      ...(str(fd, "published_at")
        ? { published_at: str(fd, "published_at") as string }
        : {}),
    });
    if (error) return { ok: false, error: error.message };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "unexpected",
    };
  }
  revalidateAdmin("/admin", "/admin/news");
  return { ok: true };
}

export async function updateNews(
  id: string,
  fd: FormData,
): Promise<ActionResult> {
  const denied = await assertAdmin();
  if (denied) return { ok: false, error: denied };
  try {
    const cover = await uploadAdminImage(
      fd.get("cover") as File | null,
      "admin",
    );
    const update: Partial<NewsRow> = {
      title_en: str(fd, "title_en") ?? "",
      title_ur: str(fd, "title_ur"),
      body_en: str(fd, "body_en") ?? "",
      body_ur: str(fd, "body_ur"),
      category: str(fd, "category") ?? "general",
      is_pinned: bool(fd, "is_pinned"),
    };
    const publishedAt = str(fd, "published_at");
    if (publishedAt) update.published_at = publishedAt;
    if (cover) update.cover_image_url = cover;

    const supabase = await createClient();
    const { error } = await supabase
      .from("news_posts")
      .update(update)
      .eq("id", id);
    if (error) return { ok: false, error: error.message };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "unexpected",
    };
  }
  revalidateAdmin("/admin", "/admin/news");
  return { ok: true };
}

export async function deleteNews(id: string): Promise<ActionResult> {
  const denied = await assertAdmin();
  if (denied) return { ok: false, error: denied };
  const supabase = await createClient();
  const { error } = await supabase.from("news_posts").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidateAdmin("/admin", "/admin/news");
  return { ok: true };
}

/* ───────────────────────── Albums ───────────────────────── */

export async function createAlbum(fd: FormData): Promise<ActionResult> {
  const denied = await assertAdmin();
  if (denied) return { ok: false, error: denied };
  try {
    const cover = await uploadAdminImage(
      fd.get("cover") as File | null,
      "admin",
    );
    const supabase = await createClient();
    const { error } = await supabase.from("albums").insert({
      title_en: str(fd, "title_en") ?? "",
      title_ur: str(fd, "title_ur"),
      event_date:
        str(fd, "event_date") ??
        new Date().toISOString().slice(0, 10),
      description_en: str(fd, "description_en"),
      description_ur: str(fd, "description_ur"),
      cover_image_url: cover,
    });
    if (error) return { ok: false, error: error.message };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "unexpected",
    };
  }
  revalidateAdmin("/admin", "/admin/albums");
  return { ok: true };
}

export async function updateAlbum(
  id: string,
  fd: FormData,
): Promise<ActionResult> {
  const denied = await assertAdmin();
  if (denied) return { ok: false, error: denied };
  try {
    const cover = await uploadAdminImage(
      fd.get("cover") as File | null,
      "admin",
    );
    const update: Partial<AlbumRow> = {
      title_en: str(fd, "title_en") ?? "",
      title_ur: str(fd, "title_ur"),
      event_date:
        str(fd, "event_date") ??
        new Date().toISOString().slice(0, 10),
      description_en: str(fd, "description_en"),
      description_ur: str(fd, "description_ur"),
    };
    if (cover) update.cover_image_url = cover;

    const supabase = await createClient();
    const { error } = await supabase
      .from("albums")
      .update(update)
      .eq("id", id);
    if (error) return { ok: false, error: error.message };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "unexpected",
    };
  }
  revalidateAdmin("/admin", "/admin/albums");
  return { ok: true };
}

export async function deleteAlbum(id: string): Promise<ActionResult> {
  const denied = await assertAdmin();
  if (denied) return { ok: false, error: denied };
  const supabase = await createClient();
  // Photos cascade in DB; delete album row.
  const { error } = await supabase.from("albums").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidateAdmin("/admin", "/admin/albums");
  return { ok: true };
}

export async function addAlbumPhoto(
  albumId: string,
  fd: FormData,
): Promise<ActionResult> {
  const denied = await assertAdmin();
  if (denied) return { ok: false, error: denied };
  try {
    const files = fd.getAll("photos").filter((f): f is File => f instanceof File);
    if (files.length === 0) return { ok: false, error: "no_files" };

    const supabase = await createClient();
    const { data: maxRow } = await supabase
      .from("album_photos")
      .select("display_order")
      .eq("album_id", albumId)
      .order("display_order", { ascending: false })
      .limit(1)
      .maybeSingle();
    let order = (maxRow?.display_order ?? 0) + 1;

    const captionEn = str(fd, "caption_en");
    const captionUr = str(fd, "caption_ur");

    for (const file of files) {
      if (file.size === 0) continue;
      const path = await uploadAdminImage(file, "admin");
      if (!path) continue;
      const { error } = await supabase.from("album_photos").insert({
        album_id: albumId,
        image_url: path,
        caption_en: captionEn,
        caption_ur: captionUr,
        display_order: order,
      });
      if (error) return { ok: false, error: error.message };
      order += 1;
    }
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "unexpected",
    };
  }
  revalidateAdmin("/admin", "/admin/albums");
  return { ok: true };
}

export async function updateAlbumPhoto(
  photoId: string,
  fd: FormData,
): Promise<ActionResult> {
  const denied = await assertAdmin();
  if (denied) return { ok: false, error: denied };
  const supabase = await createClient();
  const { error } = await supabase
    .from("album_photos")
    .update({
      caption_en: str(fd, "caption_en"),
      caption_ur: str(fd, "caption_ur"),
      display_order: num(fd, "display_order") ?? 0,
    })
    .eq("id", photoId);
  if (error) return { ok: false, error: error.message };
  revalidateAdmin("/admin", "/admin/albums");
  return { ok: true };
}

export async function deleteAlbumPhoto(
  photoId: string,
): Promise<ActionResult> {
  const denied = await assertAdmin();
  if (denied) return { ok: false, error: denied };
  const supabase = await createClient();
  const { error } = await supabase
    .from("album_photos")
    .delete()
    .eq("id", photoId);
  if (error) return { ok: false, error: error.message };
  revalidateAdmin("/admin", "/admin/albums");
  return { ok: true };
}

/* ───────────────────────── Reports ───────────────────────── */

export interface ExportRow {
  full_name_en: string;
  father_name_en: string;
  profession: string;
  current_city: string | null;
  status: ProfileStatus;
}

export async function exportMembers(): Promise<
  { ok: true; rows: ExportRow[] } | { ok: false; error: string }
> {
  const denied = await assertAdmin();
  if (denied) return { ok: false, error: denied };
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("profiles")
    .select("full_name_en, father_name_en, profession, current_city, status")
    .order("full_name_en");
  if (error) return { ok: false, error: error.message };
  return { ok: true, rows: (data ?? []) as ExportRow[] };
}
