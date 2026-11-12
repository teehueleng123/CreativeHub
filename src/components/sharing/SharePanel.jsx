import { useCallback, useEffect, useState } from 'react';
import { Ban, Check, Copy, Link2, Share2, Trash2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabaseClient';

function generateShareToken() {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

function getExpirationTimestamp(expiryChoice) {
  if (expiryChoice === 'never') return null;
  const hoursMap = {
    '24h': 24,
    '7d': 24 * 7,
    '30d': 24 * 30,
  };
  const hours = hoursMap[expiryChoice];
  if (!hours) return null;
  return new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
}

function getLinkStatus(link) {
  if (link.revoked_at) return 'Revoked';
  if (link.expires_at && new Date(link.expires_at).getTime() <= Date.now()) return 'Expired';
  return 'Active';
}

export default function SharePanel({ resource }) {
  const { user } = useAuth();
  const [links, setLinks] = useState([]);
  const [permission, setPermission] = useState('view');
  const [expiry, setExpiry] = useState('7d');
  const [creating, setCreating] = useState(false);
  const [copiedId, setCopiedId] = useState('');
  const [error, setError] = useState('');

  const loadLinks = useCallback(async () => {
    if (!user || !supabase || !resource?.id) return;
    const { data, error: fetchError } = await supabase
      .from('share_links')
      .select('*')
      .eq('resource_id', resource.id)
      .order('created_at', { ascending: false });

    if (fetchError) setError(fetchError.message);
    else setLinks(data ?? []);
  }, [user, resource?.id]);

  useEffect(() => {
    loadLinks();
  }, [loadLinks]);

  const handleCreate = async (event) => {
    event.preventDefault();
    if (!user || !supabase || !resource) return;

    setCreating(true);
    setError('');

    const token = generateShareToken();
    const expiresAt = getExpirationTimestamp(expiry);

    const { error: insertError } = await supabase.from('share_links').insert({
      resource_id: resource.id,
      user_id: user.id,
      token,
      permission,
      expires_at: expiresAt,
    });

    setCreating(false);

    if (insertError) setError(insertError.message);
    else loadLinks();
  };

  const handleCopy = async (link) => {
    const shareUrl = `${window.location.origin}/share/${link.token}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedId(link.id);
      setTimeout(() => setCopiedId(''), 2000);
    } catch {
      window.prompt('Copy this share link:', shareUrl);
    }
  };

  const handleRevoke = async (linkId) => {
    if (!supabase) return;
    const { error: updateError } = await supabase
      .from('share_links')
      .update({ revoked_at: new Date().toISOString() })
      .eq('id', linkId);

    if (updateError) setError(updateError.message);
    else loadLinks();
  };

  const handleDeleteLink = async (linkId) => {
    if (!supabase) return;
    const { error: delError } = await supabase.from('share_links').delete().eq('id', linkId);
    if (delError) setError(delError.message);
    else loadLinks();
  };

  return (
    <div className="surface-card">
      <div className="section-header" style={{ marginBottom: 10 }}>
        <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Share2 size={18} /> Share Resource
        </h2>
      </div>

      <p className="category-card-meta" style={{ marginTop: 0, marginBottom: 14 }}>
        Recipients can only access this single resource—never your private library. Note: browser
        view-only mode hides download controls, but cannot prevent screenshots or browser saving.
      </p>

      {error && <div className="status-banner error">{error}</div>}

      <form className="auth-form" onSubmit={handleCreate} style={{ marginBottom: 18 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <label className="field-label">
            Permission
            <select
              className="field-input"
              value={permission}
              onChange={(e) => setPermission(e.target.value)}
            >
              <option value="view">View Only</option>
              {resource.resource_kind === 'file' && (
                <option value="download">Preview &amp; Download</option>
              )}
            </select>
          </label>

          <label className="field-label">
            Expires In
            <select
              className="field-input"
              value={expiry}
              onChange={(e) => setExpiry(e.target.value)}
            >
              <option value="24h">24 Hours</option>
              <option value="7d">7 Days</option>
              <option value="30d">30 Days</option>
              <option value="never">No Expiry</option>
            </select>
          </label>
        </div>

        <button type="submit" className="btn btn-primary" disabled={creating}>
          <Link2 size={16} /> {creating ? 'Generating Link...' : 'Generate Share Link'}
        </button>
      </form>

      {links.length > 0 && (
        <div style={{ display: 'grid', gap: 10 }}>
          {links.map((link) => {
            const status = getLinkStatus(link);
            const isActive = status === 'Active';
            return (
              <div
                key={link.id}
                style={{
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '10px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 10,
                  flexWrap: 'wrap',
                  background: 'var(--bg-canvas)',
                }}
              >
                <div style={{ fontSize: '0.82rem' }}>
                  <div style={{ fontWeight: 700 }}>
                    {link.permission === 'download' ? 'Preview & Download' : 'View Only'} ·{' '}
                    <span
                      style={{
                        color: isActive ? 'var(--accent-emerald)' : 'var(--accent-primary)',
                      }}
                    >
                      {status}
                    </span>
                  </div>
                  <div className="category-card-meta">
                    Views: {link.access_count} ·{' '}
                    {link.expires_at
                      ? `Expires ${new Date(link.expires_at).toLocaleDateString()}`
                      : 'No expiry'}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 6 }}>
                  {isActive && (
                    <>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        style={{ padding: '6px 10px', fontSize: '0.8rem' }}
                        onClick={() => handleCopy(link)}
                      >
                        {copiedId === link.id ? <Check size={14} /> : <Copy size={14} />}
                        {copiedId === link.id ? 'Copied' : 'Copy'}
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        style={{ padding: '6px 10px', fontSize: '0.8rem' }}
                        onClick={() => handleRevoke(link.id)}
                        title="Revoke link immediately"
                      >
                        <Ban size={14} /> Revoke
                      </button>
                    </>
                  )}
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ padding: '6px 10px', fontSize: '0.8rem' }}
                    onClick={() => handleDeleteLink(link.id)}
                    title="Delete link record"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
