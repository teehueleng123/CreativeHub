import { useState } from 'react';
import { FolderHeart, Library, Link2, Upload } from 'lucide-react';
import { Link } from 'react-router-dom';
import ResourceCard from '../components/resources/ResourceCard';
import ResourceFormModal from '../components/resources/ResourceFormModal';
import CategoryIcon from '../components/ui/CategoryIcon';
import EmptyState from '../components/ui/EmptyState';
import { useAuth } from '../context/AuthContext';
import { useLibraryOverview } from '../hooks/useLibraryOverview';

export default function DashboardPage() {
  const { user } = useAuth();
  const { categories, resources, collections, profile, loading, error, refresh } =
    useLibraryOverview();
  const [modalState, setModalState] = useState({ open: false, mode: 'file' });

  const favoriteCount = resources.filter((item) => item.is_favorite).length;
  const referenceCount = resources.filter((item) => item.resource_kind === 'external_url').length;
  const recentResources = resources.slice(0, 4);
  const recentlyAccessed = [...resources]
    .filter((item) => item.last_accessed_at)
    .sort((a, b) => new Date(b.last_accessed_at) - new Date(a.last_accessed_at))
    .slice(0, 4);

  const displayName = profile?.display_name || user?.email?.split('@')[0] || 'Creator';

  const countForCategory = (categoryId) =>
    resources.filter((item) => item.category_id === categoryId).length;

  return (
    <div>
      <section className="hero-banner">
        <div>
          <span className="pill-badge" style={{ marginBottom: 10 }}>
            Personal Creative Studio
          </span>
          <h1 className="page-title">Welcome back, {displayName}</h1>
          <p className="page-subtitle">
            Browse your creative categories, upload new assets, or bookmark external references.
          </p>
        </div>

        <div className="header-actions">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setModalState({ open: true, mode: 'file' })}
          >
            <Upload size={16} /> Upload File
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setModalState({ open: true, mode: 'external_url' })}
          >
            <Link2 size={16} /> Save Reference
          </button>
        </div>
      </section>

      {error && <div className="status-banner error">{error}</div>}

      <section className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Resources</div>
          <div className="stat-value">{loading ? '—' : resources.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Saved References</div>
          <div className="stat-value">{loading ? '—' : referenceCount}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Favourites</div>
          <div className="stat-value">{loading ? '—' : favoriteCount}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Collections</div>
          <div className="stat-value">{loading ? '—' : collections.length}</div>
        </div>
      </section>

      <section className="section-block">
        <div className="section-header">
          <h2 className="section-title">Explore by Category</h2>
          <Link to="/categories" style={{ fontSize: '0.88rem', fontWeight: 600 }}>
            See all →
          </Link>
        </div>

        <div className="category-grid">
          {categories.map((cat) => (
            <Link key={cat.id} className="category-card" to={`/library?category=${cat.id}`}>
              <div className="category-icon-wrap" style={{ backgroundColor: cat.color }}>
                <CategoryIcon name={cat.icon} size={22} />
              </div>
              <div>
                <div className="category-card-title">{cat.name}</div>
                <div className="category-card-meta">
                  {countForCategory(cat.id)} {countForCategory(cat.id) === 1 ? 'item' : 'items'}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="section-block">
        <div className="section-header">
          <h2 className="section-title">Recently Added</h2>
          <Link to="/library" style={{ fontSize: '0.88rem', fontWeight: 600 }}>
            View library →
          </Link>
        </div>

        {recentResources.length === 0 ? (
          <EmptyState
            icon={<Library size={24} />}
            title="Your creative library is empty"
            description="Upload your first image, overlay, texture, or clip (up to 50 MB) or save an external link."
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
          <div className="resource-grid">
            {recentResources.map((resource) => (
              <ResourceCard key={resource.id} resource={resource} />
            ))}
          </div>
        )}
      </section>

      {recentlyAccessed.length > 0 && (
        <section className="section-block">
          <div className="section-header">
            <h2 className="section-title">Quick Access (Recently Viewed)</h2>
          </div>
          <div className="resource-grid">
            {recentlyAccessed.map((resource) => (
              <ResourceCard key={resource.id} resource={resource} />
            ))}
          </div>
        </section>
      )}

      <section className="section-block">
        <div className="section-header">
          <h2 className="section-title">Quick Access Collections</h2>
          <Link to="/collections" style={{ fontSize: '0.88rem', fontWeight: 600 }}>
            Manage →
          </Link>
        </div>

        {collections.length === 0 ? (
          <EmptyState
            icon={<FolderHeart size={24} />}
            title="No collections yet"
            description="Create a collection on the Collections page to group assets by project, mood, or colour."
            action={
              <Link className="btn btn-secondary" to="/collections">
                Create Collection
              </Link>
            }
          />
        ) : (
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
        )}
      </section>

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
