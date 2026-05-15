-- ════════════════════════════════════════════════════════════════════════
-- 0004_functions.sql : admin RPCs + public stats + family-tree feed
-- ════════════════════════════════════════════════════════════════════════

-- Approve a pending profile (admin only).
create or replace function public.approve_profile(p_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'not authorized'; end if;
  update public.profiles
     set status = 'approved', approved_at = now(), approved_by = auth.uid(),
         rejection_reason = null
   where id = p_id;
end $$;

-- Reject a pending profile with a reason (admin only).
create or replace function public.reject_profile(p_id uuid, reason text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'not authorized'; end if;
  update public.profiles
     set status = 'rejected', rejection_reason = reason,
         approved_at = null, approved_by = null
   where id = p_id;
end $$;

-- Toggle a profile between approved <-> disabled (admin only).
create or replace function public.set_profile_status(p_id uuid, p_status profile_status)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'not authorized'; end if;
  update public.profiles set status = p_status where id = p_id;
end $$;

-- Public directory statistics for the home page + admin reports.
create or replace function public.village_stats()
returns json language sql stable security definer set search_path = public as $$
  select json_build_object(
    'total_members', (select count(*) from public.profiles where status = 'approved'),
    'pending', (select count(*) from public.profiles where status = 'pending'),
    'deceased', (select count(*) from public.profiles where status = 'approved' and is_deceased),
    'news_count', (select count(*) from public.news_posts),
    'album_count', (select count(*) from public.albums),
    'by_profession', (
      select coalesce(json_object_agg(profession, c), '{}'::json)
      from (select profession, count(*) c from public.profiles
            where status = 'approved' group by profession) t
    ),
    'by_city', (
      select coalesce(json_agg(row_to_json(t)), '[]'::json)
      from (select current_city as city, count(*) c from public.profiles
            where status = 'approved' and current_city is not null
            group by current_city order by c desc limit 12) t
    )
  );
$$;
grant execute on function public.village_stats() to anon, authenticated;

-- Lightweight feed for the family tree (approved members only, no PII).
create or replace function public.family_tree_nodes()
returns table (
  id uuid, full_name_en text, full_name_ur text, honorific text,
  profession text, photo_url text, hide_photo boolean,
  is_deceased boolean, father_profile_id uuid
) language sql stable security definer set search_path = public as $$
  select id, full_name_en, full_name_ur, honorific, profession,
         photo_url, hide_photo, is_deceased, father_profile_id
  from public.profiles where status = 'approved';
$$;
grant execute on function public.family_tree_nodes() to anon, authenticated;

-- Autocomplete source for the "link to father" field on the public
-- registration form (returns minimal, non-private fields only).
create or replace function public.search_potential_fathers(q text)
returns table (id uuid, label text) language sql stable
security definer set search_path = public as $$
  select id,
         coalesce(nullif(trim(coalesce(honorific,'') || ' ' || full_name_en), ''), full_name_ur)
           || ' s/o ' || father_name_en as label
  from public.profiles
  where status = 'approved'
    and (full_name_en ilike '%' || q || '%' or full_name_ur ilike '%' || q || '%')
  order by full_name_en
  limit 12;
$$;
grant execute on function public.search_potential_fathers(text) to anon, authenticated;
