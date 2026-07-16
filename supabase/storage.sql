-- =====================================================================
-- LaoHUB — Supabase Storage buckets and policies
-- Run after schema.sql. Buckets are public-read (avatars/covers/posts are
-- meant to be visible to anyone), but only the owning user (matched by the
-- first path segment, which the app sets to their user id) can upload,
-- update, or delete their own files.
-- =====================================================================

insert into storage.buckets (id, name, public)
values
  ('avatars', 'avatars', true),
  ('covers', 'covers', true),
  ('posts', 'posts', true)
on conflict (id) do nothing;

-- Public read access for all three buckets
drop policy if exists "Public read access for avatars" on storage.objects;
create policy "Public read access for avatars"
  on storage.objects for select
  using (bucket_id = 'avatars');

drop policy if exists "Public read access for covers" on storage.objects;
create policy "Public read access for covers"
  on storage.objects for select
  using (bucket_id = 'covers');

drop policy if exists "Public read access for posts" on storage.objects;
create policy "Public read access for posts"
  on storage.objects for select
  using (bucket_id = 'posts');

-- Owner-only write access. The app uploads to `${userId}/${uuid}.${ext}`,
-- so the first path segment (storage.foldername(name)[1]) must equal the
-- authenticated user's id.
drop policy if exists "Users can upload their own avatar" on storage.objects;
create policy "Users can upload their own avatar"
  on storage.objects for insert
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Users can update their own avatar" on storage.objects;
create policy "Users can update their own avatar"
  on storage.objects for update
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Users can delete their own avatar" on storage.objects;
create policy "Users can delete their own avatar"
  on storage.objects for delete
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Users can upload their own cover" on storage.objects;
create policy "Users can upload their own cover"
  on storage.objects for insert
  with check (bucket_id = 'covers' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Users can update their own cover" on storage.objects;
create policy "Users can update their own cover"
  on storage.objects for update
  using (bucket_id = 'covers' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Users can delete their own cover" on storage.objects;
create policy "Users can delete their own cover"
  on storage.objects for delete
  using (bucket_id = 'covers' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Users can upload their own posts" on storage.objects;
create policy "Users can upload their own posts"
  on storage.objects for insert
  with check (bucket_id = 'posts' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Users can update their own post images" on storage.objects;
create policy "Users can update their own post images"
  on storage.objects for update
  using (bucket_id = 'posts' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Users can delete their own post images" on storage.objects;
create policy "Users can delete their own post images"
  on storage.objects for delete
  using (bucket_id = 'posts' and (storage.foldername(name))[1] = auth.uid()::text);
