import { useEffect, useState } from 'react';
import { useAuth } from './context/AuthContext';
import { supabase } from './lib/supabaseClient';

export default function App() {
  const { user, loading, isSupabaseConfigured, signIn, signUp, signOut } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState('signin');
  const [feedback, setFeedback] = useState({ type: '', message: '' });
  const [categories, setCategories] = useState([]);
  const [dbError, setDbError] = useState('');

  useEffect(() => {
    if (!user || !supabase) {
      setCategories([]);
      setDbError('');
      return;
    }

    supabase
      .from('categories')
      .select('id, name, color')
      .order('sort_order', { ascending: true })
      .then(({ data, error }) => {
        if (error) {
          setDbError(error.message);
        } else {
          setCategories(data ?? []);
          setDbError('');
        }
      });
  }, [user]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFeedback({ type: '', message: '' });

    try {
      const action = mode === 'signup' ? signUp : signIn;
      const { error } = await action(email.trim(), password);
      if (error) {
        setFeedback({ type: 'error', message: error.message });
      } else if (mode === 'signup') {
        setFeedback({
          type: 'success',
          message: 'Account created! Check your email if confirmation is enabled, or sign in.',
        });
      }
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  return (
    <main className="foundation-shell">
      <section className="foundation-card">
        <span className="foundation-badge">Phase 1 · Project Foundation</span>
        <h1 className="foundation-title">CreativeHub</h1>
        <p className="foundation-subtitle">
          Personal cloud-based digital asset management system (Free-tier architecture).
        </p>

        {!isSupabaseConfigured && (
          <div className="status-banner warning">
            <strong>Supabase not configured yet.</strong> Copy <code>.env.example</code> to{' '}
            <code>.env</code> and add your Supabase Project URL and Anon Key, then restart Vite.
          </div>
        )}

        {loading && <p>Checking session...</p>}

        {isSupabaseConfigured && !loading && !user && (
          <form className="auth-form" onSubmit={handleSubmit}>
            {feedback.message && (
              <div className={`status-banner ${feedback.type}`}>{feedback.message}</div>
            )}

            <label className="field-label">
              Email
              <input
                className="field-input"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </label>

            <label className="field-label">
              Password (min 6 characters)
              <input
                className="field-input"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </label>

            <div className="btn-row">
              <button className="btn btn-primary" type="submit">
                {mode === 'signup' ? 'Create Account' : 'Sign In'}
              </button>
              <button
                className="btn btn-secondary"
                type="button"
                onClick={() => {
                  setFeedback({ type: '', message: '' });
                  setMode(mode === 'signup' ? 'signin' : 'signup');
                }}
              >
                {mode === 'signup' ? 'Already have an account? Sign In' : 'Need an account? Sign Up'}
              </button>
            </div>
          </form>
        )}

        {isSupabaseConfigured && !loading && user && (
          <div>
            <div className="status-banner success">
              Signed in as <strong>{user.email}</strong>
            </div>

            {dbError ? (
              <div className="status-banner error">
                Database check failed: {dbError}. Make sure you ran all 3 SQL migrations in Supabase.
              </div>
            ) : (
              <>
                <p>
                  <strong>Database &amp; RLS verified:</strong> Loaded {categories.length} default
                  categories from PostgreSQL.
                </p>
                <ul className="category-list">
                  {categories.map((cat) => (
                    <li className="category-pill" key={cat.id}>
                      <span className="category-dot" style={{ backgroundColor: cat.color }} />
                      {cat.name}
                    </li>
                  ))}
                </ul>
              </>
            )}

            <button className="btn btn-secondary" type="button" onClick={signOut}>
              Sign Out
            </button>
          </div>
        )}
      </section>
    </main>
  );
}
