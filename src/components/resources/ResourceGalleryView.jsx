import { useMemo, useState } from 'react';
import { FolderOpen, Link2, Search, Upload } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { useLibraryOverview } from '../../hooks/useLibraryOverview';
import EmptyState from '../ui/EmptyState';
import ResourceCard from './ResourceCard';
import ResourceFormModal from './ResourceFormModal';

function matchesFormat(resource, formatFilter) {
  if (formatFilter === 'all') return true;
  if (formatFilter === 'external') return resource.resource_kind === 'external_url';
  if (resource.resource_kind !== 'file') return false;
  const mime = resource.mime_type || '';
  if (formatFilter === 'pdf') return mime === 'application/pdf';
  return mime.startsWith(`${formatFilter}/`);
}

export default function ResourceGalleryView({
  title,
  subtitle,
  filterMode = 'all',
  emptyTitle,
  emptyDescription,
}) {
  const { resources, categories, tags, collections, loading, error, refresh } =
    useLibraryOverview();
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState('');
  const [formatFilter, setFormatFilter] = useState('all');
  const [selectedTagId, setSelectedTagId] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [modalState, setModalState] = useState({ open: false, mode: 'file' });

  const selectedCategory = searchParams.get('category') || 'all';

  const visibleResources = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return resources
      .filter((item) => {
        if (filterMode === 'favorites' && !item.is_favorite) return false;
        if (filterMode === 'references' && item.resource_kind !== 'external_url') return false;
        if (selectedCategory !== 'all' && item.category_id !== selectedCategory) return false;
        if (!matchesFormat(item, formatFilter)) return false;
        if (
          selectedTagId !== 'all' &&
          !(item.tags ?? []).some((tag) => tag.id === selectedTagId)
        ) {
          return false;
        }
        if (normalizedQuery) {
          const tagNames = (item.tags ?? []).map((t) => t.name).join(' ');
          const haystack =
            `${item.title} ${item.description || ''} ${tagNames}`.toLowerCase();
          if (!haystack.includes(normalizedQuery)) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'name') return a.title.localeCompare(b.title);
        if (sortBy === 'oldest') return new Date(a.created_at) - new Date(b.created_at);
        if (sortBy === 'recently_accessed') {
          const timeA = a.last_accessed_at ? new Date(a.last_accessed_at).getTime() : 0;
          const timeB = b.last_accessed_at ? new Date(b.last_accessed_at).getTime() : 0;
          return timeB - timeA;
        }
        return new Date(b.created_at) - new Date(a.created_at);
      });
  }, [resources, filterMode, selectedCategory, formatFilter, selectedTagId, query, sortBy]);

  return (
    <div>
      <header className="page-header">
        <div>
          <h1 className="page-title">{title}</h1>
          <p className="page-subtitle">{subtitle}</p>
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
      </header>

      {error && <div className="status-banner error">{error}</div>}

      <div className="gallery-toolbar">
        <div className="search-input-wrap">
          <Search size={16} color="#71717a" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by title, description, or tag..."
          />
        </div>

        <select
          className="filter-select"
          value={selectedCategory}
          onChange={(e) => {
            const next = new URLSearchParams(searchParams);
            if (e.target.value === 'all') next.delete('category');
            else next.set('category', e.target.value);
            setSearchParams(next);
          }}
        >
          <option value="all">All Categories</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>

        {filterMode !== 'references' && (
          <select
            className="filter-select"
            value={formatFilter}
            onChange={(e) => setFormatFilter(e.target.value)}
          >
            <option value="all">All Formats</option>
            <option value="image">Images</option>
            <option value="video">Videos</option>
            <option value="audio">Audio</option>
            <option value="pdf">PDF</option>
            <option value="external">External URLs</option>
          </select>
        )}

        <select
          className="filter-select"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="recently_accessed">Recently Accessed</option>
          <option value="name">Name (A–Z)</option>
        </select>
      </div>

      {tags.length > 0 && (
        <div className="tag-row" style={{ marginBottom: 18 }}>
          <button
            type="button"
            className={`tag-chip interactive ${selectedTagId === 'all' ? 'active' : ''}`}
            onClick={() => setSelectedTagId('all')}
          >
            All Tags
          </button>
          {tags.map((tag) => (
            <button
              key={tag.id}
              type="button"
              className={`tag-chip interactive ${selectedTagId === tag.id ? 'active' : ''}`}
              onClick={() => setSelectedTagId(tag.id === selectedTagId ? 'all' : tag.id)}
            >
              #{tag.name}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <p className="page-subtitle">Loading your library...</p>
      ) : visibleResources.length === 0 ? (
        <EmptyState
          icon={<FolderOpen size={24} />}
          title={emptyTitle}
          description={emptyDescription}
          action={
            <div className="header-actions" style={{ justifyContent: 'center' }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() =>
                  setModalState({
                    open: true,
                    mode: filterMode === 'references' ? 'external_url' : 'file',
                  })
                }
              >
                {filterMode === 'references' ? 'Save First Reference' : 'Upload First Asset'}
              </button>
            </div>
          }
        />
      ) : (
        <div className="resource-grid">
          {visibleResources.map((resource, idx) => (
            <ResourceCard key={resource.id} resource={resource} index={idx} />
          ))}
        </div>
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
