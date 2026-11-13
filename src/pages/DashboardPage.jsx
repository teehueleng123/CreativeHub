import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Film, FolderHeart, Library, Link2, Upload } from 'lucide-react';
import { Link } from 'react-router-dom';
import ResourceCard from '../components/resources/ResourceCard';
import ResourceFormModal from '../components/resources/ResourceFormModal';
import CategoryIcon from '../components/ui/CategoryIcon';
import EmptyState from '../components/ui/EmptyState';
import { useAuth } from '../context/AuthContext';
import { useLibraryOverview } from '../hooks/useLibraryOverview';
import { getSignedAssetUrl } from '../lib/storageHelpers';

export default function DashboardPage() {
  const { user } = useAuth();
  const { categories, resources, collections, profile, loading, error, refresh } =
    useLibraryOverview();
  const [modalState, setModalState] = useState({ open: false, mode: 'file' });
  const [spotlightUrl, setSpotlightUrl] = useState('');

  const featuredResource =
    resources.find((item) => item.resource_kind === 'file' && item.mime_type?.startsWith('video/')) ||
    resources.find((item) => item.resource_kind === 'file' && item.mime_type?.startsWith('image/')) ||
    null;

  useEffect(() => {
    let active = true;
    if (!featuredResource?.storage_path) {
      setSpotlightUrl('');
      return undefined;
    }

    getSignedAssetUrl(featuredResource.storage_path, { expiresIn: 300 })
      .then((url) => {
        if (active && url) setSpotlightUrl(url);
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, [featuredResource?.storage_path]);

  const recentResources = resources.slice(0, 6);
  const recentlyAccessed = [...resources]
    .filter((item) => item.last_accessed_at)
    .sort((a, b) => new Date(b.last_accessed_at) - new Date(a.last_accessed_at))
    .slice(0, 3);

  const categoryCounts = useMemo(() => {
    const counts = {};
    for (const res of resources) {
      if (res.category_id) {
        counts[res.category_id] = (counts[res.category_id] || 0) + 1;
      }
    }
    return counts;
  }, [resources]);

  const displayName = profile?.display_name || user?.email?.split('@')[0] || 'Creator';

  return (
    <div>
      <section className="cinema-hero">
        <div className="cinema-hero-copy">
          <div>
            <span className="pill-badge" style={{ marginBottom: 12 }}>
              Your Calm Video &amp; Asset Sanctuary
            </span>
            <h1 className="page-title">Breathe &amp; create, {displayName}.</h1>
            <p className="page-subtitle">
              A quiet screening space for your saved videos, atmospheric overlays, textures, and
              creative inspiration—private and always in sync.
            </p>
          </div>

          <div className="header-actions">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setModalState({ open: true, mode: 'file' })}
            >
              <Upload size={16} /> Upload Video or File
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setModalState({ open: true, mode: 'external_url' })}
            >
              <Link2 size={16} /> Save External Link
            </button>
          </div>
        </div>

        <div className="cinema-hero-stage">
          {featuredResource && spotlightUrl ? (
            <>
              {featuredResource.mime_type?.startsWith('video/') ? (
                <video src={spotlightUrl} autoPlay muted loop playsInline />
              ) : (
                <img src={spotlightUrl} alt={featuredResource.title} />
              )}
              <Link className="cinema-hero-caption" to={`/resources/${featuredResource.id}`}>
                <div>
                  <div style={{ fontWeight: 700 }}>{featuredResource.title}</div>
                  <div style={{ fontSize: '0.76rem', opacity: 0.8 }}>Featured from your library</div>
                </div>
                <ArrowRight size={16} />
              </Link>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: 28, color: '#d7e6e1' }}>
              <Film size={38} style={{ opacity: 0.75, marginBottom: 10 }} />
              <div style={{ fontWeight: 600, marginBottom: 4 }}>Screening Stage Ready</div>
              <div style={{ fontSize: '0.84rem', opacity: 0.75 }}>
                Upload a calm video clip or visual asset to feature it here automatically.
              </div>
            </div>
          )}
        </div>
      </section>

      {error && <div className="status-banner error">{error}</div>}

      <div className="category-ribbon" role="region" aria-label="Quick categories">
        {categories.map((cat) => {
          const count = categoryCounts[cat.id] || 0;
          return (
            <Link key={cat.id} className="category-pill-card" to={`/library?category=${cat.id}`}>
              <span className="category-pill-dot" style={{ backgroundColor: cat.color }}>
                <CategoryIcon name={cat.icon} size={15} />
              </span>
              <span className="category-pill-name">{cat.name}</span>
              <span className="category-pill-count">{count}</span>
            </Link>
          );
        })}
      </div>

      <section className="section-block">
        <div className="section-header">
          <h2 className="section-title">Screening Room · Recently Added</h2>
          <Link to="/library" style={{ fontSize: '0.88rem', fontWeight: 600 }}>
            Open full library →
          </Link>
        </div>

        {loading ? (
          <p className="page-subtitle">Preparing your screening room...</p>
        ) : recentResources.length === 0 ? (
          <EmptyState
            icon={<Library size={24} />}
            title="Your sanctuary awaits its first video or asset"
            description="Upload an MP4/WebM clip, image, or texture (up to 50 MB), or save an external creative link."
            action={
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setModalState({ open: true, mode: 'file' })}
              >
                <Upload size={16} /> Add Your First Resource
              </button>
            }
          />
        ) : (
          <div className={`resource-grid ${recentResources.length >= 3 ? 'bento-featured' : ''}`}>
            {recentResources.map((resource, idx) => (
              <ResourceCard key={resource.id} resource={resource} index={idx} />
            ))}
          </div>
        )}
      </section>

      {recentlyAccessed.length > 0 && (
        <section className="section-block">
          <div className="section-header">
            <h2 className="section-title">Recently Viewed</h2>
          </div>
          <div className="resource-grid">
            {recentlyAccessed.map((resource) => (
              <ResourceCard key={resource.id} resource={resource} />
            ))}
          </div>
        </section>
      )}

      {collections.length > 0 && (
        <section className="section-block">
          <div className="section-header">
            <h2 className="section-title">Moods &amp; Collections</h2>
            <Link to="/collections" style={{ fontSize: '0.88rem', fontWeight: 600 }}>
              Manage →
            </Link>
          </div>
          <div className="category-grid">
            {collections.slice(0, 4).map((col) => (
              <Link key={col.id} className="category-card" to={`/collections?id=${col.id}`}>
                <div className="category-icon-wrap" style={{ backgroundColor: col.cover_color }}>
                  <FolderHeart size={20} />
                </div>
                <div>
                  <div className="category-card-title">{col.name}</div>
                  <div className="category-card-meta">
                    {col.resourceIds.length}{' '}
                    {col.resourceIds.length === 1 ? 'resource' : 'resources'}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <ResourceFormModal
        isOpen={modalState.open}
        initialMode={modalState.mode}
        categories={categories}
        collections={collections}
        onClose={() => setModalState((prev) => ({ ...prev, open: false }))}
        onSuccess={refresh}
      />
    </div>
  );
}
