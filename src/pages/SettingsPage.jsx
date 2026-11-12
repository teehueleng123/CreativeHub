import { useEffect, useState } from 'react';
import { Download } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { formatBytes } from '../lib/fileValidation';
import { supabase } from '../lib/supabaseClient';

const FREE_STORAGE_LIMIT_BYTES = 1024 * 1024 * 1024; // 1 GB Supabase Free

export default function SettingsPage() {
  const { user, signOut } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [usedBytes, setUsedBytes] = useState(0);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  useEffect(() => {
    if (!user || !supabase) return;

    Promise.all([
      supabase.from('profiles').select('display_name').eq('id', user.id).maybeSingle(),
      supabase.from('resources').select('file_size_bytes').eq('resource_kind', 'file'),
    ]).then(([profRes, sizeRes]) => {
      if (profRes.data?.display_name) setDisplayName(profRes.data.display_name);
      const total = (sizeRes.data ?? []).reduce(
        (sum, row) => sum + (Number(row.file_size_bytes) || 0),
        0
      );
      setUsedBytes(total);
    });
  }, [user]);

  const handleSave = async (event) => {
    event.preventDefault();
    if (!user || !supabase) return;

    setSaving(true);
    setFeedback({ type: '', message: '' });

    const { error } = await supabase.from('profiles').upsert({
      id: user.id,
      display_name: displayName.trim() || null,
    });

    if (error) {
      setFeedback({ type: 'error', message: error.message });
    } else {
      setFeedback({ type: 'success', message: 'Profile display name updated.' });
    }
    setSaving(false);
  };

  const handleExportBackup = async () => {
    if (!user || !supabase) return;
    setExporting(true);
    setFeedback({ type: '', message: '' });

    try {
      const [resData, catData, tagData, colData] = await Promise.all([
        supabase.from('resources').select('*').order('created_at', { ascending: false }),
        supabase.from('categories').select('*'),
        supabase.from('tags').select('*'),
        supabase.from('collections').select('*, collection_items(resource_id)'),
      ]);

      const firstError = resData.error || catData.error || tagData.error || colData.error;
      if (firstError) throw firstError;

      const backupPayload = {
        exported_at: new Date().toISOString(),
        user_email: user.email,
        categories: catData.data ?? [],
        tags: tagData.data ?? [],
        collections: colData.data ?? [],
        resources: resData.data ?? [],
      };

      const blob = new Blob([JSON.stringify(backupPayload, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `creativehub-backup-${new Date().toISOString().slice(0, 10)}.json`;
      anchor.click();
      URL.revokeObjectURL(url);

      setFeedback({ type: 'success', message: 'Library metadata backup downloaded.' });
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Export failed.' });
    } finally {
      setExporting(false);
    }
  };

  const usagePercent = Math.min(100, Math.round((usedBytes / FREE_STORAGE_LIMIT_BYTES) * 100));

  return (
    <div style={{ maxWidth: 680, display: 'grid', gap: 20 }}>
      <header className="page-header" style={{ marginBottom: 4 }}>
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">
            Manage your studio profile, free-tier storage quota, and metadata backups.
          </p>
        </div>
      </header>

      {feedback.message && (
        <div className={`status-banner ${feedback.type}`}>{feedback.message}</div>
      )}

      <div className="surface-card">
        <h2 className="section-title" style={{ marginBottom: 14 }}>
          Account Profile
        </h2>

        <form className="auth-form" onSubmit={handleSave}>
          <label className="field-label">
            Signed-in Email
            <input className="field-input" type="email" value={user?.email || ''} disabled />
          </label>

          <label className="field-label">
            Display Name
            <input
              className="field-input"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. Alex Studio"
            />
          </label>

          <div className="header-actions">
            <button className="btn btn-primary" type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <button className="btn btn-secondary" type="button" onClick={signOut}>
              Sign Out
            </button>
          </div>
        </form>
      </div>

      <div className="surface-card">
        <h2 className="section-title" style={{ marginBottom: 8 }}>
          Free-Tier Storage Quota
        </h2>
        <p className="page-subtitle" style={{ marginBottom: 12 }}>
          Original files used: <strong>{formatBytes(usedBytes) || '0 B'}</strong> of{' '}
          <strong>1 GB</strong> ({usagePercent}%). Max single upload: <strong>50 MB</strong>.
        </p>

        <div
          style={{
            height: 10,
            borderRadius: 999,
            background: 'var(--bg-subtle)',
            overflow: 'hidden',
            marginBottom: 12,
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${usagePercent}%`,
              background: usagePercent > 85 ? '#dc2626' : 'var(--accent-secondary)',
            }}
          />
        </div>

        <p className="category-card-meta" style={{ margin: 0 }}>
          Tip: Save heavy stock packs as <strong>Saved References</strong> to keep storage light.
          Supabase Free projects pause after 7 days of inactivity—click <em>Restore project</em> in
          Supabase anytime to resume.
        </p>
      </div>

      <div className="surface-card">
        <h2 className="section-title" style={{ marginBottom: 8 }}>
          Backup &amp; Recovery
        </h2>
        <p className="page-subtitle" style={{ marginBottom: 14 }}>
          Download a JSON snapshot of all your resource metadata, external URLs, tags, notes, and
          collections for safekeeping.
        </p>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={handleExportBackup}
          disabled={exporting}
        >
          <Download size={16} />
          {exporting ? 'Preparing Backup...' : 'Export Metadata Backup (JSON)'}
        </button>
      </div>
    </div>
  );
}
