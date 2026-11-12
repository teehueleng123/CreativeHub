-- Phase 1: CreativeHub Initial PostgreSQL Schema
-- Run this in Supabase SQL Editor first.

-- 1. Custom enum types
do $$
begin
  if not exists (select 1 from pg_type where typname = 'resource_kind') then
    create type public.resource_kind as enum ('file', 'external_url');
  end if;
  if not exists (select 1 from pg_type where typname = 'share_permission') then
    create type public.share_permission as enum ('view', 'download');
  end if;
end $$;

-- 2. Profiles (lightweight extension of auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3. Categories (system defaults have user_id = NULL; users may add custom ones)
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) > 0),
  slug text not null check (char_length(trim(slug)) > 0),
  color text not null default '#6366F1',
  icon text not null default 'folder',
  is_default boolean not null default false,
  sort_order integer not null default 100,
  created_at timestamptz not null default now()
);

create unique index if not exists categories_user_slug_uidx
  on public.categories (coalesce(user_id, '00000000-0000-0000-0000-000000000000'::uuid), lower(slug));

-- 4. Resources (uploaded files & external resource URLs)
create table if not exists public.resources (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category_id uuid references public.categories(id) on delete set null,
  resource_kind public.resource_kind not null,
  title text not null check (char_length(trim(title)) > 0),
  description text,
  personal_notes text,
  storage_path text,
  thumbnail_path text,
  file_name text,
  mime_type text,
  -- Enforce 50 MB Supabase free-tier single-file limit (52,428,800 bytes)
  file_size_bytes bigint check (file_size_bytes is null or (file_size_bytes >= 0 and file_size_bytes <= 52428800)),
  file_extension text,
  external_url text,
  license_info text,
  dominant_color text,
  is_favorite boolean not null default false,
  last_accessed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint resources_kind_fields_check check (
    (resource_kind = 'file' and storage_path is not null)
    or (resource_kind = 'external_url' and external_url is not null)
  )
);

create index if not exists resources_user_created_idx on public.resources (user_id, created_at desc);
create index if not exists resources_user_category_idx on public.resources (user_id, category_id);
create index if not exists resources_user_favorite_idx on public.resources (user_id, is_favorite);

-- 5. Tags & Resource-Tags
create table if not exists public.tags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) > 0),
  color text not null default '#64748B',
  created_at timestamptz not null default now()
);

create unique index if not exists tags_user_name_uidx on public.tags (user_id, lower(name));

create table if not exists public.resource_tags (
  resource_id uuid not null references public.resources(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete cascade,
  primary key (resource_id, tag_id)
);

-- 6. Collections & Collection-Items
create table if not exists public.collections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) > 0),
  description text,
  cover_color text not null default '#EC4899',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.collection_items (
  collection_id uuid not null references public.collections(id) on delete cascade,
  resource_id uuid not null references public.resources(id) on delete cascade,
  added_at timestamptz not null default now(),
  primary key (collection_id, resource_id)
);

-- 7. Share Links
create table if not exists public.share_links (
  id uuid primary key default gen_random_uuid(),
  resource_id uuid not null references public.resources(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  token text not null unique,
  permission public.share_permission not null default 'view',
  expires_at timestamptz,
  revoked_at timestamptz,
  access_count integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists share_links_resource_idx on public.share_links (resource_id);

-- 8. Triggers: updated_at + automatic profile creation
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists resources_set_updated_at on public.resources;
create trigger resources_set_updated_at
  before update on public.resources
  for each row execute function public.set_updated_at();

drop trigger if exists collections_set_updated_at on public.collections;
create trigger collections_set_updated_at
  before update on public.collections
  for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, split_part(coalesce(new.email, 'Creator'), '@', 1))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 9. Seed default categories
insert into public.categories (user_id, name, slug, color, icon, is_default, sort_order)
values
  (null, 'Images', 'images', '#FF6B6B', 'image', true, 1),
  (null, 'Video Clips', 'video-clips', '#3B82F6', 'film', true, 2),
  (null, 'Background Videos', 'background-videos', '#6366F1', 'video', true, 3),
  (null, 'Visual Effects', 'visual-effects', '#A855F7', 'sparkles', true, 4),
  (null, 'Textures', 'textures', '#F59E0B', 'layers', true, 5),
  (null, 'Transitions and Motion Graphics', 'transitions-motion-graphics', '#10B981', 'wand-2', true, 6)
on conflict do nothing;
