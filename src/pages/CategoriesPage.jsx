import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import CategoryIcon from '../components/ui/CategoryIcon';
import { useAuth } from '../context/AuthContext';
import { useLibraryOverview } from '../hooks/useLibraryOverview';
import { STUDIO_COLORS, slugifyCategory } from '../lib/organisationHelpers';
import { supabase } from '../lib/supabaseClient';

const ICON_OPTIONS = ['folder', 'image', 'film', 'video', 'sparkles', 'layers', 'wand-2'];

export default function CategoriesPage() {
  const { user } = useAuth();
  const { categories, resources, loading, error, refresh } = useLibraryOverview();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [color, setColor] = useState(STUDIO_COLORS[0]);
  const [icon, setIcon] = useState('folder');
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const countForCategory = (categoryId) =>
    resources.filter((item) => item.category_id === categoryId).length;

  const handleCreate = async (event) => {
    event.preventDefault();
    if (!user || !supabase) return;

    const cleanName = name.trim();
    const slug = slugifyCategory(cleanName);
    if (!cleanName || !slug) {
      setFormError('Please enter a valid category name.');
      return;
    }

    setSaving(true);
    setFormError('');

    const { error: insertError } = await supabase.from('categories').insert({
      user_id: user.id,
      name: cleanName,
      slug,
      color,
      icon,
      is_default: false,
      sort_order: 200,
    });

    setSaving(false);

    if (insertError) {
      setFormError(insertError.message);
    } else {
      setName('');
      setShowForm(false);
      refresh();
    }
  };

  const handleDeleteCustom = async (cat) => {
    if (!supabase || cat.is_default) return;
    if (!window.confirm(`Delete custom category "${cat.name}"? Resources inside become uncategorized.`)) {
      return;
    }
    const { error: delError } = await supabase.from('categories').delete().eq('id', cat.id);
    if (delError) setFormError(delError.message);
    else refresh();
  };

  return (
    <div>
      <header className="page-header">
        <div>
          <h1 className="page-title">Categories</h1>
          <p className="page-subtitle">
            Browse default creative disciplines or create your own custom categories.
          </p>
        </div>

        <button type="button" className="btn btn-primary" onClick={() => setShowForm((v) => !v)}>
          <Plus size={16} /> {showForm ? 'Close Form' : 'New Custom Category'}
        </button>
      </header>

      {(error || formError) && <div className="status-banner error">{error || formError}</div>}

      {showForm && (
        <form className="surface-card auth-form" style={{ marginBottom: 24, maxWidth: 520 }} onSubmit={handleCreate}>
          <h2 className="section-title" style={{ margin: 0 }}>Create Custom Category</h2>

          <label className="field-label">
            Category Name
            <input
              className="field-input"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. 3D Models & LUTs"
            />
          </label>

          <div className="field-label">
            Accent Colour
            <div className="swatch-row">
              {STUDIO_COLORS.map((swatch) => (
                <button
                  key={swatch}
                  type="button"
                  className={`swatch-dot ${color === swatch ? 'selected' : ''}`}
                  style={{ backgroundColor: swatch }}
                  onClick={() => setColor(swatch)}
                  aria-label={`Select colour ${swatch}`}
                />
              ))}
            </div>
          </div>

          <label className="field-label">
            Icon
            <select className="field-input" value={icon} onChange={(e) => setIcon(e.target.value)}>
              {ICON_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </label>

          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Creating...' : 'Create Category'}
          </button>
        </form>
      )}

      {loading && <p className="page-subtitle">Loading categories...</p>}

      <div className="category-grid">
        {categories.map((cat) => (
          <div key={cat.id} className="category-card" style={{ justifyContent: 'space-between' }}>
            <Link
              to={`/library?category=${cat.id}`}
              style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1, minWidth: 0 }}
            >
              <div className="category-icon-wrap" style={{ backgroundColor: cat.color }}>
                <CategoryIcon name={cat.icon} size={22} />
              </div>
              <div>
                <div className="category-card-title">{cat.name}</div>
                <div className="category-card-meta">
                  {countForCategory(cat.id)} resources · {cat.is_default ? 'Default' : 'Custom'}
                </div>
              </div>
            </Link>

            {!cat.is_default && (
              <button
                type="button"
                className="btn btn-secondary"
                style={{ padding: 8 }}
                onClick={() => handleDeleteCustom(cat)}
                title="Delete custom category"
              >
                <Trash2 size={15} />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
