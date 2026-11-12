import { useEffect, useState } from 'react';
import { Link2, Upload, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  formatBytes,
  validateExternalUrl,
  validateUploadFile,
} from '../../lib/fileValidation';
import {
  attachTagsToResource,
  parseTagInput,
  setResourceCollectionMembership,
} from '../../lib/organisationHelpers';
import {
  removeAssetFiles,
  uploadAssetFile,
  uploadThumbnailBlob,
} from '../../lib/storageHelpers';
import { supabase } from '../../lib/supabaseClient';
import { generateBrowserThumbnail } from '../../lib/thumbnailGenerator';

export default function ResourceFormModal({
  isOpen,
  initialMode = 'file',
  categories = [],
  collections = [],
  onClose,
  onSuccess,
}) {
  const { user } = useAuth();
  const [mode, setMode] = useState(initialMode);
  const [file, setFile] = useState(null);
  const [externalUrl, setExternalUrl] = useState('');
  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [collectionId, setCollectionId] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [description, setDescription] = useState('');
  const [licenseInfo, setLicenseInfo] = useState('');
  const [personalNotes, setPersonalNotes] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setFile(null);
      setExternalUrl('');
      setTitle('');
      setCategoryId(categories[0]?.id || '');
      setCollectionId('');
      setTagsInput('');
      setDescription('');
      setLicenseInfo('');
      setPersonalNotes('');
      setError('');
    }
  }, [isOpen, initialMode, categories]);

  if (!isOpen) return null;

  const handleFileChange = (event) => {
    const picked = event.target.files?.[0] || null;
    setError('');
    setFile(picked);
    if (picked && !title.trim()) {
      setTitle(picked.name.replace(/\.[^/.]+$/, ''));
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!user || !supabase) return;

    setError('');
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError('Please enter a resource title.');
      return;
    }

    const resourceId = crypto.randomUUID();
    let uploadedStoragePath = null;
    let uploadedThumbnailPath = null;

    setSubmitting(true);

    try {
      let payload = {
        id: resourceId,
        user_id: user.id,
        category_id: categoryId || null,
        resource_kind: mode,
        title: trimmedTitle,
        description: description.trim() || null,
        license_info: licenseInfo.trim() || null,
        personal_notes: personalNotes.trim() || null,
      };

      if (mode === 'file') {
        const validation = validateUploadFile(file);
        if (!validation.valid) {
          setError(validation.error);
          setSubmitting(false);
          return;
        }

        const thumbBlob = await generateBrowserThumbnail(file);

        uploadedStoragePath = await uploadAssetFile({
          userId: user.id,
          resourceId,
          file,
        });

        if (thumbBlob) {
          uploadedThumbnailPath = await uploadThumbnailBlob({
            userId: user.id,
            resourceId,
            blob: thumbBlob,
          });
        }

        payload = {
          ...payload,
          storage_path: uploadedStoragePath,
          thumbnail_path: uploadedThumbnailPath,
          file_name: file.name,
          mime_type: file.type,
          file_size_bytes: file.size,
          file_extension: validation.extension,
        };
      } else {
        const urlCheck = validateExternalUrl(externalUrl);
        if (!urlCheck.valid) {
          setError(urlCheck.error);
          setSubmitting(false);
          return;
        }

        payload = {
          ...payload,
          external_url: urlCheck.normalizedUrl,
        };
      }

      const { error: insertError } = await supabase.from('resources').insert(payload);
      if (insertError) {
        if (uploadedStoragePath || uploadedThumbnailPath) {
          await removeAssetFiles([uploadedStoragePath, uploadedThumbnailPath]).catch(() => {});
        }
        throw insertError;
      }

      const parsedTags = parseTagInput(tagsInput);
      if (parsedTags.length > 0) {
        await attachTagsToResource({ userId: user.id, resourceId, tagNames: parsedTags });
      }

      if (collectionId) {
        await setResourceCollectionMembership({ collectionId, resourceId, member: true });
      }

      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err.message || 'Could not save resource.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal-panel">
        <div className="modal-header">
          <h2 style={{ fontFamily: 'var(--font-display)', margin: 0, fontSize: '1.4rem' }}>
            Add Creative Resource
          </h2>
          <button type="button" className="btn btn-secondary" onClick={onClose} style={{ padding: 8 }}>
            <X size={18} />
          </button>
        </div>

        <div className="tab-switch">
          <button
            type="button"
            className={`tab-btn ${mode === 'file' ? 'active' : ''}`}
            onClick={() => {
              setError('');
              setMode('file');
            }}
          >
            <Upload size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />
            Upload File (≤ 50 MB)
          </button>
          <button
            type="button"
            className={`tab-btn ${mode === 'external_url' ? 'active' : ''}`}
            onClick={() => {
              setError('');
              setMode('external_url');
            }}
          >
            <Link2 size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />
            External Reference URL
          </button>
        </div>

        {error && <div className="status-banner error">{error}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          {mode === 'file' ? (
            <label className="file-dropzone">
              <input
                type="file"
                onChange={handleFileChange}
                accept="image/*,video/mp4,video/webm,video/quicktime,audio/mpeg,audio/wav,application/pdf"
                style={{ display: 'none' }}
              />
              {file ? (
                <div>
                  <strong>{file.name}</strong>
                  <div className="category-card-meta">
                    {formatBytes(file.size)} · {file.type || 'Unknown type'}
                  </div>
                </div>
              ) : (
                <div>
                  <strong>Click to choose a file from your device</strong>
                  <div className="category-card-meta">
                    Images, MP4/WebM/MOV, MP3/WAV, PDF · Max 50 MB
                  </div>
                </div>
              )}
            </label>
          ) : (
            <label className="field-label">
              External Resource URL
              <input
                className="field-input"
                type="url"
                required
                value={externalUrl}
                onChange={(e) => setExternalUrl(e.target.value)}
                placeholder="https://example.com/texture-pack"
              />
            </label>
          )}

          <label className="field-label">
            Title
            <input
              className="field-input"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Neon Dust Particles Overlay"
            />
          </label>

          <label className="field-label">
            Category
            <select
              className="field-input"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
            >
              <option value="">Uncategorized</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </label>

          <label className="field-label">
            Tags (comma-separated, optional)
            <input
              className="field-input"
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="e.g. neon, cyberpunk, dark-mood, 4k"
            />
          </label>

          {collections.length > 0 && (
            <label className="field-label">
              Add to Collection (optional)
              <select
                className="field-input"
                value={collectionId}
                onChange={(e) => setCollectionId(e.target.value)}
              >
                <option value="">None</option>
                {collections.map((col) => (
                  <option key={col.id} value={col.id}>
                    {col.name}
                  </option>
                ))}
              </select>
            </label>
          )}

          <label className="field-label">
            Description (optional)
            <textarea
              className="field-input"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short summary of what this asset is used for..."
            />
          </label>

          <label className="field-label">
            Licence &amp; Usage Rights (optional)
            <input
              className="field-input"
              type="text"
              value={licenseInfo}
              onChange={(e) => setLicenseInfo(e.target.value)}
              placeholder="e.g. CC0, Commercial OK, Attribution required"
            />
          </label>

          <label className="field-label">
            Personal Notes (optional)
            <textarea
              className="field-input"
              rows={2}
              value={personalNotes}
              onChange={(e) => setPersonalNotes(e.target.value)}
              placeholder="Private editing tips, LUT pairings, timestamps..."
            />
          </label>

          <div className="header-actions" style={{ justifyContent: 'flex-end', marginTop: 6 }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting
                ? mode === 'file'
                  ? 'Uploading...'
                  : 'Saving...'
                : mode === 'file'
                  ? 'Upload Resource'
                  : 'Save Reference'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
