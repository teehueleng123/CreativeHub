-- Phase 1: Row Level Security (RLS) Policies
-- Run this in Supabase SQL Editor after 001_initial_schema.sql.

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.resources enable row level security;
alter table public.tags enable row level security;
alter table public.resource_tags enable row level security;
alter table public.collections enable row level security;
alter table public.collection_items enable row level security;
alter table public.share_links enable row level security;

-- Profiles: users can view, insert, and update only their own profile
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- Categories: everyone authenticated sees default categories; users manage only their own custom categories
drop policy if exists "categories_select_visible" on public.categories;
create policy "categories_select_visible" on public.categories
  for select using (auth.uid() is not null and (user_id is null or auth.uid() = user_id));

drop policy if exists "categories_insert_own" on public.categories;
create policy "categories_insert_own" on public.categories
  for insert with check (auth.uid() = user_id and is_default = false);

drop policy if exists "categories_update_own" on public.categories;
create policy "categories_update_own" on public.categories
  for update using (auth.uid() = user_id and is_default = false)
  with check (auth.uid() = user_id and is_default = false);

drop policy if exists "categories_delete_own" on public.categories;
create policy "categories_delete_own" on public.categories
  for delete using (auth.uid() = user_id and is_default = false);

-- Resources: strict owner-only access
drop policy if exists "resources_select_own" on public.resources;
create policy "resources_select_own" on public.resources
  for select using (auth.uid() = user_id);

drop policy if exists "resources_insert_own" on public.resources;
create policy "resources_insert_own" on public.resources
  for insert with check (auth.uid() = user_id);

drop policy if exists "resources_update_own" on public.resources;
create policy "resources_update_own" on public.resources
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "resources_delete_own" on public.resources;
create policy "resources_delete_own" on public.resources
  for delete using (auth.uid() = user_id);

-- Tags: strict owner-only access
drop policy if exists "tags_select_own" on public.tags;
create policy "tags_select_own" on public.tags
  for select using (auth.uid() = user_id);

drop policy if exists "tags_insert_own" on public.tags;
create policy "tags_insert_own" on public.tags
  for insert with check (auth.uid() = user_id);

drop policy if exists "tags_update_own" on public.tags;
create policy "tags_update_own" on public.tags
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "tags_delete_own" on public.tags;
create policy "tags_delete_own" on public.tags
  for delete using (auth.uid() = user_id);

-- Resource-Tags: user must own both the resource and the tag
drop policy if exists "resource_tags_select_own" on public.resource_tags;
create policy "resource_tags_select_own" on public.resource_tags
  for select using (
    exists (
      select 1 from public.resources r
      where r.id = resource_id and r.user_id = auth.uid()
    )
  );

drop policy if exists "resource_tags_insert_own" on public.resource_tags;
create policy "resource_tags_insert_own" on public.resource_tags
  for insert with check (
    exists (select 1 from public.resources r where r.id = resource_id and r.user_id = auth.uid())
    and exists (select 1 from public.tags t where t.id = tag_id and t.user_id = auth.uid())
  );

drop policy if exists "resource_tags_delete_own" on public.resource_tags;
create policy "resource_tags_delete_own" on public.resource_tags
  for delete using (
    exists (select 1 from public.resources r where r.id = resource_id and r.user_id = auth.uid())
  );

-- Collections: strict owner-only access
drop policy if exists "collections_select_own" on public.collections;
create policy "collections_select_own" on public.collections
  for select using (auth.uid() = user_id);

drop policy if exists "collections_insert_own" on public.collections;
create policy "collections_insert_own" on public.collections
  for insert with check (auth.uid() = user_id);

drop policy if exists "collections_update_own" on public.collections;
create policy "collections_update_own" on public.collections
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "collections_delete_own" on public.collections;
create policy "collections_delete_own" on public.collections
  for delete using (auth.uid() = user_id);

-- Collection-Items: user must own both the collection and the resource
drop policy if exists "collection_items_select_own" on public.collection_items;
create policy "collection_items_select_own" on public.collection_items
  for select using (
    exists (select 1 from public.collections c where c.id = collection_id and c.user_id = auth.uid())
  );

drop policy if exists "collection_items_insert_own" on public.collection_items;
create policy "collection_items_insert_own" on public.collection_items
  for insert with check (
    exists (select 1 from public.collections c where c.id = collection_id and c.user_id = auth.uid())
    and exists (select 1 from public.resources r where r.id = resource_id and r.user_id = auth.uid())
  );

drop policy if exists "collection_items_delete_own" on public.collection_items;
create policy "collection_items_delete_own" on public.collection_items
  for delete using (
    exists (select 1 from public.collections c where c.id = collection_id and c.user_id = auth.uid())
  );

-- Share Links: owner-only access (public resolution happens via Edge Function in Phase 5)
drop policy if exists "share_links_select_own" on public.share_links;
create policy "share_links_select_own" on public.share_links
  for select using (auth.uid() = user_id);

drop policy if exists "share_links_insert_own" on public.share_links;
create policy "share_links_insert_own" on public.share_links
  for insert with check (
    auth.uid() = user_id
    and exists (select 1 from public.resources r where r.id = resource_id and r.user_id = auth.uid())
  );

drop policy if exists "share_links_update_own" on public.share_links;
create policy "share_links_update_own" on public.share_links
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "share_links_delete_own" on public.share_links;
create policy "share_links_delete_own" on public.share_links
  for delete using (auth.uid() = user_id);
