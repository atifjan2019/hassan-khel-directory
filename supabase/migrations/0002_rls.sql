-- ════════════════════════════════════════════════════════════════════════
-- 0002_rls.sql : Row Level Security + privacy-safe public view
-- ════════════════════════════════════════════════════════════════════════

alter table public.profiles      enable row level security;
alter table public.news_posts    enable row level security;
alter table public.albums        enable row level security;
alter table public.album_photos  enable row level security;
alter table public.admin_users   enable row level security;

-- ── PROFILES ────────────────────────────────────────────────────────────
-- Base table is NOT publicly readable (it holds phone + email). The public
-- reads the `public_profiles` view instead. Direct SELECT on the table is
-- limited to the owning user and admins.

drop policy if exists profiles_select_self_or_admin on public.profiles;
create policy profiles_select_self_or_admin on public.profiles
  for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

-- Anyone (even anonymous) may submit a registration. A guard trigger forces
-- status -> 'pending' and strips moderation columns so this cannot be abused
-- to self-approve.
drop policy if exists profiles_insert_anyone on public.profiles;
create policy profiles_insert_anyone on public.profiles
  for insert to anon, authenticated
  with check (true);

-- Owners edit their own profile; admins edit anyone.
drop policy if exists profiles_update_owner_or_admin on public.profiles;
create policy profiles_update_owner_or_admin on public.profiles
  for update to authenticated
  using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

drop policy if exists profiles_delete_admin on public.profiles;
create policy profiles_delete_admin on public.profiles
  for delete to authenticated
  using (public.is_admin());

-- Anti-privilege-escalation guard. Non-admins can never set moderation
-- fields; new public submissions are always 'pending'.
create or replace function public.guard_profile_write()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  -- Treat the Supabase service role (seed script / trusted server actions
  -- using the service key) as privileged, alongside real admin users.
  admin boolean := public.is_admin()
    or coalesce(current_setting('role', true), '') = 'service_role'
    or session_user in ('postgres', 'supabase_admin', 'service_role');
begin
  if tg_op = 'INSERT' then
    if not admin then
      new.status        := 'pending';
      new.approved_at    := null;
      new.approved_by    := null;
      new.rejection_reason := null;
    end if;
  elsif tg_op = 'UPDATE' then
    if not admin then
      new.status         := old.status;
      new.approved_at     := old.approved_at;
      new.approved_by      := old.approved_by;
      new.rejection_reason := old.rejection_reason;
      new.user_id          := old.user_id;
    end if;
  end if;
  return new;
end $$;

drop trigger if exists trg_guard_profile_write on public.profiles;
create trigger trg_guard_profile_write
  before insert or update on public.profiles
  for each row execute function public.guard_profile_write();

-- Privacy-safe public view: only approved rows, NO phone / email columns.
-- Default (non-security_invoker) view → owned by migration role, so the
-- public reaches only this curated subset, never the base table.
drop view if exists public.public_profiles;
create view public.public_profiles
with (security_invoker = false) as
  select
    id, honorific,
    full_name_en, full_name_ur,
    father_name_en, father_name_ur,
    grandfather_name_en, grandfather_name_ur,
    date_of_birth, profession, qualification, qualification_level,
    institute, current_city, house_area,
    bio_en, bio_ur, photo_url, hide_photo,
    father_profile_id, latitude, longitude,
    is_deceased, created_at, approved_at
  from public.profiles
  where status = 'approved';

grant select on public.public_profiles to anon, authenticated;
revoke all on public.profiles from anon;   -- belt & braces: no anon table access

-- ── NEWS / ALBUMS / PHOTOS : public read, admin write ───────────────────
drop policy if exists news_public_read on public.news_posts;
create policy news_public_read on public.news_posts
  for select to anon, authenticated using (true);

drop policy if exists news_admin_write on public.news_posts;
create policy news_admin_write on public.news_posts
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists albums_public_read on public.albums;
create policy albums_public_read on public.albums
  for select to anon, authenticated using (true);

drop policy if exists albums_admin_write on public.albums;
create policy albums_admin_write on public.albums
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists album_photos_public_read on public.album_photos;
create policy album_photos_public_read on public.album_photos
  for select to anon, authenticated using (true);

drop policy if exists album_photos_admin_write on public.album_photos;
create policy album_photos_admin_write on public.album_photos
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ── ADMIN_USERS : readable by admins only, managed by super_admins ──────
drop policy if exists admin_users_select on public.admin_users;
create policy admin_users_select on public.admin_users
  for select to authenticated using (public.is_admin());

drop policy if exists admin_users_manage on public.admin_users;
create policy admin_users_manage on public.admin_users
  for all to authenticated
  using (exists (select 1 from public.admin_users a
                 where a.user_id = auth.uid() and a.role = 'super_admin'))
  with check (exists (select 1 from public.admin_users a
                 where a.user_id = auth.uid() and a.role = 'super_admin'));
