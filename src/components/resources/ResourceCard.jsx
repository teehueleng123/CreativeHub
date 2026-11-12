import { useEffect, useState } from 'react';
import { ExternalLink, FileImage, FileText, Film, Heart, Music } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatBytes } from '../../lib/fileValidation';
import { getSignedAssetUrl } from '../../lib/storageHelpers';

function getHostname(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return 'External Link';
  }
}

export default function ResourceCard({ resource }) {
  const isExternal = resource.resource_kind === 'external_url';
  const isImage = !isExternal && resource.mime_type?.startsWith('image/');
  const isVideo = !isExternal && resource.mime_type?.startsWith('video/');
  const isAudio = !isExternal && resource.mime_type?.startsWith('audio/');
  const category = resource.categories;
  const tags = resource.tags ?? [];

  const [thumbUrl, setThumbUrl] = useState('');

  useEffect(() => {
    let active = true;
    const previewPath = resource.thumbnail_path || (isImage ? resource.storage_path : null);
    if (!previewPath) return undefined;

    getSignedAssetUrl(previewPath, { expiresIn: 300 })
      .then((url) => {
        if (active && url) setThumbUrl(url);
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, [resource.thumbnail_path, resource.storage_path, isImage]);

  return (
    <Link className="resource-card" to={`/resources/${resource.id}`}>
      <div className="resource-thumb">
        <span className="resource-kind-tag">
          {isExternal ? 'External Reference' : (resource.file_extension || 'FILE').toUpperCase()}
        </span>

        {thumbUrl ? (
          <img src={thumbUrl} alt={resource.title} loading="lazy" />
        ) : isExternal ? (
          <ExternalLink size={32} />
        ) : isVideo ? (
          <Film size={32} />
        ) : isAudio ? (
          <Music size={32} />
        ) : isImage ? (
          <FileImage size={32} />
        ) : (
          <FileText size={32} />
        )}
      </div>

      <div className="resource-body">
        <div className="resource-meta-row">
          {category ? (
            <span className="pill-badge">
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: category.color,
                }}
              />
              {category.name}
            </span>
          ) : (
            <span className="pill-badge">Uncategorized</span>
          )}
          {resource.is_favorite && <Heart size={15} color="#e11d48" fill="#e11d48" />}
        </div>

        <h3 className="resource-title">{resource.title}</h3>

        {tags.length > 0 && (
          <div className="tag-row">
            {tags.slice(0, 3).map((tag) => (
              <span key={tag.id} className="tag-chip">
                #{tag.name}
              </span>
            ))}
            {tags.length > 3 && <span className="tag-chip">+{tags.length - 3}</span>}
          </div>
        )}

        <div className="resource-meta-row">
          <span>
            {isExternal
              ? getHostname(resource.external_url)
              : formatBytes(resource.file_size_bytes) || 'Cloud file'}
          </span>
          <span>{new Date(resource.created_at).toLocaleDateString()}</span>
        </div>
      </div>
    </Link>
  );
}
