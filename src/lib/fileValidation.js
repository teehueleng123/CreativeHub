export const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB Supabase free-tier cap

export const ALLOWED_MIME_TYPES = [
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
  'application/pdf',
];

export function formatBytes(bytes) {
  if (bytes === null || bytes === undefined) return null;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function getFileExtension(fileName = '') {
  const parts = fileName.split('.');
  return parts.length > 1 ? parts.pop().toLowerCase() : '';
}

export function sanitizeFileName(fileName = 'asset') {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
}

export function validateUploadFile(file) {
  if (!file) {
    return { valid: false, error: 'Please select a file to upload.' };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: `File is ${formatBytes(file.size)}. Maximum allowed on Supabase Free is 50 MB—save larger assets as an External Reference instead.`,
    };
  }

  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `Unsupported file type (${file.type || 'unknown'}). Allowed: JPG, PNG, WebP, GIF, SVG, MP4, WebM, MOV, MP3, WAV, PDF.`,
    };
  }

  return {
    valid: true,
    error: '',
    extension: getFileExtension(file.name),
  };
}

export function validateExternalUrl(rawUrl) {
  const trimmed = rawUrl.trim();
  if (!trimmed) {
    return { valid: false, error: 'Please enter a valid URL.' };
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return { valid: false, error: 'Only http:// and https:// URLs are allowed.' };
    }
    return { valid: true, error: '', normalizedUrl: parsed.toString() };
  } catch {
    return { valid: false, error: 'Please enter a complete URL starting with https:// or http://.' };
  }
}
