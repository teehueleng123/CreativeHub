import { useCallback, useEffect, useState } from 'react';
import {
  ArrowLeft,
  Download,
  ExternalLink,
  FileText,
  FolderHeart,
  Heart,
  Pencil,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import SharePanel from '../components/sharing/SharePanel';
import { useAuth } from '../context/AuthContext';
import { formatBytes, validateExternalUrl } from '../lib/fileValidation';
import {
  attachTagsToResource,
  detachTagFromResource,
  parseTagInput,
  setResourceCollectionMembership,
} from '../lib/organisationHelpers';
import { getSignedAssetUrl, removeAssetFiles } from '../lib/storageHelpers';
import { supabase } from '../lib/supabaseClient';

export default function ResourceDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [resource, setResource] = useState(null);
  const [categories, setCategories] = useState([]);
  const [collections, setCollections] = useState([]);
  const [resourceTags, setResourceTags] = useState([]);
  const [memberCollectionIds, setMemberCollectionIds] = useState(new Set());
  const [newTagInput, setNewTagInput] = useState('');

  const [previewUrl, setPreviewUrl] = useState('');
  const [mediaMeta, setMediaMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    title: '',
    category_id: '',
    description: '',
    license_info: '',
    personal_notes: '',
    external_url: '',
  });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const loadResource = useCallback(async () => {
    if (!user || !supabase || !id) return;

    setLoading(true);
    setError('');

    try {
      const [resResult, catResult, colResult] = await Promise.all([
        supabase
          .from('resources')
          .select(
            '*, categories(id, name, color), resource_tags(tags(id, name, color)), collection_items(collection_id)'
          )
          .eq('id', id)
          .maybeSingle(),
        supabase.from('categories').select('id, name').order('sort_order', { ascending: true }),
        supabase.from('collections').select('id, name, cover_color').order('name', { ascending: true }),
      ]);

      if (resResult.error) throw resResult.error;
      if (catResult.error) throw catResult.error;
      if (colResult.error) throw colResult.error;

      setCategories(catResult.data ?? []);
      setCollections(colResult.data ?? []);
      setResource(resResult.data);

      if (resResult.data) {
        const item = resResult.data;
        setResourceTags((item.resource_tags ?? []).map((rt) => rt.tags).filter(Boolean));
        setMemberCollectionIds(
          new Set((item.collection_items ?? []).map((ci) => ci.collection_id))
        );

        setForm({
          title: item.title || '',
          category_id: item.category_id || '',
          description: item.description || '',
          license_info: item.license_info || '',
          personal_notes: item.personal_notes || '',
          external_url: item.external_url || '',
        });

        supabase
          .from('resources')
          .update({ last_accessed_at: new Date().toISOString() })
          .eq('id', item.id)
          .then(() => {});

        if (item.resource_kind === 'file' && item.storage_path) {
          const signed = await getSignedAssetUrl(item.storage_path, { expiresIn: 600 });
          setPreviewUrl(signed || '');
        } else {
          setPreviewUrl('');
        }
      }
    } catch (err) {
      setError(err.message || 'Could not load resource.');
    } finally {
      setLoading(false);
    }
  }, [id, user]);

  useEffect(() => {
    loadResource();
  }, [loadResource]);

  const handleDownload = async () => {
    if (!resource?.storage_path) return;
    try {
      const url = await getSignedAssetUrl(resource.storage_path, {
        downloadFileName: resource.file_name || resource.title,
        expiresIn: 120,
      });
      if (url) {
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = resource.file_name || resource.title;
        anchor.click();
      }
    } catch (err) {
      setError(err.message || 'Could not generate download link.');
    }
  };

  const handleToggleFavorite = async () => {
    if (!resource || !supabase) return;
    const nextValue = !resource.is_favorite;
    const { error: updateError } = await supabase
      .from('resources')
      .update({ is_favorite: nextValue })
      .eq('id', resource.id);

    if (updateError) {
      setError(updateError.message);
    } else {
      setResource((prev) => ({ ...prev, is_favorite: nextValue }));
    }
  };

  const handleAddTags = async (event) => {
    event.preventDefault();
    if (!resource || !user) return;
    const parsed = parseTagInput(newTagInput);
    if (parsed.length === 0) return;

    try {
      await attachTagsToResource({ userId: user.id, resourceId: resource.id, tagNames: parsed });
      setNewTagInput('');
      loadResource();
    } catch (err) {
      setError(err.message || 'Could not attach tag.');
    }
  };

  const handleRemoveTag = async (tagId) => {
    if (!resource) return;
    try {
      await detachTagFromResource({ resourceId: resource.id, tagId });
      setResourceTags((prev) => prev.filter((t) => t.id !== tagId));
    } catch (err) {
      setError(err.message || 'Could not remove tag.');
    }
  };

  const handleToggleCollection = async (collectionId) => {
    if (!resource) return;
    const isMember = memberCollectionIds.has(collectionId);
    try {
      await setResourceCollectionMembership({
        collectionId,
        resourceId: resource.id,
        member: !isMember,
      });
      setMemberCollectionIds((prev) => {
        const next = new Set(prev);
        if (isMember) next.delete(collectionId);
        else next.add(collectionId);
        return next;
      });
    } catch (err) {
      setError(err.message || 'Could not update collection membership.');
    }
  };

  const handleSaveEdit = async (event) => {
    event.preventDefault();
    if (!resource || !supabase) return;

    setError('');
    setFeedback('');

    const trimmedTitle = form.title.trim();
    if (!trimmedTitle) {
      setError('Title cannot be empty.');
      return;
    }

    const updates = {
      title: trimmedTitle,
      category_id: form.category_id || null,
      description: form.description.trim() || null,
      license_info: form.license_info.trim() || null,
      personal_notes: form.personal_notes.trim() || null,
    };

    if (resource.resource_kind === 'external_url') {
      const urlCheck = validateExternalUrl(form.external_url);
      if (!urlCheck.valid) {
        setError(urlCheck.error);
        return;
      }
      updates.external_url = urlCheck.normalizedUrl;
    }

    setSaving(true);
    const { error: updateError } = await supabase
      .from('resources')
      .update(updates)
      .eq('id', resource.id);

    setSaving(false);

    if (updateError) {
      setError(updateError.message);
    } else {
      setEditing(false);
      setFeedback('Resource updated.');
      loadResource();
    }
  };

  const handleDelete = async () => {
    if (!resource || !supabase) return;
    const confirmed = window.confirm(
      `Delete "${resource.title}" permanently? This cannot be undone.`
    );
    if (!confirmed) return;

    setDeleting(true);
    setError('');

    try {
      if (resource.resource_kind === 'file') {
        await removeAssetFiles([resource.storage_path, resource.thumbnail_path]);
      }
      const { error: deleteError } = await supabase
        .from('resources')
        .delete()
        .eq('id', resource.id);

      if (deleteError) throw deleteError;
      navigate('/library', { replace: true });
    } catch (err) {
      setError(err.message || 'Could not delete resource.');
      setDeleting(false);
    }
  };

  const renderPreview = () => {
    if (!resource) return null;

    if (resource.resource_kind === 'external_url') {
      return (
        <div style={{ textAlign: 'center', padding: 24 }}>
          <ExternalLink size={44} style={{ marginBottom: 14, opacity: 0.9 }} />
          <p style={{ margin: '0 0 16px', color: '#d4d4d8', wordBreak: 'break-all' }}>
            {resource.external_url}
          </p>
          <a
            className="btn btn-primary"
            href={resource.external_url}
            target="_blank"
            rel="noopener noreferrer"
          >
            Open External Website <ExternalLink size={16} />
          </a>
        </div>
      );
    }

    if (!previewUrl) {
      return <p style={{ color: '#a1a1aa' }}>Generating secure preview...</p>;
    }

    const mime = resource.mime_type || '';
    if (mime.startsWith('image/')) {
      return (
        <img
          src={previewUrl}
          alt={resource.title}
          onLoad={(e) => {
            const img = e.currentTarget;
            if (img.naturalWidth) {
              setMediaMeta({ width: img.naturalWidth, height: img.naturalHeight, duration: null });
            }
          }}
        />
      );
    }
    if (mime.startsWith('video/')) {
      return (
        <video
          src={previewUrl}
          controls
          playsInline
          onLoadedMetadata={(e) => {
            const vid = e.currentTarget;
            setMediaMeta({
              width: vid.videoWidth || null,
              height: vid.videoHeight || null,
              duration: Number.isFinite(vid.duration) ? vid.duration : null,
            });
          }}
        />
      );
    }
    if (mime.startsWith('audio/')) {
      return (
        <audio
          src={previewUrl}
          controls
          style={{ width: '100%' }}
          onLoadedMetadata={(e) => {
            const aud = e.currentTarget;
            if (Number.isFinite(aud.duration)) {
              setMediaMeta({ width: null, height: null, duration: aud.duration });
            }
          }}
        />
      );
    }
    if (mime === 'application/pdf') {
      return <iframe src={previewUrl} title={resource.title} />;
    }

    return (
      <div style={{ textAlign: 'center' }}>
        <FileText size={44} style={{ marginBottom: 10 }} />
        <p style={{ margin: 0, color: '#d4d4d8' }}>{resource.file_name}</p>
      </div>
    );
  };

  return (
    <div>
      <div className="page-header">
        <Link className="btn btn-secondary" to="/library">
          <ArrowLeft size={16} /> Back to My Library
        </Link>

        {resource && (
          <div className="header-actions">
            <button type="button" className="btn btn-secondary" onClick={handleToggleFavorite}>
              <Heart
                size={16}
                color={resource.is_favorite ? '#e11d48' : 'currentColor'}
                fill={resource.is_favorite ? '#e11d48' : 'none'}
              />
              {resource.is_favorite ? 'Favourited' : 'Favourite'}
            </button>

            {resource.resource_kind === 'file' && (
              <button type="button" className="btn btn-primary" onClick={handleDownload}>
                <Download size={16} /> Download Original
              </button>
            )}

            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setEditing((prev) => !prev)}
            >
              <Pencil size={16} /> {editing ? 'Cancel Edit' : 'Edit'}
            </button>

            <button
              type="button"
              className="btn btn-danger"
              onClick={handleDelete}
              disabled={deleting}
            >
              <Trash2 size={16} /> {deleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        )}
      </div>

      {loading && <p className="page-subtitle">Loading resource details...</p>}
      {error && <div className="status-banner error">{error}</div>}
      {feedback && <div className="status-banner success">{feedback}</div>}

      {!loading && !resource && (
        <div className="surface-card">
          <h2 style={{ marginTop: 0 }}>Resource not found</h2>
          <p className="page-subtitle">
            This resource does not exist or belongs to another account.
          </p>
        </div>
      )}

      {resource && (
        <div className="detail-grid">
          <div className="preview-stage">{renderPreview()}</div>

          <div style={{ display: 'grid', gap: 18 }}>
            <div className="surface-card">
              {editing ? (
                <form className="auth-form" onSubmit={handleSaveEdit}>
                  <h2 className="section-title" style={{ marginBottom: 4 }}>
                    Edit Resource Details
                  </h2>

                  <label className="field-label">
                    Title
                    <input
                      className="field-input"
                      type="text"
                      required
                      value={form.title}
                      onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    />
                  </label>

                  <label className="field-label">
                    Category
                    <select
                      className="field-input"
                      value={form.category_id}
                      onChange={(e) => setForm((f) => ({ ...f, category_id: e.target.value }))}
                    >
                      <option value="">Uncategorized</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  {resource.resource_kind === 'external_url' && (
                    <label className="field-label">
                      External URL
                      <input
                        className="field-input"
                        type="url"
                        required
                        value={form.external_url}
                        onChange={(e) => setForm((f) => ({ ...f, external_url: e.target.value }))}
                      />
                    </label>
                  )}

                  <label className="field-label">
                    Description
                    <textarea
                      className="field-input"
                      rows={3}
                      value={form.description}
                      onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    />
                  </label>

                  <label className="field-label">
                    Licence &amp; Usage Rights
                    <input
                      className="field-input"
                      type="text"
                      value={form.license_info}
                      onChange={(e) => setForm((f) => ({ ...f, license_info: e.target.value }))}
                    />
                  </label>

                  <label className="field-label">
                    Personal Notes
                    <textarea
                      className="field-input"
                      rows={3}
                      value={form.personal_notes}
                      onChange={(e) => setForm((f) => ({ ...f, personal_notes: e.target.value }))}
                    />
                  </label>

                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </form>
              ) : (
                <div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                    <span className="pill-badge">
                      {resource.resource_kind === 'external_url'
                        ? 'External Reference'
                        : 'Cloud File'}
                    </span>
                    {resource.categories && (
                      <span className="pill-badge">{resource.categories.name}</span>
                    )}
                  </div>

                  <h1 className="page-title" style={{ fontSize: '1.65rem', marginBottom: 8 }}>
                    {resource.title}
                  </h1>
                  <p className="page-subtitle" style={{ marginBottom: 20 }}>
                    {resource.description || 'No description provided.'}
                  </p>

                  <div style={{ display: 'grid', gap: 10, fontSize: '0.9rem' }}>
                    {resource.resource_kind === 'file' && (
                      <>
                        <div>
                          <strong>File:</strong> {resource.file_name}
                        </div>
                        <div>
                          <strong>Format &amp; Size:</strong> {resource.mime_type} ·{' '}
                          {formatBytes(resource.file_size_bytes)}
                        </div>
                        {(mediaMeta?.width || mediaMeta?.duration) && (
                          <div>
                            <strong>Media Specs:</strong>{' '}
                            {mediaMeta.width && mediaMeta.height
                              ? `${mediaMeta.width} × ${mediaMeta.height}px`
                              : ''}
                            {mediaMeta.width && mediaMeta.duration ? ' · ' : ''}
                            {mediaMeta.duration
                              ? `${Math.floor(mediaMeta.duration / 60)}:${String(
                                  Math.round(mediaMeta.duration % 60)
                                ).padStart(2, '0')}`
                              : ''}
                          </div>
                        )}
                      </>
                    )}
                    <div>
                      <strong>Licence:</strong> {resource.license_info || 'Not specified'}
                    </div>
                    <div>
                      <strong>Added:</strong> {new Date(resource.created_at).toLocaleString()}
                    </div>
                    <div>
                      <strong>Personal Notes:</strong>
                      <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)' }}>
                        {resource.personal_notes || 'No personal notes yet.'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="surface-card">
              <h2 className="section-title" style={{ marginBottom: 10 }}>
                Tags
              </h2>
              <div className="tag-row" style={{ marginBottom: 12 }}>
                {resourceTags.length === 0 ? (
                  <span className="category-card-meta">No tags attached yet.</span>
                ) : (
                  resourceTags.map((tag) => (
                    <span key={tag.id} className="tag-chip">
                      #{tag.name}
                      <button
                        type="button"
                        className="tag-remove-btn"
                        onClick={() => handleRemoveTag(tag.id)}
                        aria-label={`Remove tag ${tag.name}`}
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))
                )}
              </div>

              <form onSubmit={handleAddTags} style={{ display: 'flex', gap: 8 }}>
                <input
                  className="field-input"
                  type="text"
                  value={newTagInput}
                  onChange={(e) => setNewTagInput(e.target.value)}
                  placeholder="Add tags (comma-separated)..."
                />
                <button type="submit" className="btn btn-secondary">
                  <Plus size={16} /> Add
                </button>
              </form>
            </div>

            <div className="surface-card">
              <div className="section-header" style={{ marginBottom: 10 }}>
                <h2 className="section-title">Collections</h2>
                <Link to="/collections" style={{ fontSize: '0.84rem', fontWeight: 600 }}>
                  Manage →
                </Link>
              </div>

              {collections.length === 0 ? (
                <p className="category-card-meta" style={{ margin: 0 }}>
                  No collections yet. Create one on the Collections page.
                </p>
              ) : (
                <div className="tag-row">
                  {collections.map((col) => {
                    const active = memberCollectionIds.has(col.id);
                    return (
                      <button
                        key={col.id}
                        type="button"
                        className={`tag-chip interactive ${active ? 'active' : ''}`}
                        onClick={() => handleToggleCollection(col.id)}
                      >
                        <FolderHeart size={13} />
                        {col.name}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <SharePanel resource={resource} />
          </div>
        </div>
      )}
    </div>
  );
}
