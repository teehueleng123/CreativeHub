import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';

/**
 * Fetches categories, resources (with attached tags & collection memberships),
 * tags, collections, and user profile in parallel.
 */
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

      const firstError =
        catRes.error || resRes.error || tagRes.error || colRes.error || profRes.error;

      if (firstError) {
        setError(firstError.message);
      } else {
        const normalizedResources = (resRes.data ?? []).map((item) => ({
          ...item,
          tags: (item.resource_tags ?? []).map((rt) => rt.tags).filter(Boolean),
          collectionIds: (item.collection_items ?? []).map((ci) => ci.collection_id),
        }));

        const normalizedCollections = (colRes.data ?? []).map((col) => ({
          ...col,
          resourceIds: (col.collection_items ?? []).map((ci) => ci.resource_id),
        }));

        setCategories(catRes.data ?? []);
        setResources(normalizedResources);
        setTags(tagRes.data ?? []);
        setCollections(normalizedCollections);
        setProfile(profRes.data ?? null);
      }
    } catch (err) {
      setError(err.message || 'Failed to load library data.');
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
