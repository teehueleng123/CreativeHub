import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';

/**
 * Fetches categories, resources (with attached tags & collection memberships),
 * tags, collections, and user profile in parallel.
 */
const FALLBACK_CATEGORIES = [
  { id: 'cat-images', name: 'Images', slug: 'images', color: '#f43f5e', icon: 'image' },
  { id: 'cat-videos', name: 'Video Clips', slug: 'video-clips', color: '#38bdf8', icon: 'film' },
  { id: 'cat-bg-videos', name: 'Background Videos', slug: 'background-videos', color: '#818cf8', icon: 'video' },
  { id: 'cat-vfx', name: 'Visual Effects', slug: 'visual-effects', color: '#c084fc', icon: 'sparkles' },
  { id: 'cat-textures', name: 'Textures', slug: 'textures', color: '#fbbf24', icon: 'layers' },
  { id: 'cat-audio', name: 'Audio & Music', slug: 'audio', color: '#34d399', icon: 'music' },
];

const FALLBACK_RESOURCES = [
  { id: 'sample-1', title: 'Atmospheric Celestial Nebula', category_id: 'cat-videos', resource_kind: 'file', mime_type: 'video/mp4', created_at: new Date().toISOString() },
  { id: 'sample-2', title: 'Minimalist Stardust Horizon', category_id: 'cat-images', resource_kind: 'file', mime_type: 'image/jpeg', created_at: new Date().toISOString() },
  { id: 'sample-3', title: 'Obsidian Ring Reflection', category_id: 'cat-images', resource_kind: 'file', mime_type: 'image/jpeg', created_at: new Date().toISOString() },
  { id: 'sample-4', title: 'Deep Space Cosmic Stream', category_id: 'cat-vfx', resource_kind: 'file', mime_type: 'video/mp4', created_at: new Date().toISOString() },
  { id: 'sample-5', title: 'Ethereal Cloud Shimmer', category_id: 'cat-textures', resource_kind: 'file', mime_type: 'image/jpeg', created_at: new Date().toISOString() },
];

export function useLibraryOverview() {
  const { user } = useAuth();
  const [categories, setCategories] = useState([]);
  const [resources, setResources] = useState([]);
  const [tags, setTags] = useState([]);
  const [collections, setCollections] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    if (!user || !supabase) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const [catRes, resRes, tagRes, colRes, profRes] = await Promise.all([
        supabase.from('categories').select('*').order('sort_order', { ascending: true }),
        supabase
          .from('resources')
          .select(
            '*, categories(id, name, slug, color, icon), resource_tags(tags(id, name, color)), collection_items(collection_id)'
          )
          .order('created_at', { ascending: false }),
        supabase.from('tags').select('*').order('name', { ascending: true }),
        supabase
          .from('collections')
          .select('*, collection_items(resource_id)')
          .order('created_at', { ascending: false }),
        supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
      ]);

      const loadedCategories = catRes.data && catRes.data.length > 0 ? catRes.data : FALLBACK_CATEGORIES;
      const rawResources = resRes.data && resRes.data.length > 0 ? resRes.data : FALLBACK_RESOURCES;

      const normalizedResources = rawResources.map((item) => ({
        ...item,
        tags: (item.resource_tags ?? []).map((rt) => rt.tags).filter(Boolean),
        collectionIds: (item.collection_items ?? []).map((ci) => ci.collection_id),
      }));

      const normalizedCollections = (colRes?.data ?? []).map((col) => ({
        ...col,
        resourceIds: (col.collection_items ?? []).map((ci) => ci.resource_id),
      }));

      setCategories(loadedCategories);
      setResources(normalizedResources);
      setTags(tagRes?.data ?? []);
      setCollections(normalizedCollections);
      setProfile(profRes?.data ?? { display_name: 'Studio Explorer' });
    } catch {
      setCategories(FALLBACK_CATEGORIES);
      setResources(FALLBACK_RESOURCES);
      setProfile({ display_name: 'Studio Explorer' });
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    categories,
    resources,
    tags,
    collections,
    profile,
    loading,
    error,
    refresh,
  };
}
