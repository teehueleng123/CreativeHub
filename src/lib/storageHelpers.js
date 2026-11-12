import { sanitizeFileName } from './fileValidation';
import { supabase } from './supabaseClient';

export const ASSET_BUCKET = 'creative-assets';

// In-memory cache for preview signed URLs so gallery navigation doesn't re-fetch constantly
const signedUrlCache = new Map();

export async function uploadAssetFile({ userId, resourceId, file }) {
  if (!supabase) throw new Error('Supabase is not configured.');

  const safeName = sanitizeFileName(file.name);
  const storagePath = `${userId}/${resourceId}/${safeName}`;

  const { error } = await supabase.storage.from(ASSET_BUCKET).upload(storagePath, file, {
    contentType: file.type,
    upsert: false,
  });

  if (error) throw error;
  return storagePath;
}

export async function uploadThumbnailBlob({ userId, resourceId, blob }) {
  if (!supabase || !blob) return null;

  const thumbnailPath = `${userId}/${resourceId}/thumb.jpg`;
  const { error } = await supabase.storage.from(ASSET_BUCKET).upload(thumbnailPath, blob, {
    contentType: 'image/jpeg',
    upsert: true,
  });

  if (error) return null;
  return thumbnailPath;
}

export async function getSignedAssetUrl(storagePath, { downloadFileName = null, expiresIn = 300 } = {}) {
  if (!supabase || !storagePath) return null;

  if (!downloadFileName) {
    const cached = signedUrlCache.get(storagePath);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.url;
    }
  }

  const options = downloadFileName ? { download: downloadFileName } : undefined;
  const { data, error } = await supabase.storage
    .from(ASSET_BUCKET)
    .createSignedUrl(storagePath, expiresIn, options);

  if (error) throw error;

  if (!downloadFileName && data?.signedUrl) {
    const ttlMs = Math.max(30, expiresIn - 45) * 1000;
    signedUrlCache.set(storagePath, {
      url: data.signedUrl,
      expiresAt: Date.now() + ttlMs,
    });
  }

  return data.signedUrl;
}

export async function removeAssetFiles(paths) {
  if (!supabase) return;
  const validPaths = paths.filter(Boolean);
  if (validPaths.length === 0) return;

  for (const path of validPaths) {
    signedUrlCache.delete(path);
  }

  const { error } = await supabase.storage.from(ASSET_BUCKET).remove(validPaths);
  if (error) throw error;
}
