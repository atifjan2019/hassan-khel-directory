-- ════════════════════════════════════════════════════════════════════════
-- Hassan Khel Village Directory — schema
-- 0001_init.sql : extensions, enums, tables, indexes, triggers
-- ════════════════════════════════════════════════════════════════════════

create extension if not exists "pgcrypto";
create extension if not exists "pg_trgm";   -- fast name search (EN + UR)

-- ── Enums ───────────────────────────────────────────────────────────────
do $$ begin
  create type profile_status as enum ('pending','approved','rejected','disabled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type admin_role as enum ('super_admin','moderator');
exception when duplicate_object then null; end $$;

-- ── profiles ────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid references auth.users (id) on delete set null,
  honorific           text,
  full_name_en        text not null,
  full_name_ur        text,
  father_name_en      text not null,
  father_name_ur      text,
  grandfather_name_en text,
  grandfather_name_ur text,
  date_of_birth       date,
  profession          text not null default 'other',
  qualification       text,
  qualification_level text default 'none',
  institute           text,
  current_city        text,
  phone               text,                 -- PRIVATE — never in public view
  email               text,                 -- PRIVATE — never in public view
  house_area          text,
  bio_en              text,
  bio_ur              text,
  photo_url           text,
  hide_photo          boolean not null default false,  -- women / privacy opt-out
  father_profile_id   uuid references public.profiles (id) on delete set null,
  latitude            numeric(9,6),
  longitude           numeric(9,6),
  status              profile_status not null default 'pending',
  is_deceased         boolean not null default false,
  rejection_reason    text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  approved_at         timestamptz,
  approved_by         uuid references auth.users (id) on delete set null,
  constraint chk_no_self_parent check (father_profile_id is null or father_profile_id <> id)
);

create index if not exists idx_profiles_status        on public.profiles (status);
create index if not exists idx_profiles_profession    on public.profiles (profession);
create index if not exists idx_profiles_city          on public.profiles (current_city);
create index if not exists idx_profiles_house_area    on public.profiles (house_area);
create index if not exists idx_profiles_father        on public.profiles (father_profile_id);
create index if not exists idx_profiles_user          on public.profiles (user_id);
create index if not exists idx_profiles_name_trgm_en  on public.profiles using gin (full_name_en gin_trgm_ops);
create index if not exists idx_profiles_name_trgm_ur  on public.profiles using gin (full_name_ur gin_trgm_ops);

-- ── news_posts ──────────────────────────────────────────────────────────
create table if not exists public.news_posts (
  id               uuid primary key default gen_random_uuid(),
  title_en         text not null,
  title_ur         text,
  body_en          text not null,
  body_ur          text,
  cover_image_url  text,
  category         text not null default 'general',
  is_pinned        boolean not null default false,
  published_at     timestamptz not null default now(),
  author_id        uuid references auth.users (id) on delete set null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index if not exists idx_news_published on public.news_posts (is_pinned desc, published_at desc);
create index if not exists idx_news_category  on public.news_posts (category);

-- ── albums ──────────────────────────────────────────────────────────────
create table if not exists public.albums (
  id               uuid primary key default gen_random_uuid(),
  title_en         text not null,
  title_ur         text,
  event_date       date not null,
  cover_image_url  text,
  description_en   text,
  description_ur   text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index if not exists idx_albums_date on public.albums (event_date desc);

-- ── album_photos ────────────────────────────────────────────────────────
create table if not exists public.album_photos (
  id            uuid primary key default gen_random_uuid(),
  album_id      uuid not null references public.albums (id) on delete cascade,
  image_url     text not null,
  caption_en    text,
  caption_ur    text,
  display_order int not null default 0,
  created_at    timestamptz not null default now()
);
create index if not exists idx_album_photos_album on public.album_photos (album_id, display_order);

-- ── admin_users ─────────────────────────────────────────────────────────
create table if not exists public.admin_users (
  user_id   uuid primary key references auth.users (id) on delete cascade,
  role      admin_role not null default 'moderator',
  added_at  timestamptz not null default now()
);

-- ── updated_at trigger ──────────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists trg_profiles_updated   on public.profiles;
drop trigger if exists trg_news_updated        on public.news_posts;
drop trigger if exists trg_albums_updated       on public.albums;

create trigger trg_profiles_updated before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger trg_news_updated before update on public.news_posts
  for each row execute function public.set_updated_at();
create trigger trg_albums_updated before update on public.albums
  for each row execute function public.set_updated_at();

-- ── is_admin() helper (SECURITY DEFINER avoids recursive RLS) ────────────
create or replace function public.is_admin(uid uuid default auth.uid())
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admin_users a where a.user_id = uid);
$$;
revoke all on function public.is_admin(uuid) from public;
grant execute on function public.is_admin(uuid) to anon, authenticated;
