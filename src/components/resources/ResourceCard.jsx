import { useEffect, useState } from 'react';
import { ExternalLink, FileImage, FileText, Film, Heart, Music, Play } from 'lucide-react';
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

export default function ResourceCard({ resource, index }) {
  const isExternal = resource.resource_kind === 'external_url';
  const isImage = !isExternal && resource.mime_type?.startsWith('image/');
  const isVideo = !isExternal && resource.mime_type?.startsWith('video/');
  const isAudio = !isExternal && resource.mime_type?.startsWith('audio/');
  const category = resource.categories;
  const tags = resource.tags ?? [];

  const [thumbUrl, setThumbUrl] = useState('');
  const [hoverVideoUrl, setHoverVideoUrl] = useState('');
  const [hovering, setHovering] = useState(false);

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

  const handleMouseEnter = () => {
    setHovering(true);
    if (isVideo && resource.storage_path && !hoverVideoUrl) {
      getSignedAssetUrl(resource.storage_path, { expiresIn: 300 })
        .then((url) => {
          if (url) setHoverVideoUrl(url);
        })
        .catch(() => {});
    }
  };

  const handleMouseLeave = () => {
    setHovering(false);
  };

  return (
    <Link
      className="cinema-card"
      to={`/resources/${resource.id}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {index !== undefined && (
        <>
          <span className="archive-plate-number" aria-hidden="true">
            PLATE № {String(index + 1).padStart(2, '0')}
          </span>
          <span className="cosmos-sector-tag" aria-hidden="true">
            // SEC-0{index + 1}
          </span>
        </>
      )}

      <div className="cinema-card-media">
        {hovering && isVideo && hoverVideoUrl ? (
          <video src={hoverVideoUrl} autoPlay muted loop playsInline />
        ) : thumbUrl ? (
          <img src={thumbUrl} alt={resource.title} loading="lazy" />
        ) : isExternal ? (
          <ExternalLink size={34} />
        ) : isVideo ? (
          <Film size={34} />
        ) : isAudio ? (
          <Music size={34} />
        ) : isImage ? (
          <FileImage size={34} />
        ) : (
          <FileText size={34} />
        )}

        <span className="resource-kind-tag">
          {isExternal ? 'Reference' : (resource.file_extension || 'FILE').toUpperCase()}
        </span>

        {resource.is_favorite && (
          <span className="resource-fav-badge" aria-label="Favourited">
            <Heart size={14} color="#f08d9b" fill="#f08d9b" />
          </span>
        )}

        {isVideo && (
          <span
            className={`video-play-badge ${hovering && hoverVideoUrl ? 'is-previewing' : ''}`}
            aria-hidden="true"
          >
            <Play size={18} fill="#ffffff" style={{ marginLeft: 2 }} />
          </span>
        )}
      </div>

      <div className="cinema-card-scrim" />

      <div className="cinema-card-overlay">
        <h3 className="cinema-card-title">{resource.title}</h3>

        {tags.length > 0 && (
          <div className="tag-row">
            {tags.slice(0, 2).map((tag) => (
              <span key={tag.id} className="tag-chip cinema-card-tag">
                #{tag.name}
              </span>
            ))}
          </div>
        )}

        <div className="cinema-card-meta">
          <span>{category ? category.name : 'Uncategorized'}</span>
          <span>
            {isExternal
              ? getHostname(resource.external_url)
              : formatBytes(resource.file_size_bytes) || 'Cloud file'}
          </span>
        </div>
      </div>
    </Link>
  );
}
