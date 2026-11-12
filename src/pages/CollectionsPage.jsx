import { useMemo, useState } from 'react';
import { ArrowLeft, FolderHeart, Plus, Trash2, X } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import ResourceCard from '../components/resources/ResourceCard';
import EmptyState from '../components/ui/EmptyState';
import { useAuth } from '../context/AuthContext';
import { useLibraryOverview } from '../hooks/useLibraryOverview';
import {
  STUDIO_COLORS,
  setResourceCollectionMembership,
} from '../lib/organisationHelpers';
import { supabase } from '../lib/supabaseClient';

export default function CollectionsPage() {
  const { user } = useAuth();
  const { collections, resources, loading, error, refresh } = useLibraryOverview();
  const [searchParams, setSearchParams] = useSearchParams();

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [coverColor, setCoverColor] = useState(STUDIO_COLORS[1]);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const selectedId = searchParams.get('id');
  const activeCollection = useMemo(
    () => collections.find((c) => c.id === selectedId) || null,
    [collections, selectedId]
  );

  const activeItems = useMemo(() => {
    if (!activeCollection) return [];
    const idSet = new Set(activeCollection.resourceIds);
    return resources.filter((item) => idSet.has(item.id));
  }, [activeCollection, resources]);

  const handleCreate = async (event) => {
    event.preventDefault();
    if (!user || !supabase) return;

    const cleanName = name.trim();
    if (!cleanName) {
      setFormError('Collection name is required.');
      return;
    }

    setSaving(true);
    setFormError('');

    const { error: insertError } = await supabase.from('collections').insert({
      user_id: user.id,
      name: cleanName,
      description: description.trim() || null,
      cover_color: coverColor,
    });

    setSaving(false);

    if (insertError) {
      setFormError(insertError.message);
    } else {
      setName('');
      setDescription('');
      setShowForm(false);
      refresh();
    }
  };

  const handleDeleteCollection = async (col) => {
    if (!supabase) return;
    if (!window.confirm(`Delete collection "${col.name}"? Your resources inside will NOT be deleted.`)) {
      return;
    }
    const { error: delError } = await supabase.from('collections').delete().eq('id', col.id);
    if (delError) {
      setFormError(delError.message);
    } else {
      if (selectedId === col.id) setSearchParams({});
      refresh();
    }
  };

  const handleRemoveItem = async (resourceId) => {
    if (!activeCollection) return;
    try {
      await setResourceCollectionMembership({
        collectionId: activeCollection.id,
        resourceId,
        member: false,
      });
      refresh();
    } catch (err) {
      setFormError(err.message);
    }
  };

  return (
    <div>
      <header className="page-header">
        <div>
          <h1 className="page-title">
            {activeCollection ? activeCollection.name : 'Collections'}
          </h1>
          <p className="page-subtitle">
            {activeCollection
              ? activeCollection.description || 'Curated assets grouped in this collection.'
              : 'Curate moodboards, project folders, and themed bundles across your library.'}
          </p>
        </div>

        <div className="header-actions">
          {activeCollection ? (
            <>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setSearchParams({})}
              >
                <ArrowLeft size={16} /> All Collections
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={() => handleDeleteCollection(activeCollection)}
              >
                <Trash2 size={16} /> Delete Collection
              </button>
            </>
          ) : (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setShowForm((v) => !v)}
            >
              <Plus size={16} /> {showForm ? 'Close Form' : 'New Collection'}
            </button>
          )}
        </div>
      </header>

      {(error || formError) && <div className="status-banner error">{error || formError}</div>}

      {showForm && !activeCollection && (
        <form
          className="surface-card auth-form"
          style={{ marginBottom: 24, maxWidth: 520 }}
          onSubmit={handleCreate}
        >
          <h2 className="section-title" style={{ margin: 0 }}>
            Create Collection
          </h2>

          <label className="field-label">
            Collection Name
            <input
              className="field-input"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Cyberpunk Short Film"
            />
          </label>

          <label className="field-label">
            Description / Theme / Mood (optional)
            <textarea
              className="field-input"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Neon palettes, rain overlays, synth transitions..."
            />
          </label>

          <div className="field-label">
            Cover Colour
            <div className="swatch-row">
              {STUDIO_COLORS.map((swatch) => (
                <button
                  key={swatch}
                  type="button"
                  className={`swatch-dot ${coverColor === swatch ? 'selected' : ''}`}
                  style={{ backgroundColor: swatch }}
                  onClick={() => setCoverColor(swatch)}
                  aria-label={`Select colour ${swatch}`}
                />
              ))}
            </div>
          </div>

          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Creating...' : 'Create Collection'}
          </button>
        </form>
      )}

      {loading ? (
        <p className="page-subtitle">Loading collections...</p>
      ) : activeCollection ? (
        activeItems.length === 0 ? (
          <EmptyState
            icon={<FolderHeart size={24} />}
            title="This collection has no resources yet"
            description="Open any resource in My Library and assign it to this collection from its detail page."
          />
        ) : (
          <div className="resource-grid">
            {activeItems.map((resource) => (
              <div key={resource.id} style={{ position: 'relative' }}>
                <ResourceCard resource={resource} />
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{
                    position: 'absolute',
                    top: 10,
                    right: 10,
                    padding: '4px 8px',
                    fontSize: '0.75rem',
                  }}
                  onClick={() => handleRemoveItem(resource.id)}
                  title="Remove from collection"
                >
                  <X size={14} /> Remove
                </button>
              </div>
            ))}
          </div>
        )
      ) : collections.length === 0 ? (
        <EmptyState
          icon={<FolderHeart size={24} />}
          title="No custom collections created yet"
          description="Create your first collection to organise assets by client project, mood, or colour theme."
          action={
            <button type="button" className="btn btn-primary" onClick={() => setShowForm(true)}>
              <Plus size={16} /> Create First Collection
            </button>
          }
        />
      ) : (
        <div className="category-grid">
          {collections.map((col) => (
            <div
              key={col.id}
              className="category-card"
              style={{ justifyContent: 'space-between', cursor: 'pointer' }}
              onClick={() => setSearchParams({ id: col.id })}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
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
              </div>

              <button
                type="button"
                className="btn btn-secondary"
                style={{ padding: 8 }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteCollection(col);
                }}
                title="Delete collection"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
