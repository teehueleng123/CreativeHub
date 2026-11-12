const MAX_THUMB_EDGE = 640;

function canvasToJpegBlob(canvas, quality = 0.8) {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/jpeg', quality);
  });
}

function drawScaled(source, sourceWidth, sourceHeight) {
  const scale = Math.min(1, MAX_THUMB_EDGE / Math.max(sourceWidth, sourceHeight));
  const width = Math.max(1, Math.round(sourceWidth * scale));
  const height = Math.max(1, Math.round(sourceHeight * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.drawImage(source, 0, 0, width, height);
  return canvas;
}

function createImageThumbnail(file) {
  return new Promise((resolve) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = async () => {
      try {
        const canvas = drawScaled(img, img.naturalWidth, img.naturalHeight);
        const blob = canvas ? await canvasToJpegBlob(canvas) : null;
        resolve(blob);
      } catch {
        resolve(null);
      } finally {
        URL.revokeObjectURL(objectUrl);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(null);
    };

    img.src = objectUrl;
  });
}

function createVideoThumbnail(file) {
  return new Promise((resolve) => {
    const objectUrl = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;

    const cleanup = () => {
      URL.revokeObjectURL(objectUrl);
    };

    const timeoutId = setTimeout(() => {
      cleanup();
      resolve(null);
    }, 6000);

    video.onloadeddata = () => {
      const targetTime = video.duration ? Math.min(0.8, video.duration * 0.2) : 0;
      video.currentTime = targetTime;
    };

    video.onseeked = async () => {
      clearTimeout(timeoutId);
      try {
        if (video.videoWidth > 0 && video.videoHeight > 0) {
          const canvas = drawScaled(video, video.videoWidth, video.videoHeight);
          const blob = canvas ? await canvasToJpegBlob(canvas) : null;
          resolve(blob);
        } else {
          resolve(null);
        }
      } catch {
        resolve(null);
      } finally {
        cleanup();
      }
    };

    video.onerror = () => {
      clearTimeout(timeoutId);
      cleanup();
      resolve(null);
    };

    video.src = objectUrl;
  });
}

/**
 * Generates a lightweight JPEG thumbnail Blob in the browser for images and videos.
 * Returns null gracefully if the browser cannot decode the format.
 */
export async function generateBrowserThumbnail(file) {
  if (!file?.type) return null;

  if (file.type.startsWith('image/') && file.type !== 'image/svg+xml') {
    return createImageThumbnail(file);
  }

  if (file.type.startsWith('video/')) {
    return createVideoThumbnail(file);
  }

  return null;
}
