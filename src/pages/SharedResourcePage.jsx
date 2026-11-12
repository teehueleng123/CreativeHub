import { useEffect, useState } from 'react';
import { Download, ExternalLink, FileText, ShieldAlert, Sparkles } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { formatBytes } from '../lib/fileValidation';

export default function SharedResourcePage() {
  const { token } = useParams();
  const [payload, setPayload] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey || !token) {
      setError('Invalid share configuration or token.');
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);
    setError('');

    fetch(`${supabaseUrl}/functions/v1/resolve-share?token=${encodeURIComponent(token)}`, {
      method: 'GET',
      headers: {
        apikey: supabaseAnonKey,
      },
    })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data.error || 'Unable to load shared resource.');
        }
        return data;
      })
      .then((data) => {
        if (active) setPayload(data);
      })
      .catch((err) => {
        if (active) setError(err.message || 'Share link could not be verified.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [token]);

  const renderSharedPreview = () => {
    if (!payload?.resource) return null;
    const { resource, previewUrl, permission } = payload;

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
      return <p style={{ color: '#a1a1aa' }}>Preview unavailable.</p>;
    }

    const mime = resource.mime_type || '';
    const isViewOnly = permission !== 'download';

    if (mime.startsWith('image/')) {
      return <img src={previewUrl} alt={resource.title} />;
    }
    if (mime.startsWith('video/')) {
      return (
        <video
          src={previewUrl}
          controls
          playsInline
          controlsList={isViewOnly ? 'nodownload' : undefined}
        />
      );
    }
    if (mime.startsWith('audio/')) {
      return (
        <audio
          src={previewUrl}
          controls
          controlsList={isViewOnly ? 'nodownload' : undefined}
          style={{ width: '100%' }}
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
    <main style={{ minHeight: '100vh', padding: '28px 20px', maxWidth: 1040, margin: '0 auto' }}>
      <header className="page-header">
        <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, fontWeight: 700 }}>
          <span className="brand-icon-box">
            <Sparkles size={18} />
          </span>
          <span>CreativeHub Shared Asset</span>
        </Link>
      </header>

      {loading && <p className="page-subtitle">Validating share link...</p>}

      {!loading && error && (
        <div className="empty-state">
          <div className="empty-state-icon">
            <ShieldAlert size={24} />
          </div>
          <h3>Access Unavailable</h3>
          <p>{error}</p>
        </div>
      )}

      {!loading && payload?.resource && (
        <div className="detail-grid">
          <div className="preview-stage">{renderSharedPreview()}</div>

          <div className="surface-card">
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
              <span className="pill-badge">
                {payload.permission === 'download' ? 'Preview & Download' : 'View Only'}
              </span>
              {payload.resource.categories && (
                <span className="pill-badge">{payload.resource.categories.name}</span>
              )}
            </div>

            <h1 className="page-title" style={{ fontSize: '1.65rem', marginBottom: 8 }}>
              {payload.resource.title}
            </h1>
            <p className="page-subtitle" style={{ marginBottom: 18 }}>
              {payload.resource.description || 'Shared via CreativeHub.'}
            </p>

            <div style={{ display: 'grid', gap: 10, fontSize: '0.9rem', marginBottom: 20 }}>
              {payload.resource.resource_kind === 'file' && (
                <div>
                  <strong>File:</strong> {payload.resource.file_name} (
                  {formatBytes(payload.resource.file_size_bytes)})
                </div>
              )}
              <div>
                <strong>Licence:</strong> {payload.resource.license_info || 'Not specified'}
              </div>
              {payload.expires_at && (
                <div>
                  <strong>Link Expires:</strong> {new Date(payload.expires_at).toLocaleString()}
                </div>
              )}
            </div>

            {payload.permission === 'download' && payload.downloadUrl && (
              <a
                className="btn btn-primary"
                href={payload.downloadUrl}
                download={payload.resource.file_name || payload.resource.title}
              >
                <Download size={16} /> Download Original File
              </a>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
