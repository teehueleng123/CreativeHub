-- Phase 1: Private Supabase Storage Bucket & Policies
-- Run this in Supabase SQL Editor after 002_rls_policies.sql.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'creative-assets',
  'creative-assets',
  false,
  52428800, -- 50 MB free-tier cap
  array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/svg+xml',
    'video/mp4',
    'video/webm',
    'video/quicktime',
    'audio/mpeg',
    'audio/wav',
    'application/pdf'
  ]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Users may only read, upload, update, and delete objects inside their own top-level folder: {auth.uid()}/...
drop policy if exists "storage_select_own" on storage.objects;
create policy "storage_select_own" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'creative-assets'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "storage_insert_own" on storage.objects;
create policy "storage_insert_own" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'creative-assets'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "storage_update_own" on storage.objects;
create policy "storage_update_own" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'creative-assets'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'creative-assets'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "storage_delete_own" on storage.objects;
create policy "storage_delete_own" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'creative-assets'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
