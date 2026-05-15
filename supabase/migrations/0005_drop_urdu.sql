-- ════════════════════════════════════════════════════════════════════════
-- 0005_drop_urdu.sql : English-only — permanently drop all Urdu (_ur) columns
--   and rebuild the dependent view + RPCs without them.
--   ⚠ IRREVERSIBLE: existing Urdu text in these columns is destroyed.
-- ════════════════════════════════════════════════════════════════════════

-- The public view depends on profiles._ur columns; drop it first.
drop view if exists public.public_profiles;

-- Urdu trigram search index.
drop index if exists public.idx_profiles_name_trgm_ur;

-- ── Drop the _ur columns ────────────────────────────────────────────────
alter table public.profiles
  drop column if exists full_name_ur,
  drop column if exists father_name_ur,
  drop column if exists grandfather_name_ur,
  drop column if exists bio_ur;

alter table public.news_posts
  drop column if exists title_ur,
  drop column if exists body_ur;

alter table public.albums
  drop column if exists title_ur,
  drop column if exists description_ur;

alter table public.album_photos
  drop column if exists caption_ur;

-- ── Recreate the privacy-safe public view (no _ur, no phone/email) ──────
create view public.public_profiles
with (security_invoker = false) as
  select
    id, honorific,
    full_name_en,
    father_name_en,
    grandfather_name_en,
    date_of_birth, profession, qualification, qualification_level,
    institute, current_city, house_area,
    bio_en, photo_url, hide_photo,
    father_profile_id, latitude, longitude,
    is_deceased, created_at, approved_at
  from public.profiles
  where status = 'approved';

grant select on public.public_profiles to anon, authenticated;
revoke all on public.profiles from anon;

-- ── Rebuild RPCs that referenced _ur ────────────────────────────────────
-- family_tree_nodes: return-table shape changes, so drop then recreate.
drop function if exists public.family_tree_nodes();
create function public.family_tree_nodes()
returns table (
  id uuid, full_name_en text, honorific text,
  profession text, photo_url text, hide_photo boolean,
  is_deceased boolean, father_profile_id uuid
) language sql stable security definer set search_path = public as $$
  select id, full_name_en, honorific, profession,
         photo_url, hide_photo, is_deceased, father_profile_id
  from public.profiles where status = 'approved';
$$;
grant execute on function public.family_tree_nodes() to anon, authenticated;

-- search_potential_fathers: signature unchanged, body no longer uses _ur.
create or replace function public.search_potential_fathers(q text)
returns table (id uuid, label text) language sql stable
security definer set search_path = public as $$
  select id,
         nullif(trim(coalesce(honorific,'') || ' ' || full_name_en), '')
           || ' s/o ' || father_name_en as label
  from public.profiles
  where status = 'approved'
    and full_name_en ilike '%' || q || '%'
  order by full_name_en
  limit 12;
$$;
grant execute on function public.search_potential_fathers(text) to anon, authenticated;
