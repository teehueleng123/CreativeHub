import { supabase } from './supabaseClient';

export const STUDIO_COLORS = [
  '#E11D48',
  '#6366F1',
  '#3B82F6',
  '#10B981',
  '#F59E0B',
  '#A855F7',
  '#EC4899',
  '#0EA5E9',
];

export function parseTagInput(rawText = '') {
  return [...new Set(rawText.split(',').map((t) => t.trim()).filter(Boolean))];
}

export function slugifyCategory(name = '') {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Finds an existing tag by case-insensitive name or creates it, then attaches it to the resource.
 */
export async function attachTagsToResource({ userId, resourceId, tagNames }) {
  if (!supabase || !tagNames.length) return [];

  const { data: existingTags, error: fetchError } = await supabase
    .from('tags')
    .select('id, name, color');

  if (fetchError) throw fetchError;

  const byLower = new Map((existingTags ?? []).map((t) => [t.name.toLowerCase(), t]));
  const attached = [];

  for (const rawName of tagNames) {
    const cleanName = rawName.trim();
    if (!cleanName) continue;

    let tag = byLower.get(cleanName.toLowerCase());
    if (!tag) {
      const { data: created, error: createError } = await supabase
        .from('tags')
        .insert({ user_id: userId, name: cleanName })
        .select('id, name, color')
        .single();

      if (createError) throw createError;
      tag = created;
      byLower.set(cleanName.toLowerCase(), tag);
    }

    const { error: linkError } = await supabase
      .from('resource_tags')
      .upsert({ resource_id: resourceId, tag_id: tag.id }, { onConflict: 'resource_id,tag_id' });

    if (linkError) throw linkError;
    attached.push(tag);
  }

  return attached;
}

export async function detachTagFromResource({ resourceId, tagId }) {
  if (!supabase) return;
  const { error } = await supabase
    .from('resource_tags')
    .delete()
    .eq('resource_id', resourceId)
    .eq('tag_id', tagId);

  if (error) throw error;
}

export async function setResourceCollectionMembership({ collectionId, resourceId, member }) {
  if (!supabase) return;

  if (member) {
    const { error } = await supabase
      .from('collection_items')
      .upsert(
        { collection_id: collectionId, resource_id: resourceId },
        { onConflict: 'collection_id,resource_id' }
      );
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from('collection_items')
      .delete()
      .eq('collection_id', collectionId)
      .eq('resource_id', resourceId);
    if (error) throw error;
  }
}
