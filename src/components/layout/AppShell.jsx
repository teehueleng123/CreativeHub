import { useState } from 'react';
import {
  Bookmark,
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

const PRIMARY_LINKS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/library', label: 'My Library', icon: Library },
  { to: '/categories', label: 'Categories', icon: Grid2x2 },
  { to: '/collections', label: 'Collections', icon: FolderHeart },
  { to: '/favorites', label: 'Favourites', icon: Heart },
  { to: '/references', label: 'Saved References', icon: Bookmark },
];

export default function AppShell() {
  const { user, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const closeMenu = () => setMobileOpen(false);

  return (
    <div className="app-shell">
      <header className="mobile-topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 700 }}>
          <span className="brand-icon-box">
            <Sparkles size={18} />
          </span>
          CreativeHub
        </div>
        <button
          type="button"
          className="btn btn-secondary"
          style={{ padding: '6px 10px' }}
          onClick={() => setMobileOpen((prev) => !prev)}
          aria-label="Toggle navigation"
        >
          {mobileOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </header>

      {mobileOpen && <div className="mobile-backdrop" onClick={closeMenu} />}

      <aside className={`sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
        <div>
          <div className="brand-mark">
            <span className="brand-icon-box">
              <Sparkles size={18} />
            </span>
            <span>CreativeHub</span>
          </div>

          <div className="nav-section-label">Workspace</div>
          <nav className="nav-group">
            {PRIMARY_LINKS.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={closeMenu}
                  className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>

          <div className="nav-section-label">Account</div>
          <nav className="nav-group">
            <NavLink
              to="/settings"
              onClick={closeMenu}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <Settings size={18} />
              <span>Settings</span>
            </NavLink>
          </nav>
        </div>

        <div className="sidebar-footer">
          <div className="user-chip" title={user?.email}>
            {user?.email}
          </div>
          <button
            type="button"
            className="nav-link"
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', width: '100%' }}
            onClick={signOut}
          >
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      <main className="main-area">
        <Outlet />
      </main>
    </div>
  );
}
