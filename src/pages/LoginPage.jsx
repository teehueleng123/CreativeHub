import { useState } from 'react';
import { Eye, EyeOff, Lock, Mail, ShieldCheck, Sparkles } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import CalmBackdrop from '../components/layout/CalmBackdrop';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { user, loading, isSupabaseConfigured, signIn, signUp, enterDemo } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
      <CalmBackdrop designStyle="login" atmosphere="login" />
      <section className="auth-showcase">
        <div className="auth-showcase-brand">
          <span className="brand-icon-box">
            <Sparkles size={18} />
          </span>
          <span className="brand-title">CreativeHub</span>
        </div>

        <div>
          <span className="auth-kicker-tag">Digital Asset Vault &amp; Screening</span>
          <h1 className="auth-showcase-title">Your personal creative cloud vault.</h1>
          <p className="auth-showcase-copy">
            Collect visual effects, textures, video clips, and creative references in one
            private, high-resolution archive—accessible anywhere.
          </p>
          <div className="auth-swatch-row">
            <span className="auth-swatch">Video Clips</span>
            <span className="auth-swatch">3D Textures</span>
            <span className="auth-swatch">Motion Graphics</span>
            <span className="auth-swatch">Visual Effects</span>
            <span className="auth-swatch">Inspiration References</span>
          </div>
        </div>

        <div className="auth-trust-badge">
          <ShieldCheck size={16} />
          <span>Private by default · Row Level Security · Supabase Free Tier</span>
        </div>
      </section>

      <section className="auth-panel">
        <div className="auth-card">
          <div className="auth-mode-switch">
            <button
              type="button"
              className={`auth-mode-tab ${mode === 'signin' ? 'active' : ''}`}
              onClick={() => {
                setFeedback({ type: '', message: '' });
                setMode('signin');
              }}
            >
              Sign In
            </button>
            <button
              type="button"
              className={`auth-mode-tab ${mode === 'signup' ? 'active' : ''}`}
              onClick={() => {
                setFeedback({ type: '', message: '' });
                setMode('signup');
              }}
            >
              Create Account
            </button>
          </div>

          <div className="auth-card-header">
            <h2 className="auth-card-title">
              {mode === 'signup' ? 'Create your creative vault' : 'Welcome to CreativeHub'}
            </h2>
            <p className="auth-card-subtitle">
              {mode === 'signup'
                ? 'Sign up to start organizing your private cloud library.'
                : 'Sign in to access your saved screening assets and collections.'}
            </p>
          </div>

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
              <span>Email Address</span>
              <div className="auth-input-container">
                <Mail size={16} className="auth-input-icon" />
                <input
                  className="field-input"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  autoComplete="email"
                />
              </div>
            </label>

            <label className="field-label">
              <span>Password</span>
              <div className="auth-input-container">
                <Lock size={16} className="auth-input-icon" />
                <input
                  className="field-input"
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                />
                <button
                  type="button"
                  className="auth-password-toggle-btn"
                  onClick={() => setShowPassword((prev) => !prev)}
                  title={showPassword ? 'Hide password' : 'Reveal password'}
                  aria-label={showPassword ? 'Hide password' : 'Reveal password'}
                >
                  {showPassword ? <Eye size={17} /> : <EyeOff size={17} />}
                </button>
              </div>
            </label>

            <button className="btn btn-primary auth-submit-btn" type="submit" disabled={submitting || !isSupabaseConfigured}>
              {submitting ? 'Authenticating...' : mode === 'signup' ? 'Create Account' : 'Sign In to Studio'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: 14 }}>
            <button
              type="button"
              className="btn btn-secondary auth-demo-btn"
              style={{ width: '100%', fontSize: '0.82rem', padding: '9px 14px' }}
              onClick={enterDemo}
            >
              ✦ Enter Studio Directly (Demo Preview)
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
