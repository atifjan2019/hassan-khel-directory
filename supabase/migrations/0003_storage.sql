-- ════════════════════════════════════════════════════════════════════════
-- 0003_storage.sql : public media bucket + policies
-- ════════════════════════════════════════════════════════════════════════

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'village-media', 'village-media', true,
  5242880,  -- 5 MB cap (rural bandwidth friendly)
  array['image/jpeg','image/png','image/webp','image/avif']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Public read for all media.
drop policy if exists "village_media_public_read" on storage.objects;
create policy "village_media_public_read" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'village-media');

-- Anyone may upload into the `registrations/` prefix (needed before a
-- profile is approved / before the submitter has an account).
drop policy if exists "village_media_registration_upload" on storage.objects;
create policy "village_media_registration_upload" on storage.objects
  for insert to anon, authenticated
  with check (
    bucket_id = 'village-media'
    and (storage.foldername(name))[1] = 'registrations'
  );

-- Authenticated users manage their own uploads under `users/<uid>/`.
drop policy if exists "village_media_user_rw" on storage.objects;
create policy "village_media_user_rw" on storage.objects
  for all to authenticated
  using (
    bucket_id = 'village-media'
    and (storage.foldername(name))[1] = 'users'
    and (storage.foldername(name))[2] = auth.uid()::text
  )
  with check (
    bucket_id = 'village-media'
    and (storage.foldername(name))[1] = 'users'
    and (storage.foldername(name))[2] = auth.uid()::text
  );

-- Admins manage everything (news / album media etc.).
drop policy if exists "village_media_admin_rw" on storage.objects;
create policy "village_media_admin_rw" on storage.objects
  for all to authenticated
  using (bucket_id = 'village-media' and public.is_admin())
  with check (bucket_id = 'village-media' and public.is_admin());
