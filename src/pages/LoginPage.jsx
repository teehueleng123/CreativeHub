import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { user, loading, isSupabaseConfigured, signIn, signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState('signin');
  const [feedback, setFeedback] = useState({ type: '', message: '' });
  const [submitting, setSubmitting] = useState(false);

  if (!loading && user) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFeedback({ type: '', message: '' });
    setSubmitting(true);

    try {
      const action = mode === 'signup' ? signUp : signIn;
      const { error } = await action(email.trim(), password);
      if (error) {
        setFeedback({ type: 'error', message: error.message });
      } else if (mode === 'signup') {
        setFeedback({
          type: 'success',
          message: 'Account created! Verify your email if required, then sign in.',
        });
      }
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-shell">
      <section className="auth-showcase">
        <div className="auth-showcase-brand">
          <span className="brand-icon-box">
            <Sparkles size={18} />
          </span>
          CreativeHub
        </div>

        <div>
          <h1 className="auth-showcase-title">Your personal creative cloud studio.</h1>
          <p className="auth-showcase-copy">
            Collect visual effects, textures, clips, motion graphics, and inspiration links in one
            private, organised library—accessible from any device.
          </p>
          <div className="auth-swatch-row">
            <span className="auth-swatch">Images</span>
            <span className="auth-swatch">Video Clips</span>
            <span className="auth-swatch">Visual Effects</span>
            <span className="auth-swatch">Textures</span>
            <span className="auth-swatch">Motion Graphics</span>
          </div>
        </div>

        <p style={{ fontSize: '0.84rem', color: 'var(--text-on-dark-muted)', margin: 0 }}>
          Private by default · Row Level Security · Up to 50 MB per file on Supabase Free
        </p>
      </section>

      <section className="auth-panel">
        <div className="auth-card">
          <h2 style={{ fontFamily: 'var(--font-display)', margin: '0 0 6px', fontSize: '1.65rem' }}>
            {mode === 'signup' ? 'Create your studio' : 'Welcome back'}
          </h2>
          <p className="page-subtitle" style={{ marginBottom: 20 }}>
            {mode === 'signup'
              ? 'Sign up to start building your private creative library.'
              : 'Sign in to access your saved assets and references.'}
          </p>

          {!isSupabaseConfigured && (
            <div className="status-banner warning">
              Missing Supabase configuration. Check your <code>.env</code> file.
            </div>
          )}

          {feedback.message && (
            <div className={`status-banner ${feedback.type}`}>{feedback.message}</div>
          )}

          <form className="auth-form" onSubmit={handleSubmit}>
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
              Password
              <input
                className="field-input"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 6 characters"
              />
            </label>

            <button className="btn btn-primary" type="submit" disabled={submitting || !isSupabaseConfigured}>
              {submitting ? 'Please wait...' : mode === 'signup' ? 'Create Account' : 'Sign In'}
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
          </form>
        </div>
      </section>
    </div>
  );
}
