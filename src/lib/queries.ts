import "server-only";

import { createClient } from "@/lib/supabase/server";
import type {
  PublicProfile,
  NewsRow,
  AlbumRow,
  AlbumPhotoRow,
  VillageStats,
} from "@/lib/database.types";
import { PAGE_SIZE } from "@/lib/constants";

export interface DirectoryFilters {
  q?: string;
  profession?: string;
  city?: string;
  houseArea?: string;
  qualificationLevel?: string;
  page?: number;
}

/** Privacy-safe directory query against the public_profiles view. */
export async function getDirectory(filters: DirectoryFilters) {
  const supabase = await createClient();
  const page = Math.max(1, filters.page ?? 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let query = supabase
    .from("public_profiles")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false });

  if (filters.q?.trim()) {
    const q = filters.q.trim().replace(/[%,]/g, "");
    query = query.ilike("full_name_en", `%${q}%`);
  }
  if (filters.profession) query = query.eq("profession", filters.profession);
  if (filters.city) query = query.eq("current_city", filters.city);
  if (filters.houseArea) query = query.eq("house_area", filters.houseArea);
  if (filters.qualificationLevel)
    query = query.eq("qualification_level", filters.qualificationLevel);

  const { data, count, error } = await query.range(from, to);
  if (error) throw error;

  return {
    profiles: (data ?? []) as PublicProfile[],
    total: count ?? 0,
    page,
    pageSize: PAGE_SIZE,
    hasMore: (count ?? 0) > to + 1,
  };
}

export async function getProfileById(
  id: string,
): Promise<PublicProfile | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("public_profiles")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return (data as PublicProfile) ?? null;
}

/** Direct children (by father_profile_id) of a profile, for the profile page. */
export async function getChildren(id: string): Promise<PublicProfile[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("public_profiles")
    .select("*")
    .eq("father_profile_id", id)
    .order("full_name_en");
  return (data as PublicProfile[]) ?? [];
}

/** Recently approved members for the home page. */
export async function getRecentMembers(limit = 8): Promise<PublicProfile[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("public_profiles")
    .select("*")
    .order("approved_at", { ascending: false, nullsFirst: false })
    .limit(limit);
  return (data as PublicProfile[]) ?? [];
}

/** Members with a map pin. */
export async function getMappedProfiles(): Promise<PublicProfile[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("public_profiles")
    .select("*")
    .not("latitude", "is", null)
    .not("longitude", "is", null);
  return (data as PublicProfile[]) ?? [];
}

export async function getFamilyTreeNodes() {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("family_tree_nodes");
  if (error) throw error;
  return data ?? [];
}

export async function getStats(): Promise<VillageStats | null> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("village_stats");
  return (data as VillageStats) ?? null;
}

export async function getNews(opts?: {
  limit?: number;
  category?: string;
}): Promise<NewsRow[]> {
  const supabase = await createClient();
  let query = supabase
    .from("news_posts")
    .select("*")
    .order("is_pinned", { ascending: false })
    .order("published_at", { ascending: false });
  if (opts?.category) query = query.eq("category", opts.category);
  if (opts?.limit) query = query.limit(opts.limit);
  const { data } = await query;
  return (data as NewsRow[]) ?? [];
}

export async function getNewsPost(id: string): Promise<NewsRow | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("news_posts")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return (data as NewsRow) ?? null;
}

export async function getAlbums(): Promise<AlbumRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("albums")
    .select("*")
    .order("event_date", { ascending: false });
  return (data as AlbumRow[]) ?? [];
}

export async function getAlbum(
  id: string,
): Promise<{ album: AlbumRow; photos: AlbumPhotoRow[] } | null> {
  const supabase = await createClient();
  const { data: album } = await supabase
    .from("albums")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!album) return null;
  const { data: photos } = await supabase
    .from("album_photos")
    .select("*")
    .eq("album_id", id)
    .order("display_order");
  return { album: album as AlbumRow, photos: (photos as AlbumPhotoRow[]) ?? [] };
}

/** Distinct filter values for the directory dropdowns. */
export async function getDirectoryFacets() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("public_profiles")
    .select("current_city, house_area");
  const cities = new Set<string>();
  const areas = new Set<string>();
  for (const r of data ?? []) {
    if (r.current_city) cities.add(r.current_city);
    if (r.house_area) areas.add(r.house_area);
  }
  return {
    cities: [...cities].sort(),
    houseAreas: [...areas].sort(),
  };
}
