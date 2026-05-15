/**
 * Hand-authored Supabase schema types (mirrors supabase/migrations/*).
 * Regenerate with `supabase gen types typescript` if the schema changes.
 */

export type ProfileStatus = "pending" | "approved" | "rejected" | "disabled";
export type AdminRole = "super_admin" | "moderator";

export type ProfileRow = {
  id: string;
  user_id: string | null;
  honorific: string | null;
  full_name_en: string;
  father_name_en: string;
  grandfather_name_en: string | null;
  date_of_birth: string | null;
  profession: string;
  qualification: string | null;
  qualification_level: string | null;
  institute: string | null;
  current_city: string | null;
  phone: string | null;
  email: string | null;
  house_area: string | null;
  bio_en: string | null;
  photo_url: string | null;
  hide_photo: boolean;
  father_profile_id: string | null;
  latitude: number | null;
  longitude: number | null;
  status: ProfileStatus;
  is_deceased: boolean;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
  approved_at: string | null;
  approved_by: string | null;
}

/** Public, privacy-safe subset (no phone / email). Mirrors public_profiles. */
export type PublicProfile = Omit<
  ProfileRow,
  | "user_id"
  | "phone"
  | "email"
  | "status"
  | "rejection_reason"
  | "updated_at"
  | "approved_by"
>;

export type NewsRow = {
  id: string;
  title_en: string;
  body_en: string;
  cover_image_url: string | null;
  category: string;
  is_pinned: boolean;
  published_at: string;
  author_id: string | null;
  created_at: string;
  updated_at: string;
}

export type AlbumRow = {
  id: string;
  title_en: string;
  event_date: string;
  cover_image_url: string | null;
  description_en: string | null;
  created_at: string;
  updated_at: string;
}

export type AlbumPhotoRow = {
  id: string;
  album_id: string;
  image_url: string;
  caption_en: string | null;
  display_order: number;
  created_at: string;
}

export type AdminUserRow = {
  user_id: string;
  role: AdminRole;
  added_at: string;
}

export type VillageStats = {
  total_members: number;
  pending: number;
  deceased: number;
  news_count: number;
  album_count: number;
  by_profession: Record<string, number>;
  by_city: { city: string; c: number }[];
}

/** Keys whose value type admits null — these map to nullable DB columns. */
type NullableKeys<T> = {
  [K in keyof T]-?: null extends T[K] ? K : never;
}[keyof T];

/**
 * An Insert payload: DB-generated/defaulted columns (`Auto`) and every
 * nullable column are optional; only NOT-NULL columns without a default
 * remain required.
 */
type Insert<T, Auto extends keyof T> = Omit<T, Auto | NullableKeys<T>> &
  Partial<Pick<T, Extract<Auto | NullableKeys<T>, keyof T>>>;

/** supabase-js requires every table/view to carry a Relationships tuple. */
type Rel = [];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow;
        Insert: Insert<
          ProfileRow,
          | "id"
          | "user_id"
          | "created_at"
          | "updated_at"
          | "approved_at"
          | "approved_by"
          | "status"
          | "is_deceased"
          | "hide_photo"
          | "rejection_reason"
        >;
        Update: Partial<ProfileRow>;
        Relationships: Rel;
      };
      news_posts: {
        Row: NewsRow;
        Insert: Insert<NewsRow, "id" | "created_at" | "updated_at" | "published_at">;
        Update: Partial<NewsRow>;
        Relationships: Rel;
      };
      albums: {
        Row: AlbumRow;
        Insert: Insert<AlbumRow, "id" | "created_at" | "updated_at">;
        Update: Partial<AlbumRow>;
        Relationships: Rel;
      };
      album_photos: {
        Row: AlbumPhotoRow;
        Insert: Insert<AlbumPhotoRow, "id" | "created_at">;
        Update: Partial<AlbumPhotoRow>;
        Relationships: Rel;
      };
      admin_users: {
        Row: AdminUserRow;
        Insert: Insert<AdminUserRow, "added_at">;
        Update: Partial<AdminUserRow>;
        Relationships: Rel;
      };
    };
    Views: {
      public_profiles: { Row: PublicProfile; Relationships: Rel };
    };
    Functions: {
      is_admin: { Args: { uid?: string }; Returns: boolean };
      approve_profile: { Args: { p_id: string }; Returns: undefined };
      reject_profile: { Args: { p_id: string; reason: string }; Returns: undefined };
      set_profile_status: {
        Args: { p_id: string; p_status: ProfileStatus };
        Returns: undefined;
      };
      village_stats: { Args: Record<string, never>; Returns: VillageStats };
      family_tree_nodes: {
        Args: Record<string, never>;
        Returns: {
          id: string;
          full_name_en: string;
          honorific: string | null;
          profession: string;
          photo_url: string | null;
          hide_photo: boolean;
          is_deceased: boolean;
          father_profile_id: string | null;
        }[];
      };
      search_potential_fathers: {
        Args: { q: string };
        Returns: { id: string; label: string }[];
      };
    };
  };
}
