import { useEffect, useState } from 'react';
import {
  Bookmark,
  Eye,
  EyeOff,
  FolderHeart,
  Grid2x2,
  Heart,
  LayoutDashboard,
  Library,
  LogOut,
  Menu,
  Settings,
  Sparkles,
  X,
} from 'lucide-react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import CalmBackdrop from './CalmBackdrop';

const PRIMARY_LINKS = [
  { to: '/', label: 'Sanctuary', icon: LayoutDashboard, end: true },
  { to: '/library', label: 'Library', icon: Library },
  { to: '/categories', label: 'Categories', icon: Grid2x2 },
  { to: '/collections', label: 'Collections', icon: FolderHeart },
  { to: '/favorites', label: 'Favourites', icon: Heart },
  { to: '/references', label: 'References', icon: Bookmark },
];

const ATMOSPHERES_STYLE_1 = [
  { id: 'twilight', label: 'Twilight Lake', dot: '#234452' },
  { id: 'dawn', label: 'Misty Dawn', dot: '#dbe8df' },
  { id: 'forest', label: 'Forest Sanctuary', dot: '#284d3f' },
];

const ATMOSPHERES_STYLE_2 = [
  { id: 'mirror', label: 'Infinite Mirror Sea', dot: '#f0bcc4' },
  { id: 'dunes', label: 'Silk Sand Dunes', dot: '#c8b7de' },
  { id: 'pavilion', label: 'Cloud Pavilion', dot: '#f5cb98' },
];

const ATMOSPHERES_STYLE_3 = [
  { id: 'nebula', label: 'Violet Nebula', dot: '#c084fc' },
  { id: 'stargate', label: 'Andromeda Galaxy', dot: '#38bdf8' },
  { id: 'aurora', label: 'Webb Deep Field', dot: '#fbbf24' },
];

export default function AppShell() {
  const { signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [zenMode, setZenMode] = useState(false);

  const [designStyle, setDesignStyle] = useState(() => {
    try {
      return localStorage.getItem('creativehub_design_style') || 'cosmos';
    } catch {
      return 'cosmos';
    }
  });

  const [style1Atmosphere, setStyle1Atmosphere] = useState(() => {
    try {
      const saved = localStorage.getItem('creativehub_style1_atmosphere');
      if (saved && (saved === 'twilight' || saved === 'dawn' || saved === 'forest')) return saved;
      return 'twilight';
    } catch {
      return 'twilight';
    }
  });

  const [style2Atmosphere, setStyle2Atmosphere] = useState(() => {
    try {
      const saved = localStorage.getItem('creativehub_style2_atmosphere');
      if (saved && (saved === 'mirror' || saved === 'dunes' || saved === 'pavilion')) return saved;
      return 'mirror';
    } catch {
      return 'mirror';
    }
  });

  const [style3Atmosphere, setStyle3Atmosphere] = useState(() => {
    try {
      const saved = localStorage.getItem('creativehub_style3_atmosphere');
      if (saved && (saved === 'nebula' || saved === 'stargate' || saved === 'aurora')) return saved;
      return 'nebula';
    } catch {
      return 'nebula';
    }
  });

  const activeBackdrop =
    designStyle === 'cosmos'
      ? style3Atmosphere
      : designStyle === 'atelier'
        ? style2Atmosphere
        : style1Atmosphere;

  const currentAtmospheres =
    designStyle === 'cosmos'
      ? ATMOSPHERES_STYLE_3
      : designStyle === 'atelier'
        ? ATMOSPHERES_STYLE_2
        : ATMOSPHERES_STYLE_1;

  const setAtmosphere =
    designStyle === 'cosmos'
      ? setStyle3Atmosphere
      : designStyle === 'atelier'
        ? setStyle2Atmosphere
        : setStyle1Atmosphere;

  const navLinks = PRIMARY_LINKS.map((item) =>
    item.to === '/'
      ? {
          ...item,
          label:
            designStyle === 'cosmos'
              ? 'Observatory'
              : designStyle === 'atelier'
                ? 'Pavilion'
                : 'Sanctuary',
        }
      : item
  );

  useEffect(() => {
    document.documentElement.setAttribute('data-style', designStyle);
    document.documentElement.setAttribute('data-atmosphere', activeBackdrop);
    try {
      localStorage.setItem('creativehub_design_style', designStyle);
      localStorage.setItem('creativehub_style1_atmosphere', style1Atmosphere);
      localStorage.setItem('creativehub_style2_atmosphere', style2Atmosphere);
      localStorage.setItem('creativehub_style3_atmosphere', style3Atmosphere);
    } catch {
      // ignore storage errors
    }
  }, [designStyle, style1Atmosphere, style2Atmosphere, style3Atmosphere, activeBackdrop]);

  return (
    <div className={`sanctuary-shell ${zenMode ? 'zen-active' : ''}`} data-style={designStyle}>
      <CalmBackdrop designStyle={designStyle} atmosphere={activeBackdrop} />

      <div className="floating-dock-wrap">
        <header className="floating-dock">
          <NavLink to="/" className="brand-mark">
            <span className="brand-icon-box">
              <Sparkles size={17} />
            </span>
            <span>CreativeHub</span>
          </NavLink>

          <nav className="dock-nav" aria-label="Main navigation">
            {navLinks.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) => `dock-link ${isActive ? 'active' : ''}`}
                >
                  <Icon size={15} />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>

          <div className="dock-actions">
            <div className="style-toggle-pill" role="group" aria-label="Switch visual style">
              <button
                type="button"
                className={`style-toggle-btn ${designStyle === 'sanctuary' ? 'active' : ''}`}
                onClick={() => setDesignStyle('sanctuary')}
              >
                Style 1
              </button>
              <button
                type="button"
                className={`style-toggle-btn ${designStyle === 'atelier' ? 'active' : ''}`}
                onClick={() => setDesignStyle('atelier')}
              >
                Style 2
              </button>
              <button
                type="button"
                className={`style-toggle-btn ${designStyle === 'cosmos' ? 'active' : ''}`}
                onClick={() => setDesignStyle('cosmos')}
              >
                Style 3
              </button>
            </div>

            <div className="mood-switcher" title="Switch calm atmosphere">
              {currentAtmospheres.map((mood) => (
                <button
                  key={mood.id}
                  type="button"
                  className={`mood-btn ${activeBackdrop === mood.id ? 'active' : ''}`}
                  style={{ background: mood.dot }}
                  onClick={() => setAtmosphere(mood.id)}
                  aria-label={mood.label}
                  title={mood.label}
                />
              ))}
            </div>

            <button
              type="button"
              className="icon-pill-btn"
              onClick={() => setZenMode((prev) => !prev)}
              title={zenMode ? 'Show workspace' : 'Zen View (admire scenery)'}
              aria-label={zenMode ? 'Show workspace' : 'Zen View'}
            >
              {zenMode ? <Eye size={16} /> : <EyeOff size={16} />}
            </button>

            <NavLink to="/settings" className="icon-pill-btn" title="Settings" aria-label="Settings">
              <Settings size={16} />
            </NavLink>

            <button
              type="button"
              className="icon-pill-btn"
              onClick={signOut}
              title="Sign Out"
              aria-label="Sign Out"
            >
              <LogOut size={16} />
            </button>

            <button
              type="button"
              className="icon-pill-btn mobile-menu-toggle"
              onClick={() => setMobileOpen((prev) => !prev)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X size={17} /> : <Menu size={17} />}
            </button>
          </div>
        </header>

        {mobileOpen && !zenMode && (
          <nav className="mobile-drawer" aria-label="Mobile navigation">
            {navLinks.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) => `dock-link ${isActive ? 'active' : ''}`}
                >
                  <Icon size={16} />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        )}
      </div>

      <main className="main-area">
        <Outlet />
      </main>
    </div>
  );
}
